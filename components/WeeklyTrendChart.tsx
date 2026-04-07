import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

export type TrendChartMetric = "calories" | "hydration" | "nutrition" | "protein" | "wellness";

type TrendChartDay = {
  calories: number;
  caloriesScore: number;
  hydrationCups: number;
  hydrationScore: number;
  isFuture: boolean;
  nutritionCoveragePercent: number;
  protein: number;
  proteinScore: number;
  shortLabel: string;
  wellnessScore: number;
};

type WeeklyTrendChartProps = {
  activeMetric: TrendChartMetric;
  days: TrendChartDay[];
  onChangeMetric: (metric: TrendChartMetric) => void;
  targets: {
    calories: number;
    hydration: number;
    protein: number;
  };
};

const CHART_VISUAL_HEIGHT = 248;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDisplayPercent(
  day: TrendChartDay,
  metric: TrendChartMetric,
  targets: WeeklyTrendChartProps["targets"]
) {
  if (day.isFuture) {
    return null;
  }

  if (metric === "calories") {
    if (!targets.calories) {
      return 0;
    }

    return clampPercent((day.calories / targets.calories) * 100);
  }

  if (metric === "protein") {
    return clampPercent(day.proteinScore);
  }

  if (metric === "hydration") {
    return clampPercent(day.hydrationScore);
  }

  if (metric === "nutrition") {
    return clampPercent(day.nutritionCoveragePercent);
  }

  return clampPercent(day.wellnessScore);
}

export function WeeklyTrendChart({
  activeMetric,
  days,
  onChangeMetric,
  targets,
}: WeeklyTrendChartProps) {
  const { theme } = useTheme();
  const metrics = useMemo(
    () => [
      { key: "wellness" as const, label: "Wellness" },
      { key: "calories" as const, label: "Calories" },
      { key: "protein" as const, label: "Protein" },
      { key: "hydration" as const, label: "Hydration" },
      { key: "nutrition" as const, label: "Nutrition" },
    ],
    []
  );
  const config = useMemo(() => {
    if (activeMetric === "calories") {
      return {
        color: theme.metricCalories,
        hint: "Target balance %",
        label: "Calories",
      };
    }

    if (activeMetric === "protein") {
      return {
        color: theme.metricProtein,
        hint: "Goal progress %",
        label: "Protein",
      };
    }

    if (activeMetric === "hydration") {
      return {
        color: theme.metricHydration,
        hint: "Goal progress %",
        label: "Hydration",
      };
    }

    if (activeMetric === "nutrition") {
      return {
        color: theme.metricNutrition,
        hint: "Daily coverage %",
        label: "Nutrition",
        target: null,
      };
    }

    return {
      color: theme.text,
      hint: "Daily score %",
      label: "Wellness",
    };
  }, [activeMetric, theme]);

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
            Weekly chart
          </ThemedText>
          <ThemedText size="sm">{config.label}</ThemedText>
        </View>
        <ThemedText size="sm" style={{ color: config.color }}>
          {config.hint}
        </ThemedText>
      </View>

      <View style={styles.segmentedControl}>
        {metrics.map((metric) => {
          const active = metric.key === activeMetric;

          return (
            <Pressable
              key={metric.key}
              accessibilityRole="button"
              onPress={() => onChangeMetric(metric.key)}
              style={({ pressed }) => [
                styles.segment,
                {
                  backgroundColor: active ? hexToRgba(config.color, 0.15) : theme.surfaceSoft,
                  borderColor: active ? hexToRgba(config.color, 0.22) : theme.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText
                size="sm"
                style={{
                  color: active ? config.color : theme.textSecondary,
                }}
              >
                {metric.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.visualArea} testID={`weekly-trend-chart-mode-${activeMetric}`}>
        <View style={styles.hiddenMarker} testID="weekly-trend-chart-strip" />
        <View style={styles.heatStrip}>
          {days.map((day, index) => {
            const displayPercent = getDisplayPercent(day, activeMetric, targets);
            const isFuture = day.isFuture || displayPercent === null;

            return (
              <View
                key={`${activeMetric}-${day.shortLabel}-${index}`}
                style={styles.heatStripColumn}
              >
                <ThemedText
                  size="sm"
                  variant={isFuture ? "muted" : "tertiary"}
                  style={styles.heatStripDayLabel}
                >
                  {day.shortLabel}
                </ThemedText>
                <View
                  style={[
                    styles.heatCell,
                    isFuture
                      ? {
                          backgroundColor: "transparent",
                          borderColor: theme.cardBorder,
                          borderStyle: "dashed",
                        }
                      : {
                          backgroundColor: hexToRgba(config.color, 0.05),
                          borderColor: hexToRgba(config.color, 0.22),
                        },
                  ]}
                  testID={`weekly-trend-chart-cell-${activeMetric}-${index}-${isFuture ? "future" : "active"}`}
                >
                  {!isFuture ? (
                    <View
                      style={[
                        styles.heatFill,
                        {
                          backgroundColor: hexToRgba(config.color, 0.82),
                          height: `${displayPercent}%`,
                        },
                      ]}
                      testID={`weekly-trend-chart-fill-${activeMetric}-${index}`}
                    />
                  ) : null}
                </View>
                <ThemedText
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  numberOfLines={1}
                  size="sm"
                  style={[
                    styles.heatStripValueLabel,
                    { color: isFuture ? theme.textMuted : config.color },
                  ]}
                >
                  {isFuture ? "—" : `${displayPercent}%`}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heatCell: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 128,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  heatFill: {
    borderRadius: 14,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  heatStrip: {
    alignItems: "stretch",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  heatStripColumn: {
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  heatStripDayLabel: {
    textAlign: "center",
  },
  heatStripValueLabel: {
    textAlign: "center",
    width: "100%",
  },
  hiddenMarker: {
    height: 0,
    opacity: 0,
    width: 0,
  },
  segment: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmentedControl: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  visualArea: {
    height: CHART_VISUAL_HEIGHT,
  },
});
