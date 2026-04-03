import React from "react";
import { render } from "../../lib/test-utils";
import { act } from "react-test-renderer";
import ChallengeScreen from "../../app/(onboarding)/challenge";
import { OnboardingFlowProvider } from "../../lib/onboarding/OnboardingFlowProvider";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ChallengeScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders a label-only challenge selector without the old subtitle and descriptions", () => {
    const { getByText, queryByText } = render(
      <OnboardingFlowProvider initialDraft={{ goalType: "fat_loss" }}>
        <ChallengeScreen />
      </OnboardingFlowProvider>
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(getByText("What has been the hardest part of tracking?")).toBeTruthy();
    expect(getByText("Consistency")).toBeTruthy();
    expect(getByText("Knowing what to eat")).toBeTruthy();
    expect(getByText("Portion sizes")).toBeTruthy();
    expect(getByText("Motivation")).toBeTruthy();
    expect(
      queryByText("Pick the one that feels most true right now. We’ll reflect it back in your starting plan.")
    ).toBeNull();
    expect(queryByText("You want logging to be easier to keep up with every day.")).toBeNull();
    expect(queryByText("You want clearer direction on what actually supports your goal.")).toBeNull();
  });
});
