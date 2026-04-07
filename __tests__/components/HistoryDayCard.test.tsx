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
          entryCount: 2,
          footerLabel: "2 logged items • 1 supplement",
          hydrationCups: 2,
          mealCount: 1,
          nutritionCoveragePercent: 18,
          protein: 23,
          supplementCount: 1,
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

  it("renders the neutral footer label so supplement-only days are visible", () => {
    const { getByText } = render(
      <HistoryDayCard
        onPress={jest.fn()}
        summary={{
          calories: 10,
          dateKey: "2026-03-30",
          entryCount: 1,
          footerLabel: "1 supplement",
          hydrationCups: 0,
          mealCount: 0,
          nutritionCoveragePercent: 4,
          protein: 0,
          supplementCount: 1,
          wellnessScore: 12,
        }}
      />
    );

    expect(getByText("1 supplement")).toBeTruthy();
  });
});
