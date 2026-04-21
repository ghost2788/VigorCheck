import React from "react";
import { render } from "../../lib/test-utils";
import { WeeklyTrendChart } from "../../components/WeeklyTrendChart";

const days = [
  {
    calories: 1800,
    caloriesScore: 44,
    carbs: 180,
    carbsScore: 83,
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
  {
    calories: 1500,
    caloriesScore: 71,
    carbs: 150,
    carbsScore: 68,
    fat: 40,
    fatScore: 61,
    hydrationCups: 4,
    hydrationScore: 50,
    isFuture: false,
    nutritionCoveragePercent: 54,
    protein: 110,
    proteinScore: 73,
    shortLabel: "Mon",
    wellnessScore: 69,
  },
  {
    calories: 0,
    caloriesScore: 0,
    carbs: 0,
    carbsScore: 0,
    fat: 0,
    fatScore: 0,
    hydrationCups: 0,
    hydrationScore: 0,
    isFuture: true,
    nutritionCoveragePercent: 0,
    protein: 0,
    proteinScore: 0,
    shortLabel: "Tue",
    wellnessScore: 0,
  },
];

describe("WeeklyTrendChart", () => {
  it("renders the shared strip layout for wellness", () => {
    const { getByTestId } = render(
      <WeeklyTrendChart
        activeMetric="wellness"
        days={days}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    expect(getByTestId("weekly-trend-chart-mode-wellness")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-strip")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-fill-wellness-0")).toBeTruthy();
  });

  it("uses target progress semantics for calories instead of closeness scoring", () => {
    const { getByTestId } = render(
      <WeeklyTrendChart
        activeMetric="calories"
        days={days}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    const calorieFill = getByTestId("weekly-trend-chart-fill-calories-0");

    expect(getByTestId("weekly-trend-chart-mode-calories")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-strip")).toBeTruthy();
    expect(calorieFill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: "82%",
        }),
      ])
    );
  });

  it("supports macro-first carbs and fat modes using target progress", () => {
    const { getByTestId } = render(
      <WeeklyTrendChart
        activeMetric="carbs"
        days={days}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    expect(getByTestId("weekly-trend-chart-mode-carbs")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-fill-carbs-0").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: "72%",
        }),
      ])
    );
  });

  it("shows partial macro progress for in-progress days instead of zero closeness scores", () => {
    const inProgressDay = [
      {
        calories: 900,
        caloriesScore: 0,
        carbs: 110,
        carbsScore: 0,
        fat: 34,
        fatScore: 0,
        hydrationCups: 0,
        hydrationScore: 0,
        isFuture: false,
        nutritionCoveragePercent: 0,
        protein: 0,
        proteinScore: 0,
        shortLabel: "Thu",
        wellnessScore: 0,
      },
    ];
    const { getByTestId, getByText, rerender } = render(
      <WeeklyTrendChart
        activeMetric="calories"
        days={inProgressDay}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    expect(getByTestId("weekly-trend-chart-fill-calories-0").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: "41%",
        }),
      ])
    );
    expect(getByText("41%")).toBeTruthy();

    rerender(
      <WeeklyTrendChart
        activeMetric="carbs"
        days={inProgressDay}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    expect(getByTestId("weekly-trend-chart-fill-carbs-0").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: "44%",
        }),
      ])
    );

    rerender(
      <WeeklyTrendChart
        activeMetric="fat"
        days={inProgressDay}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    expect(getByTestId("weekly-trend-chart-fill-fat-0").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: "49%",
        }),
      ])
    );
  });

  it("renders inactive future days as outlined cells with dash labels", () => {
    const { getByTestId, getByText } = render(
      <WeeklyTrendChart activeMetric="nutrition" days={days} onChangeMetric={jest.fn()} targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }} />
    );

    expect(getByTestId("weekly-trend-chart-mode-nutrition")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-strip")).toBeTruthy();
    expect(getByTestId("weekly-trend-chart-cell-nutrition-2-future")).toBeTruthy();
    expect(getByText("—")).toBeTruthy();
  });

  it("fills every metric from the bottom using the displayed percentage", () => {
    const { getByTestId, queryByTestId } = render(
      <WeeklyTrendChart activeMetric="hydration" days={days} onChangeMetric={jest.fn()} targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }} />
    );

    const activeFill = getByTestId("weekly-trend-chart-fill-hydration-0");

    expect(activeFill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bottom: 0,
          left: 0,
          position: "absolute",
          right: 0,
        }),
        expect.objectContaining({
          height: "63%",
        }),
      ])
    );
    expect(queryByTestId("weekly-trend-chart-fill-hydration-2")).toBeNull();
  });

  it("keeps 100 percent labels on one line for narrow chart columns", () => {
    const { getByText } = render(
      <WeeklyTrendChart
        activeMetric="hydration"
        days={[
          {
            calories: 1800,
            caloriesScore: 44,
            carbs: 180,
            carbsScore: 83,
            fat: 62,
            fatScore: 92,
            hydrationCups: 8,
            hydrationScore: 100,
            isFuture: false,
            nutritionCoveragePercent: 62,
            protein: 120,
            proteinScore: 80,
            shortLabel: "Fri",
            wellnessScore: 78,
          },
          ...days,
        ]}
        onChangeMetric={jest.fn()}
        targets={{ calories: 2200, carbs: 250, fat: 70, hydration: 8, protein: 150 }}
      />
    );

    const label = getByText("100%");

    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.75);
  });
});
