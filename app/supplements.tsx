import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ThemedText } from "../components/ThemedText";
import { api } from "../convex/_generated/api";
import {
  SupplementActiveIngredient,
  SupplementFrequency,
  SupplementNutritionProfile,
  SupplementReviewDraft,
} from "../lib/domain/supplements";
import {
  PendingSupplementPhoto,
  prepareSupplementPhoto,
} from "../lib/supplements/prepareSupplementPhoto";
import { useTheme } from "../lib/theme/ThemeProvider";

const MACRO_FIELD_ORDER = [
  ["calories", "Calories"],
  ["protein", "Protein (g)"],
  ["carbs", "Carbs (g)"],
  ["fat", "Fat (g)"],
] as const;

const NUTRIENT_FIELD_ORDER = [
  ["fiber", "Fiber (g)"],
  ["sugar", "Sugar (g)"],
  ["sodium", "Sodium (mg)"],
  ["vitaminA", "Vitamin A (mcg)"],
  ["vitaminC", "Vitamin C (mg)"],
  ["vitaminD", "Vitamin D (mcg)"],
  ["vitaminE", "Vitamin E (mg)"],
  ["vitaminK", "Vitamin K (mcg)"],
  ["b6", "Vitamin B6 (mg)"],
  ["b12", "Vitamin B12 (mcg)"],
  ["folate", "Folate (mcg)"],
  ["thiamin", "Thiamin (mg)"],
  ["niacin", "Niacin (mg)"],
  ["riboflavin", "Riboflavin (mg)"],
  ["calcium", "Calcium (mg)"],
  ["iron", "Iron (mg)"],
  ["potassium", "Potassium (mg)"],
  ["magnesium", "Magnesium (mg)"],
  ["zinc", "Zinc (mg)"],
  ["phosphorus", "Phosphorus (mg)"],
  ["omega3", "Omega-3 (g)"],
  ["choline", "Choline (mg)"],
  ["selenium", "Selenium (mcg)"],
  ["copper", "Copper (mg)"],
  ["manganese", "Manganese (mg)"],
] as const;

type NutritionFieldKey =
  | (typeof MACRO_FIELD_ORDER)[number][0]
  | (typeof NUTRIENT_FIELD_ORDER)[number][0];

type IngredientDraft = {
  amount: string;
  id: string;
  name: string;
  note: string;
  unit: string;
};

type StackItem = {
  activeIngredients?: SupplementActiveIngredient[];
  brand?: string;
  frequency: SupplementFrequency;
  id: string;
  isLoggedToday: boolean;
  label: string;
  nutritionProfile: SupplementNutritionProfile;
  servingLabel: string;
  sourceKind?: "scanned" | "custom" | "legacy";
  status: "active" | "archived";
};

type EditorMode = "create" | "edit" | "scan_review";

type EditorState = {
  activeIngredients: IngredientDraft[];
  brand: string;
  displayName: string;
  frequency: SupplementFrequency;
  mode: EditorMode;
  nutritionValues: Record<NutritionFieldKey, string>;
  scanPhotoCount: number;
  servingLabel: string;
  takenToday: boolean;
  userSupplementId?: string;
};

function emptyNutritionValues(): Record<NutritionFieldKey, string> {
  return Object.fromEntries(
    [...MACRO_FIELD_ORDER, ...NUTRIENT_FIELD_ORDER].map(([key]) => [key, ""])
  ) as Record<NutritionFieldKey, string>;
}

function buildNutritionValues(
  nutritionProfile?: SupplementNutritionProfile | null
): Record<NutritionFieldKey, string> {
  const values = emptyNutritionValues();

  for (const [key] of [...MACRO_FIELD_ORDER, ...NUTRIENT_FIELD_ORDER]) {
    const value = nutritionProfile?.[key];

    if (typeof value === "number" && Number.isFinite(value) && value !== 0) {
      values[key] = `${value}`;
    }
  }

  return values;
}

