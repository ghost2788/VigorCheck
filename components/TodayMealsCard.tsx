import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardMeal } from "../lib/domain/dashboard";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { NutrientSourceTagList } from "./NutrientSourceTagList";
import { ThemedText } from "./ThemedText";

type TodayMealsCardProps = {
  emptyLabel: string;
  meals: DashboardMeal[];
  title: string;
};

function formatMealType(value: DashboardMeal["mealType"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMealTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TodayMealsCard({ emptyLabel, meals, title }: TodayMealsCardProps) {
  const { theme } = useTheme();
  const chipColorByMealType: Record<DashboardMeal["mealType"], string> = {
    breakfast: theme.metricCalories,
    dinner: theme.metricHydration,
    drink: theme.metricHydration,
    lunch: theme.metricNutrition,
    snack: theme.metricProtein,
  };

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
            Today
          </ThemedText>
          <ThemedText size="sm">{title}</ThemedText>
        </View>
        <ThemedText variant="secondary" size="sm">
          {meals.length} meals
        </ThemedText>
      </View>

      {meals.length === 0 ? (
        <ThemedText variant="secondary">{emptyLabel}</ThemedText>
      ) : (
        meals.map((meal, index) => (
          <View
            key={meal.id}
            style={[styles.mealRow, index < meals.length - 1 ? styles.mealRowBorder : undefined]}
          >
            <View style={styles.mealHeader}>
              <View style={styles.mealCopy}>
                <ThemedText size="sm">{meal.label}</ThemedText>

                <View style={styles.metaStack}>
                  <View
                    style={[
                      styles.mealChip,
                      {
                        backgroundColor: hexToRgba(chipColorByMealType[meal.mealType], 0.1),
                        borderColor: hexToRgba(chipColorByMealType[meal.mealType], 0.2),
                      },
                    ]}
                  >
                    <ThemedText size="xs" style={{ color: chipColorByMealType[meal.mealType] }}>
                      {formatMealType(meal.mealType)}
                    </ThemedText>
                  </View>

                  <ThemedText variant="tertiary" size="xs">
                    {formatMealTime(meal.timestamp)}
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.caloriePill,
                  {
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderColor: hexToRgba(theme.metricNutrition, 0.14),
                  },
                ]}
              >
                <ThemedText size="sm">{meal.totals.calories} cal</ThemedText>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <ThemedText variant="muted" size="sm">
                {meal.totals.protein}p / {meal.totals.carbs}c / {meal.totals.fat}f
              </ThemedText>
              <ThemedText variant="tertiary" size="sm">
                {meal.itemCount} item{meal.itemCount === 1 ? "" : "s"}
              </ThemedText>
            </View>

            <NutrientSourceTagList sources={meal.topNutrientSources} />
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  caloriePill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyebrow: {
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mealChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mealCopy: {
    flex: 1,
    paddingRight: 12,
  },
  mealHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  mealRow: {
    paddingVertical: 10,
  },
  mealRowBorder: {
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaStack: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
});
