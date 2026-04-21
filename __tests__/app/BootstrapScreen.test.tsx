import React from "react";
import { render, waitFor } from "../../lib/test-utils";
import BootstrapScreen from "../../app/index";

const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseConvexAuth = jest.fn();
const mockUseOnboardingFlow = jest.fn();
const mockReplace = jest.fn();
const mockUseSubscription = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/onboarding/OnboardingFlowProvider", () => ({
  useOnboardingFlow: () => mockUseOnboardingFlow(),
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("BootstrapScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseConvexAuth.mockReset();
    mockUseMutation.mockReset();
    mockUseOnboardingFlow.mockReset();
    mockUseQuery.mockReset();
    mockUseSubscription.mockReset();
    mockUseOnboardingFlow.mockReturnValue({
      draft: {},
      isHydrated: true,
      markPostOnboardingHomeCTA: jest.fn(),
      resetDraft: jest.fn(),
    });
    mockUseSubscription.mockReturnValue({
      accessState: null,
    });
    mockUseMutation.mockReturnValue(jest.fn());
  });

  it("routes signed-out users to the public auth welcome", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(null);

    const { getByText } = render(<BootstrapScreen />);

    expect(getByText("redirect:/(auth)/welcome")).toBeTruthy();
  });

  it("routes signed-in users without a profile into onboarding", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(null);

    const { getByText } = render(<BootstrapScreen />);

    expect(getByText("redirect:/(onboarding)/goal")).toBeTruthy();
  });

  it("auto-completes onboarding and lands signed-in users on tabs when a finished draft exists", async () => {
    const completeOnboarding = jest.fn().mockResolvedValue("user-1");
    const resetDraft = jest.fn();
    const markPostOnboardingHomeCTA = jest.fn();
    const draft = {
      activityLevel: "moderate" as const,
      age: 34,
      goalPace: "moderate" as const,
      goalType: "fat_loss" as const,
      height: 70,
      preferredUnitSystem: "imperial" as const,
      primaryTrackingChallenge: "consistency" as const,
      sex: "male" as const,
      weight: 180,
    };
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseMutation.mockReturnValue(completeOnboarding);
    mockUseOnboardingFlow.mockReturnValue({
      draft,
      isHydrated: true,
      markPostOnboardingHomeCTA,
      resetDraft,
    });
    mockUseQuery.mockReturnValue(null);

    const { getByText } = render(<BootstrapScreen />);

    expect(getByText("Saving your plan...")).toBeTruthy();

    await waitFor(() => {
      expect(markPostOnboardingHomeCTA).toHaveBeenCalled();
      expect(resetDraft).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("waits for the authenticated user query before routing an existing account into onboarding", async () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    let currentUser: { _id: string } | undefined = undefined;
    mockUseQuery.mockImplementation(() => currentUser);

    const view = render(<BootstrapScreen />);

    expect(view.getByText("Loading your plan...")).toBeTruthy();

    currentUser = { _id: "user-1" };

    view.rerender(<BootstrapScreen />);

    await waitFor(() => {
      expect(view.getByText("redirect:/(tabs)")).toBeTruthy();
    });
  });

  it("routes signed-in users with a profile to tabs", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue({ _id: "user-1" });

    const { getByText } = render(<BootstrapScreen />);

    expect(getByText("redirect:/(tabs)")).toBeTruthy();
  });

  it("routes expired signed-in users with a profile to the paywall", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseSubscription.mockReturnValue({
      accessState: {
        shouldShowPaywall: true,
      },
    });
    mockUseQuery.mockReturnValue({ _id: "user-1" });

    const { getByText } = render(<BootstrapScreen />);

    expect(getByText("redirect:/paywall")).toBeTruthy();
  });
});
