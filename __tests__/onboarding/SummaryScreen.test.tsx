import React from "react";
import { StyleSheet, Text } from "react-native";
import { act } from "react-test-renderer";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import SummaryScreen from "../../app/(onboarding)/summary";
import {
  OnboardingFlowProvider,
  useOnboardingFlow,
} from "../../lib/onboarding/OnboardingFlowProvider";
import { computeBaseTargets } from "../../lib/domain/targets";

const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseConvexAuth = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

function FlagAndDraftProbe() {
  const { showPostOnboardingHomeCTA, draft } = useOnboardingFlow();

  return (
    <>
      <Text>{showPostOnboardingHomeCTA ? "cta-on" : "cta-off"}</Text>
      <Text>{draft.goalType ?? "no-goal"}</Text>
    </>
  );
}

describe("SummaryScreen", () => {
  const draft = {
    activityLevel: "moderate" as const,
    age: 34,
    goalPace: "moderate" as const,
    goalType: "fat_loss" as const,
    height: 70,
    preferredUnitSystem: "imperial" as const,
    primaryTrackingChallenge: "portion_sizes" as const,
    sex: "male" as const,
    weight: 180,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseConvexAuth.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseQuery.mockReturnValue(null);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("shows personalized summary content and routes signed-out users into account creation", async () => {
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    const computed = computeBaseTargets(draft);

    const { getByTestId, getByText, queryByText } = render(
      <OnboardingFlowProvider initialDraft={{ ...draft, displayName: "Tom" }}>
        <SummaryScreen />
        <FlagAndDraftProbe />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(getByText("Tom, your plan is ready")).toBeTruthy();
    expect(getByTestId("summary-sticky-footer")).toBeTruthy();
    expect(getByTestId("summary-primary-cta")).toBeTruthy();
    expect(getByTestId("summary-target-row-calories")).toBeTruthy();
    expect(getByTestId("summary-target-rail-calories")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("summary-target-rail-calories").props.style).width).toBe("100%");
    expect(StyleSheet.flatten(getByTestId("summary-target-rail-fat").props.style).width).toBe("66%");
    expect(StyleSheet.flatten(getByTestId("summary-target-rail-hydration").props.style).width).toBe("58%");
    expect(getByTestId("summary-target-row-hydration")).toBeTruthy();
    expect(getByText(String(computed.calories))).toBeTruthy();
    expect(getByText(`${computed.protein} g`)).toBeTruthy();
    expect(getByText(`${computed.hydration} cups`)).toBeTruthy();
    expect(queryByText("How CalTracker will help")).toBeNull();
    expect(queryByText("I already have an account")).toBeNull();
    expect(getByText("Already have an account?")).toBeTruthy();
    expect(getByText("Sign in")).toBeTruthy();
    expect(getByText("Create account to save plan")).toBeTruthy();

    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenNthCalledWith(1, "/(auth)/sign-in");
    });

    fireEvent.press(getByTestId("summary-primary-cta"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenNthCalledWith(2, "/(auth)/create-account");
    });
  });

  it("uses a goal-aware fallback heading and removes the old help section when no name is available", () => {
    mockUseMutation.mockReturnValue(jest.fn());
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { getByText, queryByText } = render(
      <OnboardingFlowProvider initialDraft={draft}>
        <SummaryScreen />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(getByText("Your fat loss plan is ready")).toBeTruthy();
    expect(queryByText("Your plan is ready")).toBeNull();
    expect(queryByText("How CalTracker will help")).toBeNull();
    expect(queryByText("Barcode scan for packaged foods")).toBeNull();
    expect(getByText("First focus")).toBeTruthy();
    expect(getByText("This is a starting plan")).toBeTruthy();
  });

  it("submits onboarding completion once the user is authenticated", async () => {
    const completeOnboarding = jest.fn().mockResolvedValue("user-1");
    mockUseMutation.mockReturnValue(completeOnboarding);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    const computed = computeBaseTargets(draft);

    const { getByText } = render(
      <OnboardingFlowProvider initialDraft={draft}>
        <SummaryScreen />
        <FlagAndDraftProbe />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    fireEvent.press(getByText("Start tracking"));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledWith({
        ...draft,
        displayName: undefined,
        targets: {
          calories: computed.calories,
          carbs: computed.carbs,
          fat: computed.fat,
          protein: computed.protein,
        },
        timeZone: expect.any(String),
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("finishes onboarding when the user record appears even if the mutation promise stays pending", async () => {
    const completeOnboarding = jest.fn(() => new Promise(() => {}));
    mockUseMutation.mockReturnValue(completeOnboarding);
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    let currentUser: { _id: string } | null = null;
    mockUseQuery.mockImplementation(() => currentUser);

    const view = render(
      <OnboardingFlowProvider initialDraft={draft}>
        <SummaryScreen />
        <FlagAndDraftProbe />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    fireEvent.press(view.getByText("Start tracking"));

    currentUser = { _id: "user-1" };

    view.rerender(
      <OnboardingFlowProvider initialDraft={draft}>
        <SummaryScreen />
        <FlagAndDraftProbe />
      </OnboardingFlowProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
