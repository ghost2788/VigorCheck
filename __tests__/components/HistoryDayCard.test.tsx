import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { colors } from "../../lib/theme/colors";
import { HistoryDayCard } from "../../components/HistoryDayCard";

describe("HistoryDayCard", () => {
  it("uses the home metric colors for calories, protein, hydration, and nutrition labels", () => {
    const { getByTestId } = render(
      <HistoryDayCard
        onPress={jest.fn()}
        summary={{
          calories: 745,
          dateKey: "2026-03-29",
          hydrationCups: 2,
          mealCount: 1,
          nutritionCoveragePercent: 18,
          protein: 23,
          wellnessScore: 64,
        }}
      />
    );

    const caloriesColor = StyleSheet.flatten(
      getByTestId("history-day-card-calories-label").props.style
    ).color;
    const proteinColor = StyleSheet.flatten(
      getByTestId("history-day-card-protein-label").props.style
    ).color;
    const hydrationColor = StyleSheet.flatten(
      getByTestId("history-day-card-hydration-label").props.style
    ).color;
    const nutritionColor = StyleSheet.flatten(
      getByTestId("history-day-card-nutrition-label").props.style
    ).color;

    expect([colors.dark.metricCalories, colors.light.metricCalories]).toContain(caloriesColor);
    expect([colors.dark.metricProtein, colors.light.metricProtein]).toContain(proteinColor);
    expect([colors.dark.metricHydration, colors.light.metricHydration]).toContain(hydrationColor);
    expect([colors.dark.metricNutrition, colors.light.metricNutrition]).toContain(nutritionColor);
  });
});
