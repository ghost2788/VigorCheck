import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { colors } from "../../lib/theme/colors";
import HistoryDayDetailScreen from "../../app/history/[dateKey]";

const MOCK_TARGETS = {
  calories: 2000,
  carbs: 200,
  fat: 67,
  protein: 150,
};

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
      targets: MOCK_TARGETS,
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

    const { getAllByTestId, getByTestId, getByText } = render(<HistoryDayDetailScreen />);

    expect(getByText("Sun, Mar 29")).toBeTruthy();
    expect(getByText("64")).toBeTruthy();
    expect(getByText("320 cal")).toBeTruthy();
    expect(getByTestId("history-day-detail-back-button")).toBeTruthy();
    expect(getByText("FoodScan")).toBeTruthy();
    expect(getByText("Water")).toBeTruthy();
    expect(getByText("16 oz")).toBeTruthy();

    const entryToggles = getAllByTestId("history-timeline-entry-toggle");
    fireEvent.press(entryToggles[0]);

    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
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

  it("shows nutrient source tags on meal entries but not hydration entries", () => {
    mockUseLocalSearchParams.mockReturnValue({ dateKey: "2026-03-29" });
    mockUseQuery.mockReturnValue({
      dateKey: "2026-03-29",
      summary: {
        calories: 745,
        hydrationCups: 2,
        insights: {
          biggestGaps: [],
          topWins: [],
        },
        mealCount: 1,
        nutritionCoveragePercent: 18,
        nutrientGroups: [],
        protein: 23,
        wellnessScore: 64,
      },
      targets: MOCK_TARGETS,
      timeline: [
        {
          amountCups: 2,
          amountOz: 16,
          id: "water-1",
          kind: "hydration",
          label: "Coffee",
          timestamp: Date.parse("2026-03-29T22:00:00.000Z"),
        },
        {
          calories: 320,
          carbs: 34,
          entryMethod: "saved_meal",
          entryMethodLabel: "Saved",
          fat: 9,
          id: "meal-1",
          itemCount: 2,
          kind: "meal",
          label: "Coffee",
          mealType: "breakfast",
          protein: 23,
          timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
          topNutrientSources: [
            {
              key: "vitaminD",
              label: "Vitamin D",
              unit: "mcg",
              value: 13,
            },
            {
              key: "omega3",
              label: "Omega-3",
              unit: "g",
              value: 1.2,
            },
          ],
        },
      ],
    });

    const { getAllByTestId, getByText, queryByText } = render(<HistoryDayDetailScreen />);

    fireEvent.press(getAllByTestId("history-timeline-entry-toggle")[1]);

    expect(getByText("Vitamin D 13mcg")).toBeTruthy();
    expect(getByText("Omega-3 1.2g")).toBeTruthy();
    expect(queryByText("Sodium 240mg")).toBeNull();
  });

  it("renders history nutrient detail with the same progress-row layout used on home and trends", () => {
    mockUseLocalSearchParams.mockReturnValue({ dateKey: "2026-03-29" });
    mockUseQuery.mockReturnValue({
      dateKey: "2026-03-29",
      summary: {
        calories: 745,
        hydrationCups: 2,
        insights: {
          biggestGaps: [],
          topWins: [],
        },
        mealCount: 1,
        nutritionCoveragePercent: 18,
        nutrientGroups: [
          {
            id: "vitamins",
            nutrients: [
              {
                key: "vitaminA",
                label: "Vitamin A",
                percent: 29,
                target: 900,
                targetKind: "minimum",
                unit: "mcg",
                value: 260,
              },
            ],
            title: "Vitamins",
          },
          {
            id: "minerals",
            nutrients: [
              {
                key: "selenium",
                label: "Selenium",
                percent: 98,
                target: 55,
                targetKind: "minimum",
                unit: "mcg",
                value: 54,
              },
            ],
            title: "Minerals",
          },
          {
            id: "other_nutrients",
            nutrients: [
              {
                key: "omega3",
                label: "Omega-3",
                percent: 75,
                target: 1.6,
                targetKind: "minimum",
                unit: "g",
                value: 1.2,
              },
            ],
            title: "Other nutrients",
          },
        ],
        protein: 23,
        wellnessScore: 64,
      },
      timeline: [],
    });

    const { getByTestId, getByText, queryByTestId, queryByText } = render(
      <HistoryDayDetailScreen />
    );

    expect(getByText("Getting started")).toBeTruthy();
    expect(queryByTestId("history-day-detail-nutrition-content")).toBeNull();

    fireEvent.press(getByTestId("history-day-detail-nutrition-trigger"));

    expect(getByTestId("history-day-detail-nutrition-content")).toBeTruthy();
    expect(
      getByText(
        "Coverage reflects foods with tracked nutrients across the expanded vitamin, mineral, and nutrient set."
      )
    ).toBeTruthy();
    expect(getByText("Vitamin A")).toBeTruthy();
    expect(getByText("Selenium")).toBeTruthy();
    expect(getByText("Omega-3")).toBeTruthy();
    expect(getByText("260 / 900 mcg")).toBeTruthy();
    expect(getByText("1.2 / 1.6 g")).toBeTruthy();
    expect(queryByText("Vitamins")).toBeNull();
    expect(queryByText("Minerals")).toBeNull();
    expect(queryByText("Other nutrients")).toBeNull();
  });
});
