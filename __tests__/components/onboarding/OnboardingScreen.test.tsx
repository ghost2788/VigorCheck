import React from "react";
import { render } from "../../../lib/test-utils";
import { OnboardingScreen } from "../../../components/onboarding/OnboardingScreen";
import { Text } from "react-native";
import { act } from "react-test-renderer";

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("frames progress as questions instead of setup", () => {
    const { getByText, queryByText } = render(
      <OnboardingScreen
        actionLabel="Continue"
        onActionPress={() => {}}
        progress={{ current: 2, total: 7 }}
        subtitle="subtitle"
        title="title"
      >
        <Text>body</Text>
      </OnboardingScreen>
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(getByText("Question 2 of 7")).toBeTruthy();
    expect(queryByText("Setup 2 of 7")).toBeNull();
  });
});
