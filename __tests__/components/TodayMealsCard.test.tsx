import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { colors } from "../../lib/theme/colors";
import { TodayMealsCard } from "../../components/TodayMealsCard";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const meals = [
  {
    id: "meal-1",
    itemCount: 3,
    label: "Chicken bowl",
    mealType: "lunch" as const,
    timestamp: Date.UTC(2026, 3, 6, 13, 12),
    topNutrientSources: [],
    totals: {
      calories: 620,
      carbs: 58,
      fat: 18,
      protein: 42,
    },
  },
  {
    id: "meal-2",
    itemCount: 1,
    label: "Greek yogurt",
    mealType: "snack" as const,
    timestamp: Date.UTC(2026, 3, 6, 16, 45),
    topNutrientSources: [],
    totals: {
      calories: 180,
      carbs: 12,
      fat: 4,
      protein: 19,
    },
  },
];

describe("TodayMealsCard", () => {
  it.each([
    ["dark", colors.dark],
    ["light", colors.light],
  ])("uses token-driven pill and divider surfaces in %s mode", (initialThemePreference, theme) => {
    const { getByTestId } = render(
      <TodayMealsCard emptyLabel="Nothing yet." meals={meals} title="Meals" />,
      {
        initialThemePreference: initialThemePreference as "dark" | "light",
      }
    );

    const caloriePill = getByTestId("today-meals-calorie-pill-meal-1");
    const firstRow = getByTestId("today-meals-row-meal-1");

    expect(StyleSheet.flatten(caloriePill.props.style).backgroundColor).toBe(theme.surfaceSoft);
    expect(StyleSheet.flatten(caloriePill.props.style).borderColor).toBe(
      hexToRgba(theme.metricNutrition, 0.18)
    );
    expect(StyleSheet.flatten(firstRow.props.style).borderBottomColor).toBe(theme.cardBorder);
  });
});
