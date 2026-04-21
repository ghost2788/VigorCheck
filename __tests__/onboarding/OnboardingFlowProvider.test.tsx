import React from "react";
import { Text } from "react-native";
import { act } from "@testing-library/react-native";
import { render } from "../../lib/test-utils";
import {
  OnboardingFlowProvider,
  useOnboardingFlow,
} from "../../lib/onboarding/OnboardingFlowProvider";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

function DraftProbe() {
  const {
    draft,
    setDraftValue,
    markPostOnboardingHomeCTA,
    showPostOnboardingHomeCTA,
    consumePostOnboardingHomeCTA,
  } = useOnboardingFlow();

  React.useEffect(() => {
    setDraftValue("goalType", "fat_loss");
    setDraftValue("activityLevel", "active");
    setDraftValue("primaryTrackingChallenge", "consistency");
    markPostOnboardingHomeCTA();
  }, [markPostOnboardingHomeCTA, setDraftValue]);

  return (
    <>
      <Text>{draft.goalType ?? "no-goal"}</Text>
      <Text>{draft.activityLevel ?? "no-activity"}</Text>
      <Text>{draft.primaryTrackingChallenge ?? "no-challenge"}</Text>
      <Text>{showPostOnboardingHomeCTA ? "cta-on" : "cta-off"}</Text>
      <Text onPress={consumePostOnboardingHomeCTA}>consume</Text>
    </>
  );
}

function StateProbe() {
  const { draft, showPostOnboardingHomeCTA } = useOnboardingFlow();

  return (
    <>
      <Text>{draft.goalType ?? "no-goal"}</Text>
      <Text>{draft.activityLevel ?? "no-activity"}</Text>
      <Text>{draft.primaryTrackingChallenge ?? "no-challenge"}</Text>
      <Text>{showPostOnboardingHomeCTA ? "cta-on" : "cta-off"}</Text>
    </>
  );
}

describe("OnboardingFlowProvider", () => {
  it("preserves draft answers and lets Home consume the one-shot CTA flag", () => {
    const { getByText } = render(
      <OnboardingFlowProvider initialDraft={{}}>
        <DraftProbe />
      </OnboardingFlowProvider>
    );

    expect(getByText("fat_loss")).toBeTruthy();
    expect(getByText("active")).toBeTruthy();
    expect(getByText("consistency")).toBeTruthy();
    expect(getByText("cta-on")).toBeTruthy();

    act(() => {
      getByText("consume").props.onPress();
    });

    expect(getByText("cta-off")).toBeTruthy();
  });

  it("resets to empty state on a fresh provider mount", () => {
    const firstRender = render(
      <OnboardingFlowProvider initialDraft={{}}>
        <DraftProbe />
      </OnboardingFlowProvider>
    );

    expect(firstRender.getByText("fat_loss")).toBeTruthy();
    firstRender.unmount();

    const secondRender = render(
      <OnboardingFlowProvider initialDraft={{}}>
        <StateProbe />
      </OnboardingFlowProvider>
    );

    expect(secondRender.getByText("no-goal")).toBeTruthy();
    expect(secondRender.getByText("no-activity")).toBeTruthy();
    expect(secondRender.getByText("no-challenge")).toBeTruthy();
    expect(secondRender.getByText("cta-off")).toBeTruthy();
  });
});
