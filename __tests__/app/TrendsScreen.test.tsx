import React from "react";
import { render } from "../../lib/test-utils";
import TrendsScreen from "../../app/(tabs)/trends";

const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../components/WeeklyTrendChart", () => ({
  WeeklyTrendChart: () => {
    const { Text } = require("react-native");
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
      dateKey: "2026-03-29",
      didLogAnything: true,
      hydrationCups: 5,
      isFuture: false,
      nutritionCoveragePercent: 62,
      protein: 120,
      shortLabel: "Sun",
      wellnessScore: 78,
    },
  ],
  nutrition: {
    averageCoveragePercent: 62,
    nutrients: [
      { averagePercent: 55, key: "fiber" },
      { averagePercent: 61, key: "potassium" },
      { averagePercent: 68, key: "calcium" },
      { averagePercent: 72, key: "iron" },
      { averagePercent: 49, key: "vitaminD" },
      { averagePercent: 70, key: "vitaminC" },
    ],
    recurringGaps: ["vitaminD", "fiber"],
  },
  overview: {
    onTrackDays: 4,
    summaryText: "You stayed consistent on protein and hydration this week.",
    weeklyWellnessScore: 74,
  },
  targets: {
    calories: 2200,
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
  });

  it("shows an analytics-first hero without the streak grid", () => {
    mockUseQuery.mockReturnValue(weeklyResponse);

    const { getByTestId, getByText, queryByText } = render(<TrendsScreen />);

    expect(getByText("Weekly wellness")).toBeTruthy();
    expect(getByText("74")).toBeTruthy();
    expect(getByText("/ 100")).toBeTruthy();
    expect(getByText("4 of 5 days on track")).toBeTruthy();
    expect(getByTestId("trends-weekly-chart")).toBeTruthy();
    expect(queryByText("Current streak")).toBeNull();
    expect(queryByText("Calories")).toBeNull();
    expect(queryByText("Logging")).toBeNull();
    expect(queryByText("Hydration")).toBeNull();
    expect(queryByText("Protein")).toBeNull();
    expect(queryByText("On track")).toBeNull();
  });
});
