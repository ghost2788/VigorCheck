import React from "react";
import { render, waitFor } from "../../lib/test-utils";
import OnboardingLayout from "../../app/(onboarding)/_layout";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

const mockUseQuery = jest.fn();
const mockUsePathname = jest.fn();
const mockUseConvexAuth = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  Slot: () => {
    const { Text } = require("react-native");
    return <Text>slot</Text>;
  },
  usePathname: () => mockUsePathname(),
}));

describe("OnboardingLayout", () => {
  beforeEach(() => {
    mockUseConvexAuth.mockReset();
    mockUseQuery.mockReset();
    mockUsePathname.mockReset();
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("redirects existing users back to tabs", async () => {
    mockUseQuery.mockReturnValue({ _id: "user-1" });
    mockUsePathname.mockReturnValue("/(onboarding)/goal");

    const { getByText } = render(
      <OnboardingFlowProvider>
        <OnboardingLayout />
      </OnboardingFlowProvider>
    );

    await waitFor(() => {
      expect(getByText("redirect:/(tabs)")).toBeTruthy();
    });
  });

  it("redirects deep links to the first missing onboarding step", async () => {
    mockUseQuery.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/(onboarding)/sex");

    const { getByText } = render(
      <OnboardingFlowProvider>
        <OnboardingLayout />
      </OnboardingFlowProvider>
    );

    await waitFor(() => {
      expect(getByText("redirect:/(onboarding)/goal")).toBeTruthy();
    });
  });

  it("renders the onboarding slot once the required prior steps are complete", () => {
    mockUseQuery.mockReturnValue(null);
    mockUsePathname.mockReturnValue("/(onboarding)/summary");

    const { getByText } = render(
      <OnboardingFlowProvider
        initialDraft={{
          activityLevel: "moderate",
          age: 32,
          goalType: "general_health",
          height: 70,
          preferredUnitSystem: "imperial",
          primaryTrackingChallenge: "consistency",
          sex: "female",
          weight: 150,
        }}
      >
        <OnboardingLayout />
      </OnboardingFlowProvider>
    );

    expect(getByText("slot")).toBeTruthy();
  });
});
