import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Card } from "../../components/Card";
import { ThemedText } from "../../components/ThemedText";
import { WeekNavigator } from "../../components/WeekNavigator";
import { TrendChartMetric, WeeklyTrendChart } from "../../components/WeeklyTrendChart";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useTheme } from "../../lib/theme/ThemeProvider";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatGapLabel(key: string) {
  if (key === "vitaminC") {
    return "Vitamin C";
  }

  if (key === "vitaminD") {
    return "Vitamin D";
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatStreakCount(count: number, isCapped: boolean) {
  return isCapped ? `${count}+` : String(count);
}

export default function TrendsScreen() {
  const { theme } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeMetric, setActiveMetric] = useState<TrendChartMetric>("wellness");
  const data = useQuery(api.trends.weekly, { weekOffset });
  const streakCards = useMemo(
    () =>
      data
        ? [
            { color: theme.accent2, key: "logging", label: "Logging", value: data.streaks.logging },
            { color: theme.metricCalories, key: "calories", label: "Calories", value: data.streaks.calories },
            { color: theme.metricProtein, key: "protein", label: "Protein", value: data.streaks.protein },
            { color: theme.metricHydration, key: "hydration", label: "Hydration", value: data.streaks.hydration },
          ]
        : [],
    [data, theme]
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
            <ThemedText size="sm">{data.week.isCurrentWeek ? "This week so far" : "Selected week"}</ThemedText>
          </View>
          <ThemedText size="hero" style={styles.summaryScore}>
            {data.overview.weeklyWellnessScore}
          </ThemedText>
        </View>

        <ThemedText variant="secondary">
          {data.overview.onTrackDays} of {data.week.elapsedDays} days on track
        </ThemedText>
      </Card>

      <View style={styles.streakGrid}>
        {streakCards.map((card) => (
          <Card key={card.key} style={styles.streakCard}>
            <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
              {card.label}
            </ThemedText>
            <ThemedText size="lg" style={{ color: card.color }}>
              {formatStreakCount(card.value.count, card.value.isCapped)}
            </ThemedText>
            <ThemedText variant="secondary" size="sm">
              current streak
            </ThemedText>
          </Card>
        ))}
      </View>

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
          Recurring gaps: {data.nutrition.recurringGaps.map(formatGapLabel).join(" and ")}
        </ThemedText>

        {data.nutrition.nutrients.map((nutrient) => (
          <View key={nutrient.key} style={styles.nutrientRow}>
            <View style={styles.nutrientCopy}>
              <ThemedText size="sm">{formatGapLabel(nutrient.key)}</ThemedText>
              <ThemedText size="sm" style={{ color: theme.metricNutrition }}>
                {formatPercent(nutrient.averagePercent)}
              </ThemedText>
            </View>
            <View
              style={[
                styles.nutrientTrack,
                { backgroundColor: hexToRgba(theme.metricNutrition, 0.12) },
              ]}
            >
              <View
                style={[
                  styles.nutrientFill,
                  {
                    backgroundColor: theme.metricNutrition,
                    width: `${nutrient.averagePercent}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
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
  loadingLabel: {
    marginTop: 12,
  },
  nutrientCopy: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nutrientFill: {
    borderRadius: 999,
    height: "100%",
  },
  nutrientRow: {
    marginTop: 12,
  },
  nutrientTrack: {
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  nutritionSummary: {
    marginBottom: 4,
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
  streakCard: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  streakGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
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
  title: {
    marginBottom: 20,
  },
});
