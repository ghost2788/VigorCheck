import React from "react";
import { render } from "../../lib/test-utils";
import TrendsScreen from "../../app/(tabs)/trends";

const mockUseQuery = jest.fn();
const mockWeeklyTrendChart = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../components/WeeklyTrendChart", () => ({
  WeeklyTrendChart: (props: unknown) => {
    const { Text } = require("react-native");
    mockWeeklyTrendChart(props);
    return <Text testID="trends-weekly-chart">weekly-chart</Text>;
  },
}));

jest.mock("../../components/WeekNavigator", () => ({
  WeekNavigator: ({ label }: { label: string }) => {
    const { Text } = require("react-native");
    return <Text>{label}</Text>;
  },
}));

const weeklyResponse = {
  days: [
    {
      calories: 1800,
      caloriesScore: 82,
      carbs: 180,
      carbsScore: 83,
      dateKey: "2026-03-29",
      didLogAnything: true,
      fat: 62,
      fatScore: 92,
      hydrationCups: 5,
      hydrationScore: 63,
      isFuture: false,
      nutritionCoveragePercent: 62,
      protein: 120,
      proteinScore: 80,
      shortLabel: "Sun",
      wellnessScore: 78,
    },
  ],
  nutrition: {
    averageCoveragePercent: 62,
    detailGroups: [
      {
        id: "vitamins",
        nutrients: [
          { key: "vitaminA", label: "Vitamin A", percent: 74, target: 6300, targetKind: "minimum", unit: "mcg", value: 4662.7 },
          { key: "vitaminC", label: "Vitamin C", percent: 120, target: 630, targetKind: "minimum", unit: "mg", value: 756 },
          { key: "vitaminD", label: "Vitamin D", percent: 49, target: 105, targetKind: "minimum", unit: "mcg", value: 51.4 },
        ],
        title: "Vitamins",
      },
      {
        id: "minerals",
        nutrients: [
          { key: "fiber", label: "Fiber", percent: 55, target: 210, targetKind: "minimum", unit: "g", value: 115.5 },
          { key: "potassium", label: "Potassium", percent: 61, target: 23800, targetKind: "minimum", unit: "mg", value: 14518 },
          { key: "magnesium", label: "Magnesium", percent: 68, target: 2940, targetKind: "minimum", unit: "mg", value: 1999.8 },
          { key: "sodium", label: "Sodium", percent: 146, target: 16100, targetKind: "maximum", unit: "mg", value: 23506 },
        ],
        title: "Minerals",
      },
      {
        id: "other_nutrients",
        nutrients: [
          { key: "omega3", label: "Omega-3", percent: 78, target: 11.2, targetKind: "minimum", unit: "g", value: 8.7 },
        ],
        title: "Other nutrients",
      },
    ],
    nutrients: [
      { averagePercent: 55, key: "fiber" },
      { averagePercent: 61, key: "potassium" },
      { averagePercent: 68, key: "calcium" },
      { averagePercent: 72, key: "iron" },
      { averagePercent: 49, key: "vitaminD" },
      { averagePercent: 70, key: "vitaminC" },
    ],
    recurringGaps: ["vitaminD", "fiber"],
    recurringWins: ["omega3", "magnesium"],
  },
  overview: {
    onTrackDays: 4,
    summaryText:
      "This week you're averaging 1,800 kcal/day, 120g protein/day, 180g carbs/day, and 62g fat/day. Lowest coverage: vitamin D and fiber.",
    weeklyWellnessScore: 74,
  },
  targets: {
    calories: 2200,
    carbs: 250,
    fat: 70,
    hydration: 8,
    protein: 150,
  },
  week: {
    canGoNewer: false,
    canGoOlder: true,
    elapsedDays: 5,
    isCurrentWeek: true,
    label: "Mar 29 - Apr 4",
  },
};

describe("TrendsScreen", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockWeeklyTrendChart.mockReset();
  });

  it("shows an analytics-first hero without the streak grid", () => {
    mockUseQuery.mockReturnValue(weeklyResponse);

    const { getByTestId, getByText, queryByText } = render(<TrendsScreen />);

    expect(getByText("Weekly wellness")).toBeTruthy();
    expect(getByText("74")).toBeTruthy();
    expect(getByText("/ 100")).toBeTruthy();
    expect(getByText("4 of 5 days on track")).toBeTruthy();
    expect(getByTestId("trends-weekly-chart")).toBeTruthy();
    expect(mockWeeklyTrendChart).toHaveBeenCalledWith(
      expect.objectContaining({
        activeMetric: "calories",
      })
    );
    expect(queryByText("Current streak")).toBeNull();
    expect(queryByText("Calories")).toBeNull();
    expect(queryByText("Logging")).toBeNull();
    expect(queryByText("Hydration")).toBeNull();
    expect(queryByText("Protein")).toBeNull();
    expect(queryByText("On track")).toBeNull();
  });

  it("keeps expanded nutrient rows inside the main nutrition card instead of separate group cards", () => {
    mockUseQuery.mockReturnValue(weeklyResponse);

    const { getAllByText, getByTestId, getByText, queryByTestId, queryByText } = render(<TrendsScreen />);

    expect(getByText("Average weekly coverage")).toBeTruthy();
    expect(getByText("Vitamin A")).toBeTruthy();
    expect(getAllByText("Magnesium").length).toBeGreaterThan(0);
    expect(getAllByText("Omega-3").length).toBeGreaterThan(0);
    expect(getByText("115.5 / 210 g")).toBeTruthy();
    expect(getByText("8.7 / 11.2 g")).toBeTruthy();
    expect(getByTestId("nutrient-progress-reward-pill-vitaminC")).toBeTruthy();
    expect(queryByTestId("nutrient-progress-sheen-vitaminC")).toBeNull();
    expect(queryByTestId("nutrient-progress-reward-pill-sodium")).toBeNull();
    expect(queryByText("Vitamins")).toBeNull();
    expect(queryByText("Minerals")).toBeNull();
    expect(queryByText("Other nutrients")).toBeNull();
  });
});
