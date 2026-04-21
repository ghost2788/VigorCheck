import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { HistoryDayCard } from "../../components/HistoryDayCard";
import { colors } from "../../lib/theme/colors";

describe("HistoryDayCard", () => {
  it("uses the macro metric colors for calories, protein, carbs, and fat labels", () => {
    const { getByTestId } = render(
      <HistoryDayCard
        onPress={jest.fn()}
        summary={{
          calories: 745,
          carbs: 68,
          dateKey: "2026-03-29",
          entryCount: 2,
          fat: 24,
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
    const carbsColor = StyleSheet.flatten(
      getByTestId("history-day-card-carbs-label").props.style
    ).color;
    const fatColor = StyleSheet.flatten(
      getByTestId("history-day-card-fat-label").props.style
    ).color;

    expect([colors.dark.metricCalories, colors.light.metricCalories]).toContain(caloriesColor);
    expect([colors.dark.metricProtein, colors.light.metricProtein]).toContain(proteinColor);
    expect([colors.dark.metricCarbs, colors.light.metricCarbs]).toContain(carbsColor);
    expect([colors.dark.metricFat, colors.light.metricFat]).toContain(fatColor);
  });

  it("renders the neutral footer label so supplement-only days are visible", () => {
    const { getByText } = render(
      <HistoryDayCard
        onPress={jest.fn()}
        summary={{
          calories: 10,
          carbs: 1,
          dateKey: "2026-03-30",
          entryCount: 1,
          fat: 0,
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
