import React, { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { MEAL_TYPE_OPTIONS } from "../../lib/domain/meals";
import { ScanDraftItem } from "../../lib/domain/scan";
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
  const insets = useSafeAreaInsets();
  const { activeReviewJob, clearActiveReview, completeReviewJob, updateActiveDraft } = useScanFlow();
  const saveAiEntry = useMutation(api.meals.saveAiEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const currentDraft = activeReviewJob?.draft ?? null;

  useEffect(() => {
    if (!currentDraft?.items.length) {
      return;
    }

    setExpandedItemIds((current) => {
      const next: Record<string, boolean> = {};
      let changed = false;

      currentDraft.items.forEach((item, index) => {
        next[item.id] = current[item.id] ?? index === 0;

        if (current[item.id] !== next[item.id]) {
          changed = true;
        }
      });

      if (Object.keys(current).some((itemId) => !(itemId in next))) {
        changed = true;
      }

      if (!currentDraft.items.some((item) => next[item.id])) {
        next[currentDraft.items[0].id] = true;
        changed = true;
      }

      return changed ? next : current;
    });
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
    const nextExpandedItemId = currentDraft.items.find((item) => item.id !== targetId)?.id;

    setExpandedItemIds((current) => {
      const next = { ...current };
      delete next[targetId];

      if (nextExpandedItemId && !Object.values(next).some(Boolean)) {
        next[nextExpandedItemId] = true;
      }

      return next;
    });

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
        <ThemedText size="xl" style={styles.title}>
          Review meal
        </ThemedText>

        <View
          style={[
            styles.summaryStrip,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
          testID="scan-review-summary-strip"
        >
          <View style={styles.summaryHeader}>
            <ThemedText size="sm">Meal type</ThemedText>
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
        </View>

        {currentDraft.items.map((item) => (
          <ScanReviewItemCard
            expanded={expandedItemIds[item.id] ?? false}
            item={item}
            key={item.id}
            onChange={(nextItem) => updateItem(item.id, nextItem)}
            onRemove={() => removeItem(item.id)}
            onToggleExpand={() =>
              setExpandedItemIds((current) => ({
                ...current,
                [item.id]: !current[item.id],
              }))
            }
          />
        ))}
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
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryStrip: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
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
    rowGap: 8,
  },
});
