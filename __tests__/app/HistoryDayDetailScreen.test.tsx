import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { colors } from "../../lib/theme/colors";
import HistoryDayDetailScreen from "../../app/history/[dateKey]";

const mockUseLocalSearchParams = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: 18,
  }),
}));

describe("HistoryDayDetailScreen", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReturnValue(jest.fn());
  });

  it("renders the day summary and a mixed meal + hydration timeline", () => {
    mockUseLocalSearchParams.mockReturnValue({ dateKey: "2026-03-29" });
    mockUseQuery.mockReturnValue({
      dateKey: "2026-03-29",
      summary: {
        calories: 745,
        hydrationCups: 2,
        mealCount: 1,
        nutritionCoveragePercent: 18,
        protein: 23,
        wellnessScore: 64,
      },
      timeline: [
        {
          amountCups: 2,
          amountOz: 16,
          id: "water-1",
          kind: "hydration",
          label: "Water",
          timestamp: Date.parse("2026-03-29T22:00:00.000Z"),
        },
        {
          calories: 320,
          carbs: 34,
          entryMethod: "photo_scan",
          entryMethodLabel: "FoodScan",
          fat: 9,
          id: "meal-1",
          itemCount: 2,
          kind: "meal",
          label: "Breakfast scan (2 items)",
          mealType: "breakfast",
          protein: 23,
          timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
        },
      ],
    });

    const { getAllByText, getByTestId, getByText } = render(<HistoryDayDetailScreen />);

    expect(getByText("Sun, Mar 29")).toBeTruthy();
    expect(getByText("64")).toBeTruthy();
    expect(getByText("320 cal")).toBeTruthy();
    expect(getByTestId("history-day-detail-back-button")).toBeTruthy();
    expect(getByText("FoodScan")).toBeTruthy();
    expect(getByText("Water")).toBeTruthy();
    expect(getByText("16 oz")).toBeTruthy();
    expect(getAllByText("Edit").length).toBeGreaterThan(0);
    expect(getAllByText("Delete").length).toBeGreaterThan(0);
  });

  it("uses category colors for summary labels and matches the history score accent", () => {
    mockUseLocalSearchParams.mockReturnValue({ dateKey: "2026-03-29" });
    mockUseQuery.mockReturnValue({
      dateKey: "2026-03-29",
      summary: {
        calories: 745,
        hydrationCups: 2,
        mealCount: 1,
        nutritionCoveragePercent: 18,
        protein: 23,
        wellnessScore: 31,
      },
      timeline: [],
    });

    const { getByTestId } = render(<HistoryDayDetailScreen />);

    const caloriesLabelColor = StyleSheet.flatten(
      getByTestId("history-day-detail-calories-label").props.style
    ).color;
    const proteinLabelColor = StyleSheet.flatten(
      getByTestId("history-day-detail-protein-label").props.style
    ).color;
    const hydrationLabelColor = StyleSheet.flatten(
      getByTestId("history-day-detail-hydration-label").props.style
    ).color;
    const nutritionLabelColor = StyleSheet.flatten(
      getByTestId("history-day-detail-nutrition-label").props.style
    ).color;
    const scoreColor = StyleSheet.flatten(getByTestId("history-day-detail-score").props.style).color;

    expect([colors.dark.metricCalories, colors.light.metricCalories]).toContain(caloriesLabelColor);
    expect([colors.dark.metricProtein, colors.light.metricProtein]).toContain(proteinLabelColor);
    expect([colors.dark.metricHydration, colors.light.metricHydration]).toContain(hydrationLabelColor);
    expect([colors.dark.metricNutrition, colors.light.metricNutrition]).toContain(nutritionLabelColor);
    expect([colors.dark.accent1, colors.light.accent1]).toContain(scoreColor);
  });
});
