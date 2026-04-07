import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Card } from "../../components/Card";
import { NutrientProgressRows } from "../../components/NutrientProgressRows";
import { ThemedText } from "../../components/ThemedText";
import { WeekNavigator } from "../../components/WeekNavigator";
import { TrendChartMetric, WeeklyTrendChart } from "../../components/WeeklyTrendChart";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import {
  buildExpandedNutrientProgressRows,
  formatNutrientProgressLabel,
} from "../../lib/domain/nutrientProgress";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { getWeeklyWellnessBandColor } from "../../lib/domain/trendsPresentation";

function formatPercent(value: number) {
  return `${value}%`;
}

function NutrientHighlightCard({
  accentColor,
  emptyLabel,
  items,
  title,
}: {
  accentColor: string;
  emptyLabel: string;
  items: string[];
  title: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.highlightCard,
        {
          backgroundColor: theme.surfaceSoft,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="xs" style={styles.highlightTitle} variant="tertiary">
        {title}
      </ThemedText>
      {items.length === 0 ? (
        <ThemedText size="sm" variant="secondary">
          {emptyLabel}
        </ThemedText>
      ) : (
        items.slice(0, 2).map((item) => (
          <ThemedText key={`${title}-${item}`} size="sm" style={{ color: accentColor }}>
            {formatNutrientProgressLabel(item)}
          </ThemedText>
        ))
      )}
    </View>
  );
}

export default function TrendsScreen() {
  const { mode, theme } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeMetric, setActiveMetric] = useState<TrendChartMetric>("wellness");
  const data = useQuery(api.trends.weekly, { weekOffset });
  const weeklyWellnessColor = useMemo(
    () =>
      data
        ? getWeeklyWellnessBandColor({
            mode,
            score: data.overview.weeklyWellnessScore,
          })
        : theme.text,
    [data, mode, theme.text]
  );
  const nutritionRows = useMemo(
    () =>
      data
        ? buildExpandedNutrientProgressRows({
            detailGroups: data.nutrition.detailGroups,
          })
        : [],
    [data]
  );

  if (data === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading trends...
        </ThemedText>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.setupCard}>
          <ThemedText size="sm" style={styles.setupTitle}>
            Finish setup first
          </ThemedText>
          <ThemedText variant="secondary">
            Trends will activate after your profile and targets are saved.
          </ThemedText>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemedText size="xl" style={styles.title}>
        Trends
      </ThemedText>

      <WeekNavigator
        canGoNewer={data.week.canGoNewer}
        canGoOlder={data.week.canGoOlder}
        isCurrentWeek={data.week.isCurrentWeek}
        label={data.week.label}
        onPressNewer={() => {
          if (data.week.canGoNewer) {
            setWeekOffset((current) => Math.max(0, current - 1));
          }
        }}
        onPressOlder={() => {
          if (data.week.canGoOlder) {
            setWeekOffset((current) => current + 1);
          }
        }}
      />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
              Weekly wellness
            </ThemedText>
            <ThemedText size="sm">
              {data.week.isCurrentWeek ? "This week so far" : "Selected week"}
            </ThemedText>
          </View>
          <View style={styles.summaryScoreGroup}>
            <ThemedText size="hero" style={[styles.summaryScore, { color: weeklyWellnessColor }]}>
              {data.overview.weeklyWellnessScore}
            </ThemedText>
            <ThemedText size="sm" variant="secondary" style={styles.summaryScoreMax}>
              / 100
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="secondary">
          {data.overview.onTrackDays} of {data.week.elapsedDays} days on track
        </ThemedText>
      </Card>

      <View style={styles.section}>
        <WeeklyTrendChart
          activeMetric={activeMetric}
          days={data.days}
          onChangeMetric={setActiveMetric}
          targets={data.targets}
        />
      </View>

      <Card style={styles.section}>
        <View style={styles.cardHeader}>
          <View>
            <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
              Nutrition
            </ThemedText>
            <ThemedText size="sm">Average weekly coverage</ThemedText>
          </View>
          <ThemedText size="lg" style={{ color: theme.metricNutrition }}>
            {formatPercent(data.nutrition.averageCoveragePercent)}
          </ThemedText>
        </View>

        <ThemedText variant="secondary" style={styles.nutritionSummary}>
          Ranked from the full tracked nutrient set, not just the six nutrients used in the wellness score.
        </ThemedText>

        <View style={styles.highlightGrid}>
          <NutrientHighlightCard
            accentColor={theme.metricNutrition}
            emptyLabel="No recurring gaps yet."
            items={data.nutrition.recurringGaps ?? []}
            title="Recurring gaps"
          />
          <NutrientHighlightCard
            accentColor={theme.metricNutrition}
            emptyLabel="No standout wins yet."
            items={data.nutrition.recurringWins ?? []}
            title="Strong coverage"
          />
        </View>

        <NutrientProgressRows
          accentColor={theme.metricNutrition}
          presentationMode="static_reward_only"
          rows={nutritionRows}
        />
      </Card>

      <Card style={styles.section}>
        <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
          Weekly recap
        </ThemedText>
        <ThemedText variant="secondary">{data.overview.summaryText}</ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  eyebrow: {
    marginBottom: 4,
  },
  highlightCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  highlightGrid: {
    gap: 10,
    marginBottom: 16,
  },
  highlightTitle: {
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  loadingLabel: {
    marginTop: 12,
  },
  nutritionSummary: {
    lineHeight: 20,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  setupCard: {
    width: "100%",
  },
  setupTitle: {
    marginBottom: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryScore: {
    fontSize: 48,
    letterSpacing: -2.4,
    lineHeight: 52,
  },
  summaryScoreGroup: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 6,
  },
  summaryScoreMax: {
    lineHeight: 22,
  },
  title: {
    marginBottom: 20,
  },
});
