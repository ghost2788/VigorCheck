import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  RememberedHydrationShortcut,
  RememberedShortcutCategory,
  RememberedShortcutLogMode,
} from "../lib/domain/analysisQueue";
import { MEAL_TYPE_OPTIONS, MealType } from "../lib/domain/meals";
import { NutritionFields } from "../lib/domain/scan";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type CreateShortcutInput = {
  calories: number;
  carbs: number;
  category: RememberedShortcutCategory;
  defaultAmountOz: number;
  fat: number;
  label: string;
  logMode: RememberedShortcutLogMode;
  mealType?: MealType;
  nutritionProfile?: NutritionFields;
  protein: number;
};

type RememberedHydrationShortcutsCardProps = {
  onCreateShortcut: (input: CreateShortcutInput) => Promise<void>;
  onLogShortcut: (shortcutId: RememberedHydrationShortcut["id"]) => Promise<void> | void;
  shortcuts: RememberedHydrationShortcut[];
};

const CATEGORY_OPTIONS: Array<{ label: string; value: RememberedShortcutCategory }> = [
  { label: "Water", value: "water" },
  { label: "Energy drink", value: "energy_drink" },
  { label: "Protein shake", value: "protein_shake" },
  { label: "Other", value: "other" },
];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getDisplayShortcutLabel(shortcut: Pick<RememberedHydrationShortcut, "defaultAmountOz" | "label">) {
  const amountPattern = new RegExp(`\\s+${shortcut.defaultAmountOz}\\s*oz$`, "i");
  return shortcut.label.replace(amountPattern, "").trim() || shortcut.label;
}

function Field({
  keyboardType,
  label,
  onChangeText,
  value,
}: {
  keyboardType?: "default" | "numeric";
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText size="xs" variant="tertiary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
            color: theme.text,
          },
        ]}
        value={value}
      />
    </View>
  );
}

