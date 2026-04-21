import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { DateTimeFieldsCard } from "../../../components/DateTimeFieldsCard";
import { ManualMealForm } from "../../../components/ManualMealForm";
import { ScanReviewItemCard } from "../../../components/ScanReviewItemCard";
import { ThemedText } from "../../../components/ThemedText";
import { api } from "../../../convex/_generated/api";
import { buildMealNutritionRows } from "../../../lib/domain/mealNutritionRows";
import { MEAL_TYPE_OPTIONS, MealType } from "../../../lib/domain/meals";
import { parseTimestampFromLocalDateTime, getLocalDateInputValue, getLocalTimeInputValue } from "../../../lib/domain/dayWindow";
import {
  createEmptyNutrition,
  createManualDraftItem,
  normalizeFoodName,
  ScanDraftItem,
} from "../../../lib/domain/scan";
import { useTheme } from "../../../lib/theme/ThemeProvider";

function MealTypePill({
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
        styles.typePill,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
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

type MealEditQueryResult = FunctionReturnType<typeof api.meals.getForEdit>;

function toDraftItems(result: NonNullable<MealEditQueryResult>) {
  if (!result) {
    return [];
  }

  return result.items.map((item) => ({
    baseEstimatedGrams: item.estimatedGrams,
    baseNutrition: item.nutrition,
    confidence: item.confidence ?? result.meal.aiConfidence ?? "medium",
    estimatedGrams: item.estimatedGrams,
    id: `saved-${item.id}`,
    multiplier: 1,
    name: item.foodName,
    normalizedName: normalizeFoodName(item.foodName),
    nutrition: item.nutrition,
    portionUnit: item.portionUnit,
    portionLabel: item.portionLabel,
    prepMethod: item.prepMethod ?? undefined,
    barcodeValue: item.barcodeValue ?? undefined,
    source: item.source,
    usdaFoodId: item.usdaFoodId ?? undefined,
  })) as ScanDraftItem[];
}

export default function MealEditScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealId?: string }>();
  const mealId = typeof params.mealId === "string" ? params.mealId : null;
  const mealData = useQuery(api.meals.getForEdit, mealId ? { mealId: mealId as never } : "skip");
  const reviewContext = useQuery(api.scanReview.getContext);
  const updateManual = useMutation(api.meals.updateManual);
  const updateAiEntry = useMutation(api.meals.updateAiEntry);
  const deleteMeal = useMutation(api.meals.deleteMeal);
  const [initialized, setInitialized] = useState(false);
  const [mealLabel, setMealLabel] = useState("");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [draftItems, setDraftItems] = useState<ScanDraftItem[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!mealData || initialized) {
      return;
    }

    setMealLabel(mealData.meal.label ?? "");
    setMealType(mealData.meal.mealType);
    setDateValue(getLocalDateInputValue(mealData.meal.timestamp, mealData.timeZone));
    setTimeValue(getLocalTimeInputValue(mealData.meal.timestamp, mealData.timeZone));
    setDraftItems(toDraftItems(mealData));
    setInitialized(true);
  }, [initialized, mealData]);

  const totals = useMemo(
    () =>
      draftItems.reduce(
        (summary, item) => ({
          calories: summary.calories + item.nutrition.calories,
          carbs: summary.carbs + item.nutrition.carbs,
          fat: summary.fat + item.nutrition.fat,
          protein: summary.protein + item.nutrition.protein,
        }),
        {
          calories: 0,
          carbs: 0,
          fat: 0,
          protein: 0,
        }
      ),
    [draftItems]
  );

  if (!mealId || mealData === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
      </View>
    );
  }

  if (!mealData) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm">Meal not found</ThemedText>
        </Card>
      </View>
    );
  }

  const timestamp = parseTimestampFromLocalDateTime({
    dateKey: dateValue,
    timeValue,
    timeZone: mealData.timeZone,
  });

  const saveAiMeal = async () => {
    if (!timestamp) {
      setError("Use a valid date and time before saving.");
      return;
    }

    if (!draftItems.length) {
      setError("Add at least one item before saving this meal.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await updateAiEntry({
        items: draftItems.map((item) => ({
          barcodeValue: item.barcodeValue,
          confidence: item.confidence,
          name: item.name.trim(),
          nutrition: item.nutrition,
          portionAmount: item.estimatedGrams,
          portionLabel: item.portionLabel,
          portionUnit: item.portionUnit,
          prepMethod: item.prepMethod || undefined,
          source: item.source,
          usdaFoodId: item.usdaFoodId || undefined,
        })),
        label: mealLabel.trim() || undefined,
        mealId: mealData.meal.id,
        mealType,
        timestamp,
      });
      router.back();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "This meal could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete meal", "This will remove the saved meal and all of its items.", [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Delete",
        onPress: () => {
          void (async () => {
            await deleteMeal({ mealId: mealData.meal.id });
            router.back();
          })();
        },
      },
    ]);
  };

  const isManualMeal = mealData.meal.entryMethod === "manual";

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <ThemedText size="xs" style={styles.eyebrow} variant="tertiary">
            Meal log
          </ThemedText>
          <ThemedText size="xl" style={styles.title}>
            Edit meal
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
          testID="meal-edit-back-button"
        >
          <Ionicons color={theme.accent1} name="chevron-back" size={18} />
          <ThemedText size="sm" variant="accent1">
            Back
          </ThemedText>
        </Pressable>
      </View>

      <DateTimeFieldsCard
        dateValue={dateValue}
        onDateChange={setDateValue}
        onTimeChange={setTimeValue}
        timeValue={timeValue}
      />

      {isManualMeal ? (
        <>
          {error ? (
            <ThemedText size="sm" variant="accent2" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <ManualMealForm
            initialValues={{
              calories: mealData.items[0]?.nutrition.calories ?? 0,
              carbs: mealData.items[0]?.nutrition.carbs ?? 0,
              fat: mealData.items[0]?.nutrition.fat ?? 0,
              mealType: mealData.meal.mealType,
              name: mealData.meal.label,
              protein: mealData.items[0]?.nutrition.protein ?? 0,
            }}
            onSubmit={async (values) => {
              if (!timestamp) {
                setError("Use a valid date and time before saving.");
                return;
              }

              setError(null);
              setIsSaving(true);

              try {
                await updateManual({
                  calories: values.calories,
                  carbs: values.carbs,
                  fat: values.fat,
                  mealId: mealData.meal.id,
                  mealType: values.mealType,
                  name: values.name,
                  protein: values.protein,
                  timestamp,
                });
                router.back();
              } catch (nextError) {
                setError(
                  nextError instanceof Error ? nextError.message : "This meal could not be updated."
                );
              } finally {
                setIsSaving(false);
              }
            }}
            resetOnSubmit={false}
            sectionTitle="Meal summary"
            submitLabel={isSaving ? "Saving..." : "Save changes"}
          />
          <View style={styles.footerActions}>
            <Button label="Delete meal" onPress={confirmDelete} variant="secondary" />
          </View>
        </>
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <ThemedText size="md" style={styles.sectionTitle}>
              Meal summary
            </ThemedText>
            <TextInput
              onChangeText={setMealLabel}
              placeholder="Meal label"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.labelInput,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              value={mealLabel}
            />
            <View style={styles.typeRow}>
              {MEAL_TYPE_OPTIONS.map((option) => (
                <MealTypePill
                  active={mealType === option.value}
                  key={option.value}
                  label={option.label}
                  onPress={() => setMealType(option.value)}
                />
              ))}
            </View>
            <ThemedText variant="secondary" style={styles.summaryCopy}>
              {draftItems.length} items, {totals.calories} calories, {totals.protein}g protein,{" "}
              {totals.carbs}g carbs, {totals.fat}g fat.
            </ThemedText>
          </Card>

          {draftItems.map((item) => {
            const nutritionRows = buildMealNutritionRows({
              detailedNutritionTargets: reviewContext?.detailedNutritionTargets,
              macroTargets: reviewContext?.macroTargets,
              nutrients: item.nutrition,
              totals: {
                calories: item.nutrition.calories,
                carbs: item.nutrition.carbs,
                fat: item.nutrition.fat,
                protein: item.nutrition.protein,
              },
            });

            return (
              <ScanReviewItemCard
                item={item}
                key={item.id}
                nutritionRows={nutritionRows}
                onChange={(nextItem) =>
                  setDraftItems((current) =>
                    current.map((entry) => (entry.id === item.id ? nextItem : entry))
                  )
                }
                onRemove={() =>
                  setDraftItems((current) => current.filter((entry) => entry.id !== item.id))
                }
              />
            );
          })}

          <Card style={styles.addCard}>
            <View style={styles.addHeader}>
              <View>
                <ThemedText size="sm">Missing something?</ThemedText>
                <ThemedText size="sm" variant="secondary">
                  Add a manual item before saving the meal.
                </ThemedText>
              </View>
              <Button
                label={showManualAdd ? "Close" : "Add item"}
                onPress={() => setShowManualAdd((value) => !value)}
                variant="secondary"
              />
            </View>

            {showManualAdd ? (
              <ManualMealForm
                fixedMealType={mealType}
                mealTypeMode="fixed"
                onSubmit={async (values) => {
                  const nutrition = {
                    ...createEmptyNutrition(),
                    calories: values.calories,
                    carbs: values.carbs,
                    fat: values.fat,
                    protein: values.protein,
                  };

                  setDraftItems((current) => [
                    ...current,
                    {
                      ...createManualDraftItem({
                        confidence: "high",
                        estimatedGrams: 100,
                        name: values.name?.trim() || "Manual item",
                        nutrition,
                        portionLabel: "Manual estimate",
                      }),
                      id: `manual-${Date.now()}`,
                    },
                  ]);
                  setShowManualAdd(false);
                }}
                resetOnSubmit={false}
                sectionTitle="Manual item"
                submitLabel="Add item"
              />
            ) : null}
          </Card>

          {error ? (
            <ThemedText size="sm" variant="accent2" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.footerActions}>
            <Button label="Delete meal" onPress={confirmDelete} variant="secondary" />
            <Button
              label={isSaving ? "Saving..." : "Save changes"}
              onPress={() => {
                void saveAiMeal();
              }}
              testID="meal-edit-save-button"
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addCard: {
    marginBottom: 16,
  },
  addHeader: {
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    paddingVertical: 6,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  emptyCard: {
    width: "100%",
  },
  eyebrow: {
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  error: {
    marginBottom: 16,
  },
  footerActions: {
    gap: 10,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  labelInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  summaryCard: {
    marginBottom: 18,
  },
  summaryCopy: {
    lineHeight: 22,
  },
  title: {
    marginBottom: 0,
  },
  titleBlock: {
    flex: 1,
    marginRight: 12,
  },
  typePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeRow: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
    rowGap: 8,
  },
});
