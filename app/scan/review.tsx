import React, { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ManualMealForm } from "../../components/ManualMealForm";
import { ScanReviewItemCard } from "../../components/ScanReviewItemCard";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { MEAL_TYPE_OPTIONS } from "../../lib/domain/meals";
import { createEmptyNutrition, createManualDraftItem, ScanDraftItem } from "../../lib/domain/scan";
import { useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

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

export default function ScanReviewScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { activeReviewJob, clearActiveReview, completeReviewJob, updateActiveDraft } = useScanFlow();
  const saveAiEntry = useMutation(api.meals.saveAiEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const currentDraft = activeReviewJob?.draft ?? null;

  const totals = useMemo(() => {
    return (currentDraft?.items ?? []).reduce(
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
    );
  }, [currentDraft?.items]);

  if (!currentDraft) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm" style={styles.emptyTitle}>
            No AI draft to review
          </ThemedText>
          <ThemedText variant="secondary" style={styles.emptyBody}>
            Start from Log with a new photo or typed meal description. Review opens only after the
            background analysis finishes.
          </ThemedText>
          <Button label="Back to Log" onPress={() => router.replace("/(tabs)/log")} />
        </Card>
      </View>
    );
  }

  const updateItem = (targetId: string, nextItem: ScanDraftItem) => {
    updateActiveDraft((draft) => ({
      ...draft,
      items: draft.items.map((item) => (item.id === targetId ? nextItem : item)),
    }));
  };

  const removeItem = (targetId: string) => {
    updateActiveDraft((draft) => ({
      ...draft,
      items: draft.items.filter((item) => item.id !== targetId),
    }));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemedText size="xs" variant="tertiary" style={styles.eyebrow}>
        AI review
      </ThemedText>
      <ThemedText size="xl" style={styles.title}>
        Check the drafted items
      </ThemedText>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <ThemedText size="sm">Meal type</ThemedText>
          <ThemedText size="xs" variant="tertiary">
            Confidence {currentDraft.overallConfidence}
          </ThemedText>
        </View>
        <View style={styles.typeRow}>
          {MEAL_TYPE_OPTIONS.map((option) => (
            <MealTypePill
              active={currentDraft.mealType === option.value}
              key={option.value}
              label={option.label}
              onPress={() =>
                updateActiveDraft((draft) => ({
                  ...draft,
                  mealType: option.value,
                }))
              }
            />
          ))}
        </View>
        <ThemedText variant="secondary" style={styles.summaryCopy}>
          {currentDraft.items.length} items, {totals.calories} calories, {totals.protein}g protein,{" "}
          {totals.carbs}g carbs, {totals.fat}g fat.
        </ThemedText>
      </Card>

      {currentDraft.items.map((item) => (
        <ScanReviewItemCard
          item={item}
          key={item.id}
          onChange={(nextItem) => updateItem(item.id, nextItem)}
          onRemove={() => removeItem(item.id)}
        />
      ))}

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
            fixedMealType={currentDraft.mealType}
            mealTypeMode="fixed"
            onSubmit={async (values) => {
              const nutrition = {
                ...createEmptyNutrition(),
                calories: values.calories,
                carbs: values.carbs,
                fat: values.fat,
                protein: values.protein,
              };

              updateActiveDraft((draft) => ({
                ...draft,
                items: [
                  ...draft.items,
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
                ],
              }));
              setShowManualAdd(false);
            }}
            sectionTitle="Manual item"
            submitLabel="Add item"
          />
        ) : null}
      </Card>

      {saveError ? (
        <ThemedText size="sm" variant="accent2" style={styles.saveError}>
          {saveError}
        </ThemedText>
      ) : null}

      <View style={styles.footerActions}>
        <Button
          label="Back to Log"
          onPress={() => {
            clearActiveReview();
            router.replace("/(tabs)/log");
          }}
          variant="secondary"
        />
        <Button
          label={isSaving ? "Saving..." : "Save meal"}
          onPress={async () => {
            if (isSaving) {
              return;
            }

            if (!currentDraft.items.length) {
              setSaveError("Add at least one item before saving this meal.");
              return;
            }

            setSaveError(null);
            setIsSaving(true);

            try {
              await saveAiEntry({
                entryMethod: currentDraft.entryMethod,
                items: currentDraft.items.map((item) => ({
                  confidence: item.confidence,
                  estimatedGrams: item.estimatedGrams,
                  name: item.name.trim(),
                  nutrition: item.nutrition,
                  portionLabel: item.portionLabel,
                  prepMethod: item.prepMethod || undefined,
                  source: item.source,
                  usdaFoodId: item.usdaFoodId || undefined,
                })),
                mealType: currentDraft.mealType,
                overallConfidence: currentDraft.overallConfidence,
                photoStorageId: currentDraft.photoStorageId || undefined,
              });
              if (activeReviewJob) {
                completeReviewJob(activeReviewJob.id);
              }
              router.replace("/(tabs)/log");
            } catch (error) {
              setSaveError(
                error instanceof Error ? error.message : "This AI meal could not be saved."
              );
            } finally {
              setIsSaving(false);
            }
          }}
        />
      </View>
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
  emptyBody: {
    marginBottom: 18,
  },
  emptyCard: {
    width: "100%",
  },
  emptyTitle: {
    marginBottom: 8,
  },
  eyebrow: {
    marginBottom: 10,
  },
  footerActions: {
    gap: 10,
  },
  saveError: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 18,
  },
  summaryCopy: {
    lineHeight: 22,
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    marginBottom: 18,
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
