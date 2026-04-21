import React from "react";
import { act } from "react-test-renderer";
import { render, waitFor } from "../../lib/test-utils";
import BuildPlanScreen from "../../app/(onboarding)/build-plan";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("../../lib/ui/useReducedMotionPreference", () => ({
  useReducedMotionPreference: () => true,
}));

describe("BuildPlanScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockReset();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("uses the rebranded ring hero and keeps the slower build sequence onscreen for at least 5 seconds", async () => {
    const { getByTestId, getByText, queryByText } = render(
      <OnboardingFlowProvider
        initialDraft={{
          activityLevel: "moderate",
          age: 34,
          goalPace: "moderate",
          goalType: "fat_loss",
          height: 70,
          preferredUnitSystem: "imperial",
          primaryTrackingChallenge: "portion_sizes",
          sex: "male",
          weight: 180,
        }}
      >
        <BuildPlanScreen />
      </OnboardingFlowProvider>
    );

    expect(getByTestId("welcome-hud-hero")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-calories")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-carbs")).toBeTruthy();
    expect(getByText("Setting up your personalized plan...")).toBeTruthy();
    expect(queryByText("Building...")).toBeNull();
    expect(getByText("Calculating your targets...")).toBeTruthy();
    expect(queryByText("Building your nutrition plan...")).toBeNull();
    expect(queryByText("Personalizing your focus areas...")).toBeNull();
    expect(queryByText("Preparing your dashboard...")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(queryByText("Building your nutrition plan...")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getByText("Building your nutrition plan...")).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(1199);
    });

    expect(queryByText("Personalizing your focus areas...")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(getByText("Personalizing your focus areas...")).toBeTruthy();
    });
    expect(queryByText("Preparing your dashboard...")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1199);
    });

    expect(queryByText("Preparing your dashboard...")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(getByText("Preparing your dashboard...")).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(1399);
    });

    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockReplace).toHaveBeenCalledWith("/(onboarding)/summary");
  });
});
