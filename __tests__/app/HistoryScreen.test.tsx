import React from "react";
import { render } from "../../lib/test-utils";
import HistoryScreen from "../../app/(tabs)/history";

const mockUsePaginatedQuery = jest.fn();

jest.mock("convex/react", () => ({
  usePaginatedQuery: (...args: unknown[]) => mockUsePaginatedQuery(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("HistoryScreen", () => {
  beforeEach(() => {
    mockUsePaginatedQuery.mockReset();
  });

  it("renders a recent-day feed with history cards", () => {
    mockUsePaginatedQuery.mockReturnValue({
      loadMore: jest.fn(),
      results: [
        {
          calories: 745,
          dateKey: "2026-03-29",
          hydrationCups: 2,
          mealCount: 2,
          nutritionCoveragePercent: 18,
          protein: 23,
          wellnessScore: 64,
        },
      ],
      status: "Exhausted",
    });

    const { getByText } = render(<HistoryScreen />);

    expect(getByText("History")).toBeTruthy();
    expect(getByText("Sun, Mar 29")).toBeTruthy();
    expect(getByText("64")).toBeTruthy();
    expect(getByText("745 kcal")).toBeTruthy();
    expect(getByText("23g protein")).toBeTruthy();
    expect(getByText("2.0 cups")).toBeTruthy();
    expect(getByText("18%")).toBeTruthy();
    expect(getByText("2 meals")).toBeTruthy();
  });
});
