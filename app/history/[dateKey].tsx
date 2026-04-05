import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../../components/Card";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";
import { NutrientProgressRows } from "../../components/NutrientProgressRows";
import { ThemedText } from "../../components/ThemedText";
import { WellnessAccordionList } from "../../components/WellnessAccordionList";
import { api } from "../../convex/_generated/api";
import { formatHistoryDateLabel } from "../../lib/domain/history";
import {
  getNutritionCoverageDetailCopy,
  getNutritionCoverageDescriptor,
} from "../../lib/domain/homeInsight";
import { buildExpandedNutrientProgressRows } from "../../lib/domain/nutrientProgress";
import { useTheme } from "../../lib/theme/ThemeProvider";

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatCompactNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function NutrientInsightSummaryCard({
  accentColor,
  emptyLabel,
  items,
  title,
}: {
  accentColor: string;
  emptyLabel: string;
  items: Array<{
    label: string;
    percent: number;
    target: number;
    unit: string;
    value: number;
  }>;
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" style={styles.insightTitle}>
        {title}
      </ThemedText>
      {items.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {emptyLabel}
        </ThemedText>
      ) : (
        items.slice(0, 2).map((item) => (
          <View key={`${title}-${item.label}`} style={styles.insightRow}>
            <View style={styles.insightRowTop}>
              <ThemedText size="sm">{item.label}</ThemedText>
              <ThemedText size="sm" style={{ color: accentColor }}>
                {formatPercent(item.percent)}
              </ThemedText>
            </View>
            <ThemedText size="xs" variant="secondary">
              {formatCompactNumber(item.value)} / {formatCompactNumber(item.target)} {item.unit}
            </ThemedText>
          </View>
        ))
      )}
    </View>
  );
}

export default function HistoryDayDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const deleteMeal = useMutation(api.meals.deleteMeal);
  const deleteHydrationLog = useMutation(api.hydration.deleteLog);
  const params = useLocalSearchParams<{ dateKey?: string }>();
  const dateKey = typeof params.dateKey === "string" ? params.dateKey : null;
  const detail = useQuery(api.history.dayDetail, dateKey ? { dateKey } : "skip");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  if (!dateKey || detail === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm" style={styles.emptyTitle}>
            Day not found
          </ThemedText>
          <ThemedText variant="secondary" style={styles.emptyBody}>
            This date does not have any saved meals or hydration entries yet.
          </ThemedText>
        </Card>
      </View>
    );
  }

  const nutrientRows = buildExpandedNutrientProgressRows({
    detailGroups: detail.summary.nutrientGroups,
  });

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 26) }]}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <View style={styles.headerRow}>
        <ThemedText size="xl" style={styles.title}>
          {formatHistoryDateLabel(detail.dateKey)}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
          testID="history-day-detail-back-button"
        >
          <Ionicons color={theme.accent1} name="chevron-back" size={18} />
          <ThemedText size="sm" variant="accent1">Back</ThemedText>
        </Pressable>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <ThemedText
            size="hero"
            style={[styles.summaryScore, { color: theme.accent1 }]}
            testID="history-day-detail-score"
          >
            {detail.summary.wellnessScore}
          </ThemedText>
          <ThemedText size="lg" variant="secondary">
            / 100
          </ThemedText>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricCalories }}
              testID="history-day-detail-calories-label"
            >
              Calories
            </ThemedText>
            <ThemedText size="sm">{detail.summary.calories} kcal</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricProtein }}
              testID="history-day-detail-protein-label"
            >
              Protein
            </ThemedText>
            <ThemedText size="sm">{detail.summary.protein}g</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricHydration }}
              testID="history-day-detail-hydration-label"
            >
              Hydration
            </ThemedText>
            <ThemedText size="sm">{detail.summary.hydrationCups.toFixed(1)} cups</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricNutrition }}
              testID="history-day-detail-nutrition-label"
            >
              Nutrition
            </ThemedText>
            <ThemedText size="sm">{detail.summary.nutritionCoveragePercent}%</ThemedText>
          </View>
        </View>
      </Card>

      <View style={styles.insightStack}>
        <NutrientInsightSummaryCard
          accentColor={theme.metricNutrition}
          emptyLabel="No standout wins on this day."
          items={detail.summary.insights?.topWins ?? []}
          title="Day wins"
        />
        <NutrientInsightSummaryCard
          accentColor={theme.metricNutrition}
          emptyLabel="No clear gaps on this day."
          items={detail.summary.insights?.biggestGaps ?? []}
          title="Day gaps"
        />
      </View>

      <View style={styles.nutritionSection}>
        <WellnessAccordionList
          items={[
            {
              accentColor: theme.metricNutrition,
              contentTestID: "history-day-detail-nutrition-content",
              detail: (
                <View>
                  <ThemedText variant="secondary" style={styles.cardInsight}>
                    {getNutritionCoverageDetailCopy()}
                  </ThemedText>
                  <NutrientProgressRows accentColor={theme.metricNutrition} rows={nutrientRows} />
                </View>
              ),
              headerPercentLabel: `(${formatPercent(detail.summary.nutritionCoveragePercent)})`,
              key: "nutrition",
              summary: getNutritionCoverageDescriptor(detail.summary.nutritionCoveragePercent),
              title: "Nutrition",
              triggerTestID: "history-day-detail-nutrition-trigger",
            },
          ]}
        />
      </View>

      {detail.timeline.map((entry) => (
        <HistoryTimelineEntryCard
          entry={entry}
          isExpanded={expandedEntryId === entry.id}
          key={`${entry.kind}-${entry.id}`}
          onDelete={() => {
            if (entry.kind === "hydration") {
              Alert.alert("Delete hydration log", "This will remove the saved hydration entry.", [
                { style: "cancel", text: "Cancel" },
                {
                  style: "destructive",
                  text: "Delete",
                  onPress: () => {
                    void deleteHydrationLog({ logId: entry.id as never });
                  },
                },
              ]);
              return;
            }

            Alert.alert("Delete meal", "This will remove the saved meal and all of its items.", [
              { style: "cancel", text: "Cancel" },
              {
                style: "destructive",
                text: "Delete",
                onPress: () => {
                  void deleteMeal({ mealId: entry.id as never });
                },
              },
            ]);
          }}
          onEdit={() => {
            if (entry.kind === "hydration") {
              router.push(`/history/hydration/${entry.id}`);
              return;
            }

            router.push(`/history/meals/${entry.id}`);
          }}
          onToggle={() => setExpandedEntryId((current) => current === entry.id ? null : entry.id)}
          targets={detail.targets}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cardInsight: {
    lineHeight: 20,
    marginBottom: 14,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  emptyBody: {
    marginTop: 8,
  },
  emptyCard: {
    width: "100%",
  },
  emptyTitle: {},
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  insightCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  insightRow: {
    gap: 4,
  },
  insightRowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  insightStack: {
    gap: 10,
    marginBottom: 18,
  },
  insightTitle: {
    marginBottom: 2,
  },
  nutritionSection: {
    marginBottom: 18,
  },
  summaryCard: {
    marginBottom: 18,
  },
  summaryGrid: {
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  summaryHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryMetric: {
    minWidth: "45%",
  },
  summaryScore: {
    marginRight: 6,
  },
  title: {
    flex: 1,
    marginRight: 12,
  },
});