function nextIngredientId() {
  return `ingredient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankIngredient(): IngredientDraft {
  return {
    amount: "",
    id: nextIngredientId(),
    name: "",
    note: "",
    unit: "",
  };
}

function buildIngredientDrafts(activeIngredients?: SupplementActiveIngredient[] | null) {
  if (!activeIngredients?.length) {
    return [createBlankIngredient()];
  }

  return activeIngredients.map((ingredient) => ({
    amount: ingredient.amount !== undefined ? `${ingredient.amount}` : "",
    id: nextIngredientId(),
    name: ingredient.name,
    note: ingredient.note ?? "",
    unit: ingredient.unit ?? "",
  }));
}

function buildEditorState(args: {
  item?: StackItem | null;
  mode: EditorMode;
  scanDraft?: SupplementReviewDraft | null;
  scanPhotoCount?: number;
}): EditorState {
  if (args.scanDraft) {
    return {
      activeIngredients: buildIngredientDrafts(args.scanDraft.activeIngredients),
      brand: args.scanDraft.brand ?? "",
      displayName: args.scanDraft.displayName,
      frequency: args.scanDraft.frequency,
      mode: args.mode,
      nutritionValues: buildNutritionValues(args.scanDraft.nutritionProfile),
      scanPhotoCount: args.scanPhotoCount ?? 1,
      servingLabel: args.scanDraft.servingLabel,
      takenToday: false,
    };
  }

  if (args.item) {
    return {
      activeIngredients: buildIngredientDrafts(args.item.activeIngredients),
      brand: args.item.brand ?? "",
      displayName: args.item.label,
      frequency: args.item.frequency,
      mode: args.mode,
      nutritionValues: buildNutritionValues(args.item.nutritionProfile),
      scanPhotoCount: 0,
      servingLabel: args.item.servingLabel,
      takenToday: false,
      userSupplementId: args.item.id,
    };
  }

  return {
    activeIngredients: [createBlankIngredient()],
    brand: "",
    displayName: "",
    frequency: "daily",
    mode: args.mode,
    nutritionValues: emptyNutritionValues(),
    scanPhotoCount: 0,
    servingLabel: "1 serving",
    takenToday: false,
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildNutritionPayload(
  nutritionValues: Record<NutritionFieldKey, string>
): SupplementNutritionProfile {
  const payload: SupplementNutritionProfile = {};

  for (const [key] of [...MACRO_FIELD_ORDER, ...NUTRIENT_FIELD_ORDER]) {
    const parsed = parseOptionalNumber(nutritionValues[key]);

    if (parsed !== undefined) {
      payload[key] = parsed;
    }
  }

  return payload;
}

function buildActiveIngredientPayload(ingredients: IngredientDraft[]) {
  const payload: SupplementActiveIngredient[] = [];

  for (const ingredient of ingredients) {
    const name = ingredient.name.trim();

    if (!name) {
      continue;
    }

    const nextIngredient: SupplementActiveIngredient = {
      name,
    };
    const amount = parseOptionalNumber(ingredient.amount);
    const note = ingredient.note.trim() || undefined;
    const unit = ingredient.unit.trim() || undefined;

    if (amount !== undefined) {
      nextIngredient.amount = amount;
    }

    if (note) {
      nextIngredient.note = note;
    }

    if (unit) {
      nextIngredient.unit = unit;
    }

    payload.push(nextIngredient);
  }

  return payload;
}

function FrequencySelector({
  onChange,
  value,
}: {
  onChange: (nextValue: SupplementFrequency) => void;
  value: SupplementFrequency;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.frequencyRow}>
      {(["daily", "as_needed"] as const).map((option) => {
        const isSelected = option === value;

        return (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.frequencyButton,
              {
                backgroundColor: isSelected ? theme.surfaceSoft : theme.card,
                borderColor: isSelected ? theme.accent1 : theme.cardBorder,
              },
            ]}
          >
            <ThemedText size="sm" variant={isSelected ? "accent1" : "secondary"}>
              {option === "daily" ? "Daily" : "As needed"}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function TogglePill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.togglePill,
        {
          backgroundColor: active ? theme.surfaceSoft : theme.card,
          borderColor: active ? theme.accent1 : theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" variant={active ? "accent1" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function StackSection({
  emptyLabel,
  items,
  onArchive,
  onEdit,
  title,
}: {
  emptyLabel: string;
  items: StackItem[];
  onArchive?: (item: StackItem) => void;
  onEdit?: (item: StackItem) => void;
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText size="sm" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {items.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {emptyLabel}
        </ThemedText>
      ) : (
        items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.stackRow,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
              index < items.length - 1 ? styles.stackRowGap : undefined,
            ]}
          >
            <View style={styles.stackRowCopy}>
              <ThemedText size="sm">{item.label}</ThemedText>
              <ThemedText size="sm" variant="secondary">
                {[item.brand, item.servingLabel].filter(Boolean).join(" • ")}
              </ThemedText>
            </View>

            <View style={styles.stackRowActions}>
              {item.isLoggedToday ? (
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <ThemedText size="xs" variant="secondary">
                    Taken today
                  </ThemedText>
                </View>
              ) : null}

              {onEdit ? (
                <Pressable accessibilityRole="button" onPress={() => onEdit(item)}>
                  <ThemedText size="sm" variant="accent1">
                    Edit
                  </ThemedText>
                </Pressable>
              ) : null}

              {onArchive ? (
                <Pressable accessibilityRole="button" onPress={() => onArchive(item)}>
                  <ThemedText size="sm" variant="secondary">
                    Archive
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function PhotoSlotCard({
  description,
  label,
  onCameraPress,
  onLibraryPress,
  photo,
}: {
  description: string;
  label: string;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  photo: PendingSupplementPhoto | null;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.captureSlot,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm">{label}</ThemedText>
      {photo ? (
        <View style={styles.captureReadyRow}>
          <ThemedText
            size="sm"
            style={[
              styles.captureReadyCheck,
              {
                color: theme.accent1,
              },
            ]}
          >
            ✓
          </ThemedText>
          <ThemedText size="sm" style={styles.captureCopy} variant="secondary">
            Photo ready
          </ThemedText>
        </View>
      ) : (
        <ThemedText size="sm" style={styles.captureCopy} variant="secondary">
          {description}
        </ThemedText>
      )}
      <View style={styles.captureActions}>
        <Button label="Use camera" onPress={onCameraPress} variant="secondary" />
        <Button label="Choose photo" onPress={onLibraryPress} variant="secondary" />
      </View>
    </View>
  );
}

export default function SupplementsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const stack = useQuery(api.supplements.currentStack);
  const ensureReady = useMutation(api.supplements.ensureReady);
  const createCustomSupplement = useMutation(api.supplements.createCustomSupplement);
  const updateStackItem = useMutation(api.supplements.updateStackItem);
  const saveScannedSupplement = useMutation(api.supplements.saveScannedSupplement);
  const archiveStackItem = useMutation(api.supplements.archiveStackItem);
  const analyzeLabelPhotos = useAction(api.supplementScan.analyzeLabelPhotos);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [screenMode, setScreenMode] = useState<"manage" | "capture" | "editor">("manage");
  const [frontPhoto, setFrontPhoto] = useState<PendingSupplementPhoto | null>(null);
  const [factsPhoto, setFactsPhoto] = useState<PendingSupplementPhoto | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    void ensureReady({});
  }, [ensureReady]);

  const activeDaily = stack?.daily ?? [];
  const activeAsNeeded = stack?.asNeeded ?? [];
  const archived = stack?.archived ?? [];
  const isLoading = stack === undefined;
  const editorTitle =
    editorState?.mode === "edit"
      ? "Edit supplement"
      : editorState?.mode === "scan_review"
        ? "Review supplement"
        : "Add custom supplement";
  const saveLabel =
    editorState?.mode === "edit"
      ? "Save changes"
      : editorState?.mode === "scan_review"
        ? "Save supplement"
        : "Create supplement";

  const resetCapture = () => {
    setFrontPhoto(null);
    setFactsPhoto(null);
    setIsWorking(false);
    setScreenError(null);
  };

  const openCustomEditor = (item?: StackItem | null) => {
    setEditorState(
      buildEditorState({
        item,
        mode: item ? "edit" : "create",
      })
    );
    setScreenError(null);
    setScreenMode("editor");
  };

  const openScanCapture = () => {
    resetCapture();
    setEditorState(null);
    setStatusMessage(null);
    setScreenMode("capture");
  };

  const handlePickPhoto = async (
    target: "front" | "facts",
    source: "camera" | "library"
  ) => {
    setScreenError(null);

    try {
      const photo = await prepareSupplementPhoto(source);

      if (!photo) {
        return;
      }

      if (target === "front") {
        setFrontPhoto(photo);
        return;
      }

      setFactsPhoto(photo);
    } catch (error) {
      setScreenError(
        error instanceof Error ? error.message : "That supplement photo could not be prepared."
      );
    }
  };

  const handleAnalyze = async () => {
    if (!frontPhoto || isWorking) {
      return;
    }

    setIsWorking(true);
    setScreenError(null);

    try {
      const draft = await analyzeLabelPhotos({
        factsPhotoBase64: factsPhoto?.base64,
        factsPhotoMimeType: factsPhoto?.mimeType,
        frontPhotoBase64: frontPhoto.base64,
        frontPhotoMimeType: frontPhoto.mimeType,
      });

      setEditorState(
        buildEditorState({
          mode: "scan_review",
          scanDraft: draft,
          scanPhotoCount: factsPhoto ? 2 : 1,
        })
      );
      setScreenMode("editor");
    } catch (error) {
      setScreenError(
        error instanceof Error ? error.message : "This supplement could not be analyzed right now."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleSaveEditor = async () => {
    if (!editorState || isWorking) {
      return;
    }

    const displayName = editorState.displayName.trim();
    const servingLabel = editorState.servingLabel.trim() || "1 serving";
    const activeIngredients = buildActiveIngredientPayload(editorState.activeIngredients);

    if (!displayName) {
      setScreenError("Add a supplement name before saving.");
      return;
    }

    if (!activeIngredients.length) {
      setScreenError("Add at least one active ingredient before saving.");
      return;
    }

    setIsWorking(true);
    setScreenError(null);

    const payload = {
      activeIngredients,
      brand: editorState.brand.trim() || undefined,
      displayName,
      frequency: editorState.frequency,
      nutritionProfile: buildNutritionPayload(editorState.nutritionValues),
      servingLabel,
    };

    try {
      if (editorState.mode === "scan_review") {
        const result = await saveScannedSupplement({
          ...payload,
          existingUserSupplementId: editorState.userSupplementId as never,
          scanPhotoCount: editorState.scanPhotoCount || (factsPhoto ? 2 : 1),
          takenToday: editorState.takenToday,
        });
        setStatusMessage(
          result.alreadyLoggedToday
            ? "Saved to My Supplements. Already logged today."
            : editorState.takenToday
              ? "Saved to My Supplements and marked taken today."
              : "Saved to My Supplements."
        );
      } else if (editorState.mode === "edit" && editorState.userSupplementId) {
        await updateStackItem({
          ...payload,
          userSupplementId: editorState.userSupplementId as never,
        });
        setStatusMessage("Supplement updated.");
      } else {
        await createCustomSupplement(payload);
        setStatusMessage("Supplement created.");
      }

      setEditorState(null);
      setScreenMode("manage");
      resetCapture();
    } catch (error) {
      setScreenError(
        error instanceof Error ? error.message : "This supplement could not be saved right now."
      );
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText size="sm" variant="secondary" style={styles.loadingLabel}>
          Loading supplements...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <View style={styles.headerRow} testID="supplements-header-row">
        <ThemedText size="xs" style={styles.routeEyebrow} variant="tertiary">
          Supplement stack
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
          testID="supplements-back-button"
        >
          <Ionicons color={theme.accent1} name="chevron-back" size={18} />
          <ThemedText size="sm" variant="accent1">
            Back
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText size="xl" style={styles.title}>
        Manage supplements
      </ThemedText>
      {statusMessage ? (
        <View
          style={[
            styles.messagePill,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="sm" variant="accent1">
            {statusMessage}
          </ThemedText>
        </View>
      ) : null}

      {screenMode === "manage" ? (
        <Card testID="supplements-manage-card">
          <ThemedText size="md" style={styles.cardTitle} testID="supplements-manage-title">
            Add to My Supplements
          </ThemedText>
          <ThemedText size="sm" style={styles.cardCopy} variant="secondary">
            Scan the front label first, then add the supplement facts panel when it is available.
          </ThemedText>
          <View style={styles.actionGroup}>
            <Button label="Scan supplement" onPress={openScanCapture} />
            <Button
              label="Create custom supplement"
              onPress={() => openCustomEditor(null)}
              variant="secondary"
            />
          </View>
        </Card>
      ) : null}

      {screenMode === "capture" ? (
        <Card>
          <ThemedText size="md" style={styles.cardTitle} testID="supplements-capture-title">
            Scan supplement
          </ThemedText>
          <ThemedText size="sm" style={styles.cardCopy} variant="secondary">
            Front label is required. Supplement facts is optional but gives the cleanest review draft.
          </ThemedText>

          <PhotoSlotCard
            description="Capture the front label so we can identify the product name and brand."
            label="Front label"
            onCameraPress={() => void handlePickPhoto("front", "camera")}
            onLibraryPress={() => void handlePickPhoto("front", "library")}
            photo={frontPhoto}
          />

          <PhotoSlotCard
            description="Add the supplement facts panel if the serving size, actives, or vitamins are on the back."
            label="Supplement facts"
            onCameraPress={() => void handlePickPhoto("facts", "camera")}
            onLibraryPress={() => void handlePickPhoto("facts", "library")}
            photo={factsPhoto}
          />

          <View style={styles.actionGroup}>
            <Button
              disabled={!frontPhoto || isWorking}
              label={isWorking ? "Analyzing..." : "Analyze supplement"}
              onPress={() => void handleAnalyze()}
            />
            <Button label="Skip second photo" onPress={() => setFactsPhoto(null)} variant="secondary" />
            <Button
              label="Cancel"
              onPress={() => {
                resetCapture();
                setScreenMode("manage");
              }}
              variant="secondary"
            />
          </View>
        </Card>
      ) : null}

      {screenMode === "editor" && editorState ? (
        <Card>
          <ThemedText size="md" style={styles.cardTitle} testID="supplements-editor-title">
            {editorTitle}
          </ThemedText>

          {editorState.mode === "scan_review" ? (
            <ThemedText size="sm" style={styles.cardCopy} variant="secondary">
              Review the supplement before saving it to your stack.
            </ThemedText>
          ) : null}

          <View style={styles.fieldBlock}>
            <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
              Brand
            </ThemedText>
            <TextInput
              onChangeText={(value) =>
                setEditorState((current) =>
                  current
                    ? {
                        ...current,
                        brand: value,
                      }
                    : current
                )
              }
              placeholder="Nature Made"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              value={editorState.brand}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
              Product name
            </ThemedText>
            <TextInput
              onChangeText={(value) =>
                setEditorState((current) =>
                  current
                    ? {
                        ...current,
                        displayName: value,
                      }
                    : current
                )
              }
              placeholder="Iron"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              value={editorState.displayName}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
              Serving label
            </ThemedText>
            <TextInput
              onChangeText={(value) =>
                setEditorState((current) =>
                  current
                    ? {
                        ...current,
                        servingLabel: value,
                      }
                    : current
                )
              }
              placeholder="1 tablet"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              value={editorState.servingLabel}
            />
          </View>

          <View style={styles.fieldBlock}>
            <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
              Frequency
            </ThemedText>
            <FrequencySelector
              onChange={(frequency) =>
                setEditorState((current) =>
                  current
                    ? {
                        ...current,
                        frequency,
                      }
                    : current
                )
              }
              value={editorState.frequency}
            />
          </View>

          {editorState.mode === "scan_review" ? (
            <View style={styles.fieldBlock}>
              <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
                Save outcome
              </ThemedText>
              <TogglePill
                active={editorState.takenToday}
                label={editorState.takenToday ? "Taken today" : "Mark taken today"}
                onPress={() =>
                  setEditorState((current) =>
                    current
                      ? {
                          ...current,
                          takenToday: !current.takenToday,
                        }
                      : current
                  )
                }
              />
            </View>
          ) : null}

          <View style={styles.fieldBlock}>
            <View style={styles.inlineHeader}>
              <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
                Active ingredients
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setEditorState((current) =>
                    current
                      ? {
                          ...current,
                          activeIngredients: [...current.activeIngredients, createBlankIngredient()],
                        }
                      : current
                  )
                }
              >
                <ThemedText size="sm" variant="accent1">
                  Add ingredient
                </ThemedText>
              </Pressable>
            </View>

            {editorState.activeIngredients.map((ingredient, index) => (
              <View key={ingredient.id} style={styles.ingredientCard}>
                <View style={styles.inlineHeader}>
                  <ThemedText size="sm">{`Ingredient ${index + 1}`}</ThemedText>
                  {editorState.activeIngredients.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setEditorState((current) =>
                          current
                            ? {
                                ...current,
                                activeIngredients: current.activeIngredients.filter(
                                  (entry) => entry.id !== ingredient.id
                                ),
                              }
                            : current
                        )
                      }
                    >
                      <ThemedText size="sm" variant="secondary">
                        Remove
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  onChangeText={(value) =>
                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            activeIngredients: current.activeIngredients.map((entry) =>
                              entry.id === ingredient.id
                                ? {
                                    ...entry,
                                    name: value,
                                  }
                                : entry
                            ),
                          }
                        : current
                    )
                  }
                  placeholder="Ferrous sulfate"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    styles.ingredientInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.cardBorder,
                      color: theme.text,
                    },
                  ]}
                  value={ingredient.name}
                />
                <View style={styles.inlineFields}>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              activeIngredients: current.activeIngredients.map((entry) =>
                                entry.id === ingredient.id
                                  ? {
                                      ...entry,
                                      amount: value,
                                    }
                                  : entry
                              ),
                            }
                          : current
                      )
                    }
                    placeholder="65"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.textInput,
                      styles.inlineField,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: theme.cardBorder,
                        color: theme.text,
                      },
                    ]}
                    value={ingredient.amount}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              activeIngredients: current.activeIngredients.map((entry) =>
                                entry.id === ingredient.id
                                  ? {
                                      ...entry,
                                      unit: value,
                                    }
                                  : entry
                              ),
                            }
                          : current
                      )
                    }
                    placeholder="mg"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.textInput,
                      styles.inlineField,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: theme.cardBorder,
                        color: theme.text,
                      },
                    ]}
                    value={ingredient.unit}
                  />
                </View>
                <TextInput
                  onChangeText={(value) =>
                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            activeIngredients: current.activeIngredients.map((entry) =>
                              entry.id === ingredient.id
                                ? {
                                    ...entry,
                                    note: value,
                                  }
                                : entry
                            ),
                          }
                        : current
                    )
                  }
                  placeholder="Optional note"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    styles.ingredientInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.cardBorder,
                      color: theme.text,
                    },
                  ]}
                  value={ingredient.note}
                />
              </View>
            ))}
          </View>

          <ThemedText size="xs" style={styles.cardEyebrow} variant="tertiary">
            Nutrition per serving
          </ThemedText>

          <View style={styles.fieldGrid}>
            {[...MACRO_FIELD_ORDER, ...NUTRIENT_FIELD_ORDER].map(([key, label]) => (
              <View key={key} style={styles.gridField}>
                <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
                  {label}
                </ThemedText>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            nutritionValues: {
                              ...current.nutritionValues,
                              [key]: value,
                            },
                          }
                        : current
                    )
                  }
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.cardBorder,
                      color: theme.text,
                    },
                  ]}
                  value={editorState.nutritionValues[key]}
                />
              </View>
            ))}
          </View>

          <View style={styles.editorActions}>
            <Button
              label={isWorking ? "Saving..." : saveLabel}
              onPress={() => void handleSaveEditor()}
            />
            <Button
              label={editorState.mode === "scan_review" ? "Back to photos" : "Cancel"}
              onPress={() => {
                setScreenError(null);

                if (editorState.mode === "scan_review") {
                  setScreenMode("capture");
                  return;
                }

                setEditorState(null);
                setScreenMode("manage");
              }}
              variant="secondary"
            />
          </View>
        </Card>
      ) : null}

      {screenError ? (
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="sm" variant="accent3">
            {screenError}
          </ThemedText>
        </View>
      ) : null}

      {screenMode === "manage" ? (
        <Card style={styles.stackCard} testID="supplements-stack-card">
          <StackSection
            emptyLabel="Your daily stack will show up here."
            items={activeDaily}
            onArchive={(item) => void archiveStackItem({ userSupplementId: item.id as never })}
            onEdit={(item) => openCustomEditor(item)}
            title="Daily stack"
          />

          <StackSection
            emptyLabel="As-needed supplements will show up here."
            items={activeAsNeeded}
            onArchive={(item) => void archiveStackItem({ userSupplementId: item.id as never })}
            onEdit={(item) => openCustomEditor(item)}
            title="As needed"
          />

          {archived.length > 0 ? (
            <StackSection emptyLabel="" items={archived} title="Archived" />
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    gap: 10,
  },
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    paddingVertical: 6,
  },
  captureActions: {
    gap: 10,
    marginTop: 12,
  },
  captureReadyCheck: {
    fontWeight: "700",
  },
  captureReadyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  captureCopy: {
    lineHeight: 20,
  },
  captureSlot: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  cardCopy: {
    lineHeight: 20,
    marginBottom: 16,
  },
  cardEyebrow: {
    marginBottom: 10,
  },
  cardTitle: {
    marginBottom: 12,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  editorActions: {
    gap: 10,
    marginTop: 18,
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  frequencyButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  frequencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  gridField: {
    paddingHorizontal: 6,
    width: "50%",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ingredientCard: {
    marginBottom: 14,
  },
  ingredientInput: {
    marginBottom: 10,
  },
  inlineField: {
    flex: 1,
  },
  inlineFields: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  inlineHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadingLabel: {
    marginTop: 12,
  },
  messagePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  routeEyebrow: {
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  stackRow: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 14,
  },
  stackRowActions: {
    alignItems: "flex-end",
    gap: 10,
    justifyContent: "center",
    marginLeft: 12,
  },
  stackCard: {
    marginTop: 12,
  },
  stackRowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  stackRowGap: {
    marginBottom: 10,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  title: {
    marginBottom: 16,
  },
  togglePill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
});