function CategoryChip({
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
      onPress={onPress}
      style={[
        styles.selectionChip,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
          borderColor: active ? theme.metricHydration : theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" style={{ color: active ? theme.metricHydration : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function RememberedHydrationShortcutsCard({
  onCreateShortcut,
  onLogShortcut,
  shortcuts,
}: RememberedHydrationShortcutsCardProps) {
  const { theme } = useTheme();
  const estimateNutrition = useAction(api.drinkShortcuts.estimateNutrition);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<RememberedShortcutCategory>("water");
  const [defaultAmountOz, setDefaultAmountOz] = useState("8");
  const [mealType, setMealType] = useState<MealType>("drink");
  const [shouldLogNutrition, setShouldLogNutrition] = useState(false);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [estimatedNutrition, setEstimatedNutrition] = useState<NutritionFields | null>(null);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1600);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const resetSheet = () => {
    setLabel("");
    setCategory("water");
    setDefaultAmountOz("8");
    setMealType("drink");
    setShouldLogNutrition(false);
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setEstimatedNutrition(null);
    setSheetError(null);
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  return (
    <>
      <Card>
        <View style={styles.header}>
          <ThemedText size="md">Hydration shortcuts</ThemedText>
          <Pressable hitSlop={8} onPress={() => setIsSheetOpen(true)}>
            <ThemedText size="sm" style={{ color: theme.metricHydration }}>
              + Add drink
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.shortcutList}>
          {shortcuts.length === 0 ? (
            <ThemedText size="sm" variant="secondary">
              Your first remembered shortcut will show up here.
            </ThemedText>
          ) : (
            shortcuts.map((shortcut, index) => (
              <View
                key={shortcut.id}
                style={[
                  styles.shortcutRow,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.cardBorder,
                  },
                  index < shortcuts.length - 1 ? styles.shortcutGap : undefined,
                ]}
              >
                <View style={styles.shortcutContent}>
                  <ThemedText numberOfLines={1} size="sm" style={styles.shortcutLabel}>
                    {getDisplayShortcutLabel(shortcut)}
                  </ThemedText>
                  <View
                    style={[
                      styles.amountPill,
                      {
                        backgroundColor: hexToRgba(theme.metricHydration, 0.12),
                        borderColor: hexToRgba(theme.metricHydration, 0.24),
                      },
                    ]}
                  >
                    <ThemedText size="sm" style={{ color: theme.metricHydration }}>
                      {shortcut.defaultAmountOz} oz
                    </ThemedText>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    await onLogShortcut(shortcut.id);
                    setToastMessage(`Added ${getDisplayShortcutLabel(shortcut)}`);
                  }}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: hexToRgba(theme.metricHydration, pressed ? 0.22 : 0.14),
                      borderColor: hexToRgba(theme.metricHydration, 0.24),
                    },
                  ]}
                >
                  <ThemedText size="lg" style={{ color: theme.metricHydration }}>
                    +
                  </ThemedText>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {toastMessage ? (
          <View
            style={[
              styles.toast,
              {
                backgroundColor: hexToRgba(theme.metricHydration, 0.14),
                borderColor: hexToRgba(theme.metricHydration, 0.24),
              },
            ]}
          >
            <ThemedText size="sm" style={{ color: theme.metricHydration }}>
              {toastMessage}
            </ThemedText>
          </View>
        ) : null}
      </Card>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setIsSheetOpen(false);
          resetSheet();
        }}
        transparent
        visible={isSheetOpen}
      >
        <View style={[styles.modalScrim, { backgroundColor: "rgba(0,0,0,0.54)" }]}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <ThemedText size="sm" style={styles.sheetTitle}>
                Add drink
              </ThemedText>

              <Field label="Drink name" onChangeText={setLabel} value={label} />

              <View style={styles.selectionWrap}>
                {CATEGORY_OPTIONS.map((option) => (
                  <CategoryChip
                    active={category === option.value}
                    key={option.value}
                    label={option.label}
                    onPress={() => setCategory(option.value)}
                  />
                ))}
              </View>

              <Field
                keyboardType="numeric"
                label="Default serving (oz)"
                onChangeText={setDefaultAmountOz}
                value={defaultAmountOz}
              />

              <View style={styles.mealTypeBlock}>
                <ThemedText size="xs" variant="tertiary" style={styles.fieldLabel}>
                  Meal type
                </ThemedText>
                <View style={styles.selectionWrap}>
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <CategoryChip
                      active={mealType === option.value}
                      key={option.value}
                      label={option.label}
                      onPress={() => setMealType(option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <ThemedText size="sm">Also log nutrition</ThemedText>
                  <ThemedText size="sm" variant="secondary">
                    Water can stay hydration-only. Drinks with calories can log both.
                  </ThemedText>
                </View>
                <Switch
                  onValueChange={(nextValue) => {
                    setShouldLogNutrition(nextValue);

                    if (!nextValue) {
                      setEstimatedNutrition(null);
                      setCalories("");
                      setProtein("");
                      setCarbs("");
                      setFat("");
                    }
                  }}
                  trackColor={{ false: theme.cardBorder, true: hexToRgba(theme.metricHydration, 0.38) }}
                  value={shouldLogNutrition}
                />
              </View>

              {shouldLogNutrition ? (
                <>
                  <View style={styles.row}>
                    <Field
                      keyboardType="numeric"
                      label="Calories"
                      onChangeText={setCalories}
                      value={calories}
                    />
                    <Field
                      keyboardType="numeric"
                      label="Protein (g)"
                      onChangeText={setProtein}
                      value={protein}
                    />
                  </View>
                  <View style={styles.row}>
                    <Field keyboardType="numeric" label="Carbs (g)" onChangeText={setCarbs} value={carbs} />
                    <Field keyboardType="numeric" label="Fat (g)" onChangeText={setFat} value={fat} />
                  </View>
                  <Button
                    label={isEstimating ? "Estimating..." : "Estimate for me"}
                    onPress={async () => {
                      const trimmedLabel = label.trim();
                      const parsedOz = parseNumber(defaultAmountOz);

                      if (!trimmedLabel || parsedOz === null || parsedOz <= 0) {
                        setSheetError("Add a drink name and serving size before estimating it.");
                        return;
                      }

                      setIsEstimating(true);
                      setSheetError(null);

                      try {
                        const result = await estimateNutrition({
                          category,
                          name: trimmedLabel,
                          servingOz: parsedOz,
                        });
                        setEstimatedNutrition(result.nutrition);
                        setCalories(String(result.nutrition.calories));
                        setProtein(String(result.nutrition.protein));
                        setCarbs(String(result.nutrition.carbs));
                        setFat(String(result.nutrition.fat));
                      } catch (error) {
                        setSheetError(
                          error instanceof Error
                            ? error.message
                            : "This drink estimate could not be generated."
                        );
                      } finally {
                        setIsEstimating(false);
                      }
                    }}
                    variant="secondary"
                  />
                </>
              ) : null}

              {sheetError ? (
                <ThemedText size="sm" style={styles.sheetError} variant="accent2">
                  {sheetError}
                </ThemedText>
              ) : null}

              <View style={styles.sheetActions}>
                <Button
                  label="Cancel"
                  onPress={() => {
                    setIsSheetOpen(false);
                    resetSheet();
                  }}
                  variant="secondary"
                />
                <Button
                  label={isSaving ? "Saving..." : "Save shortcut"}
                  onPress={async () => {
                    const trimmedLabel = label.trim();
                    const parsedOz = parseNumber(defaultAmountOz);
                    const parsedCalories = parseNumber(calories);
                    const parsedProtein = parseNumber(protein);
                    const parsedCarbs = parseNumber(carbs);
                    const parsedFat = parseNumber(fat);

                    if (!trimmedLabel || parsedOz === null || parsedOz <= 0) {
                      setSheetError("Add a drink name and a valid serving size.");
                      return;
                    }

                    if (
                      shouldLogNutrition &&
                      [parsedCalories, parsedProtein, parsedCarbs, parsedFat].some((value) => value === null)
                    ) {
                      setSheetError("Nutrition shortcuts need valid calories, protein, carbs, and fat.");
                      return;
                    }

                    setIsSaving(true);
                    setSheetError(null);

                    try {
                      await onCreateShortcut({
                        calories: shouldLogNutrition ? (parsedCalories ?? 0) : 0,
                        carbs: shouldLogNutrition ? (parsedCarbs ?? 0) : 0,
                        category,
                        defaultAmountOz: parsedOz,
                        fat: shouldLogNutrition ? (parsedFat ?? 0) : 0,
                        label: trimmedLabel,
                        logMode: shouldLogNutrition ? "hydration_and_nutrition" : "hydration_only",
                        mealType,
                        nutritionProfile: shouldLogNutrition ? estimatedNutrition ?? undefined : undefined,
                        protein: shouldLogNutrition ? (parsedProtein ?? 0) : 0,
                      });
                      setIsSheetOpen(false);
                      resetSheet();
                    } catch (error) {
                      setSheetError(
                        error instanceof Error ? error.message : "This shortcut could not be saved."
                      );
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 40,
  },
  amountPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mealTypeBlock: {
    marginTop: 14,
  },
  modalContent: {
    padding: 18,
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  modalSheet: {
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "90%",
    overflow: "hidden",
  },
  row: {
    columnGap: 12,
    flexDirection: "row",
    marginTop: 14,
  },
  selectionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionWrap: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    rowGap: 8,
  },
  sheetActions: {
    gap: 10,
    marginTop: 18,
  },
  sheetError: {
    marginTop: 14,
  },
  sheetTitle: {
    marginBottom: 8,
  },
  shortcutContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    paddingRight: 12,
  },
  shortcutGap: {
    marginBottom: 10,
  },
  shortcutLabel: {
    flex: 1,
    paddingRight: 10,
  },
  shortcutList: {
    gap: 0,
  },
  shortcutRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  switchCopy: {
    flex: 1,
    paddingRight: 12,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 18,
  },
  toast: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
