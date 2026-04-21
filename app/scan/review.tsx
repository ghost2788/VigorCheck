import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ScanReviewItemCard } from "../../components/ScanReviewItemCard";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { buildMealNutritionRows } from "../../lib/domain/mealNutritionRows";
import { ScanDraftItem } from "../../lib/domain/scan";
import { useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ScanReviewScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    activeReviewJob,
    announceReviewedSave,
    clearActiveReview,
    completeReviewJob,
    updateActiveDraft,
  } = useScanFlow();
  const saveAiEntry = useMutation(api.meals.saveAiEntry);
  const reviewContext = useQuery(api.scanReview.getContext);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null | undefined>(undefined);
  const currentDraft = activeReviewJob?.draft ?? null;

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

  const effectiveExpandedItemId =
    expandedItemId === undefined
      ? currentDraft.items[0]?.id ?? null
      : expandedItemId === null
        ? null
        : currentDraft.items.some((item) => item.id === expandedItemId)
          ? expandedItemId
          : currentDraft.items[0]?.id ?? null;

  const updateItem = (targetId: string, nextItem: ScanDraftItem) => {
    updateActiveDraft((draft) => ({
      ...draft,
      items: draft.items.map((item) => (item.id === targetId ? nextItem : item)),
    }));
  };

  const removeItem = (targetId: string) => {
    const removedIndex = currentDraft.items.findIndex((item) => item.id === targetId);
    const remainingItems = currentDraft.items.filter((item) => item.id !== targetId);

    if (effectiveExpandedItemId === targetId) {
      const replacementItem =
        remainingItems[removedIndex] ?? remainingItems[Math.max(removedIndex - 1, 0)] ?? null;
      setExpandedItemId(replacementItem?.id ?? null);
    }

    updateActiveDraft((draft) => ({
      ...draft,
      items: draft.items.filter((item) => item.id !== targetId),
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 168,
            paddingTop: Math.max(insets.top + 12, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <ThemedText size="xl" style={styles.title}>
            Review meal
          </ThemedText>
          <View
            style={[
              styles.confidenceChip,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <ThemedText size="xs" variant="secondary">
              {`${currentDraft.overallConfidence.charAt(0).toUpperCase()}${currentDraft.overallConfidence.slice(1)} confidence`}
            </ThemedText>
          </View>
        </View>

        {currentDraft.items.map((item) => {
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
              expanded={effectiveExpandedItemId === item.id}
              item={item}
              key={item.id}
              mealType={currentDraft.mealType}
              nutritionRows={nutritionRows}
              onChange={(nextItem) => updateItem(item.id, nextItem)}
              onMealTypeChange={(nextMealType) =>
                updateActiveDraft((draft) => ({
                  ...draft,
                  mealType: nextMealType,
                }))
              }
              onRemove={() => removeItem(item.id)}
              onToggleExpand={() =>
                setExpandedItemId((current) => {
                  const currentExpanded =
                    current === undefined ? currentDraft.items[0]?.id ?? null : current;

                  return currentExpanded === item.id ? null : item.id;
                })
              }
            />
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.cardBorder,
            bottom: 0,
            left: 0,
            paddingBottom: Math.max(insets.bottom, 12),
            right: 0,
          },
        ]}
        testID="scan-review-footer"
      >
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
            style={styles.footerButton}
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
                  mealType: currentDraft.mealType,
                  overallConfidence: currentDraft.overallConfidence,
                  photoStorageId: currentDraft.photoStorageId || undefined,
                });
                if (activeReviewJob) {
                  completeReviewJob(activeReviewJob.id);
                }
                announceReviewedSave(currentDraft.mealType === "drink" ? "Drink added" : "Meal added");
                router.replace("/(tabs)/log");
              } catch (error) {
                setSaveError(
                  error instanceof Error ? error.message : "This AI meal could not be saved."
                );
              } finally {
                setIsSaving(false);
              }
            }}
            style={styles.footerButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confidenceChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  footerActions: {
    columnGap: 10,
    flexDirection: "row",
  },
  footerBar: {
    borderTopWidth: 1,
    elevation: 14,
    paddingHorizontal: 20,
    position: "absolute",
    paddingTop: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  footerButton: {
    flex: 1,
  },
  saveError: {
    marginBottom: 10,
  },
  screen: {
    flex: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    flex: 1,
  },
});
