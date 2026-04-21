import React from "react";
import { View } from "react-native";
import HomeScreen from "../../app/(tabs)/index";
import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";
import { render } from "../../lib/test-utils";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseSubscription = jest.fn();
const mockPush = jest.fn();
const mockConcentricProgressRings = jest.fn();

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

jest.mock("../../lib/onboarding/OnboardingFlowProvider", () => ({
  useOnboardingFlow: () => ({
    consumePostOnboardingHomeCTA: jest.fn(),
    showPostOnboardingHomeCTA: false,
  }),
}));

jest.mock("../../components/ConcentricProgressRings", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    ConcentricProgressRings: (props: { children?: React.ReactNode }) => {
      mockConcentricProgressRings(props);
      return React.createElement(View, { testID: "mock-concentric-progress-rings" }, props.children);
    },
  };
});

describe("HomeScreen rings", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockUseSubscription.mockReset();
    mockPush.mockReset();
    mockConcentricProgressRings.mockReset();
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseSubscription.mockReturnValue({ accessState: null });
  });

  it("passes named ring ids and static reward glow state into the ring widget", () => {
    const dashboard = buildTodayDashboard({
      hydrationLogs: [],
      mealItems: [{ foodName: "Lunch bowl", mealId: "meal-1" }],
      meals: [
        {
          entryMethod: "manual",
          id: "meal-1",
          label: "Lunch bowl",
          mealType: "lunch",
          nutrients: {
            b12: 0,
            b6: 0,
            calcium: 40,
            choline: 0,
            copper: 0,
            fiber: 6,
            folate: 0,
            iron: 0,
            magnesium: 0,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 0,
            riboflavin: 0,
            selenium: 0,
            sodium: 400,
            sugar: 0,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          timestamp: Date.parse("2026-04-04T12:00:00.000Z"),
          totals: {
            calories: 2101,
            carbs: 90,
            fat: 50,
            protein: 55,
          },
        },
      ],
      targets: {
        calories: 2000,
        carbs: 320,
        detailedNutrition: getDetailedNutrientTargets({
          age: 30,
          sex: "male",
          targetFiber: 30,
        }),
        fat: 92,
        hydration: 11,
        nutrition: {
          calcium: 1000,
          fiber: 30,
          iron: 8,
          potassium: 3400,
          vitaminC: 90,
          vitaminD: 15,
        },
        protein: 141,
      },
    });

    dashboard.cards.protein.rawProgressPercent = 96;
    dashboard.wellness.rings.protein = {
      rawProgressPercent: 96,
      score: 96,
    };
    dashboard.cards.carbs.rawProgressPercent = 98;
    dashboard.wellness.rings.carbs = {
      rawProgressPercent: 98,
      score: 98,
    };

    mockUseQuery.mockReturnValue({
      dateKey: "2026-04-04",
      displayName: "Ari",
      targets: {
        calories: 2000,
        carbs: 320,
        fat: 92,
        hydration: 11,
        protein: 141,
      },
      timeZone: "Pacific/Honolulu",
      ...dashboard,
    });

    render(<HomeScreen />);

    const props = mockConcentricProgressRings.mock.calls[0][0];

    expect("motionEnabled" in props).toBe(false);
    expect(props.rings.map((ring: { id: string }) => ring.id)).toEqual([
      "calories",
      "protein",
      "carbs",
      "fat",
    ]);
    expect(props.rings.find((ring: { id: string }) => ring.id === "calories").rewardGlow).toBe(
      false
    );
    expect(props.rings.find((ring: { id: string }) => ring.id === "carbs").rewardGlow).toBe(
      true
    );
  });
});
