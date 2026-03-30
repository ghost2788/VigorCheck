import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

export type TrendChartMetric = "calories" | "hydration" | "nutrition" | "protein" | "wellness";

type TrendChartDay = {
  calories: number;
  hydrationCups: number;
  isFuture: boolean;
  nutritionCoveragePercent: number;
  protein: number;
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

type ChartDatum = {
  label: string;
  target: number | null;
  value: number | null;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        hint: `${targets.calories.toLocaleString()} kcal target`,
        label: "Calories",
        maxY: undefined as number | undefined,
        target: targets.calories,
      };
    }

    if (activeMetric === "protein") {
      return {
        color: theme.metricProtein,
        hint: `${targets.protein} g target`,
        label: "Protein",
        maxY: undefined as number | undefined,
        target: targets.protein,
      };
    }

    if (activeMetric === "hydration") {
      return {
        color: theme.metricHydration,
        hint: `${targets.hydration} cups target`,
        label: "Hydration",
        maxY: undefined as number | undefined,
        target: targets.hydration,
      };
    }

    if (activeMetric === "nutrition") {
      return {
        color: theme.metricNutrition,
        hint: "Daily coverage %",
        label: "Nutrition",
        maxY: 100,
        target: null,
      };
    }

    return {
      color: theme.text,
      hint: "Daily wellness score",
      label: "Wellness",
      maxY: 100,
      target: null,
    };
  }, [activeMetric, targets.calories, targets.hydration, targets.protein, theme]);
  const chartData = useMemo<ChartDatum[]>(() => {
    return days.map((day) => {
      const value = (() => {
        if (day.isFuture) {
          return null;
        }

        if (activeMetric === "calories") {
          return day.calories;
        }

        if (activeMetric === "protein") {
          return day.protein;
        }

        if (activeMetric === "hydration") {
          return day.hydrationCups;
        }

        if (activeMetric === "nutrition") {
          return day.nutritionCoveragePercent;
        }

        return day.wellnessScore;
      })();

      return {
        label: day.shortLabel,
        target: config.target,
        value,
      };
    });
  }, [activeMetric, config.target, days]);
  const yKeys: Array<"value" | "target"> =
    config.target === null ? ["value"] : ["value", "target"];

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

      <View style={styles.chartWrap}>
        <CartesianChart
          data={chartData}
          domain={config.maxY ? { y: [0, config.maxY] } : undefined}
          padding={{ bottom: 12, left: 8, right: 8, top: 18 }}
          xKey="label"
          yKeys={yKeys}
        >
          {({ points }) => (
            <>
              {config.target !== null ? (
                <Line
                  color={hexToRgba(config.color, 0.28)}
                  points={(points as typeof points & { target: (typeof points)["value"] }).target}
                  strokeWidth={1.5}
                />
              ) : null}
              <Line
                color={config.color}
                connectMissingData={false}
                points={points.value}
                strokeWidth={3}
              />
            </>
          )}
        </CartesianChart>
      </View>

      <View style={styles.labelRow}>
        {days.map((day) => (
          <View key={`${activeMetric}-${day.shortLabel}`} style={styles.labelCell}>
            <ThemedText
              size="sm"
              variant={day.isFuture ? "muted" : "tertiary"}
              style={styles.labelText}
            >
              {day.shortLabel}
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    height: 220,
    marginBottom: 6,
  },
  eyebrow: {
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  labelCell: {
    alignItems: "center",
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelText: {
    textAlign: "center",
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
});
