import React from "react";
import { Text } from "react-native";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import HomeScreen from "../../app/(tabs)/index";
import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockPush = jest.fn();
const mockUseSubscription = jest.fn();

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

function HomeHarness() {
  const [visible, setVisible] = React.useState(true);

  return (
    <>
      <Text onPress={() => setVisible(false)}>hide-home</Text>
      <Text onPress={() => setVisible(true)}>show-home</Text>
      {visible ? <HomeScreen /> : null}
    </>
  );
}

describe("HomeScreen onboarding CTA", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockPush.mockReset();
    mockUseSubscription.mockReset();
    mockUseSubscription.mockReturnValue({
      accessState: null,
    });
  });

  it("shows the post-onboarding CTA once and routes to Log", async () => {
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseQuery.mockReturnValue({
      dateKey: "2026-03-29",
      targets: {
        calories: 2200,
        carbs: 240,
        fat: 75,
        hydration: 8,
        protein: 140,
      },
      timeZone: "Pacific/Honolulu",
      ...buildTodayDashboard({
        hydrationLogs: [],
        mealItems: [],
        meals: [],
        targets: {
          calories: 2200,
          carbs: 240,
          hydration: 8,
          nutrition: {
            calcium: 100,
            fiber: 20,
            iron: 10,
            potassium: 1000,
            vitaminC: 100,
            vitaminD: 10,
          },
          detailedNutrition: getDetailedNutrientTargets({
            age: 30,
            sex: "male",
            targetFiber: 20,
          }),
          fat: 75,
          protein: 140,
        },
      }),
    });

    const { getByText, queryByText } = render(
      <OnboardingFlowProvider initialShowPostOnboardingHomeCTA>
        <HomeHarness />
      </OnboardingFlowProvider>
    );

    expect(getByText("Daily Vigor")).toBeTruthy();
    expect(
      getByText("Your plan is ready. Log your first meal to start filling today's rings.")
    ).toBeTruthy();

    fireEvent.press(getByText("Log first meal"));
    expect(mockPush).toHaveBeenCalledWith("/(tabs)/log");

    fireEvent.press(getByText("hide-home"));
    fireEvent.press(getByText("show-home"));

    await waitFor(() => {
      expect(
        queryByText("Your plan is ready. Log your first meal to start filling today's rings.")
      ).toBeNull();
    });
  });
});
