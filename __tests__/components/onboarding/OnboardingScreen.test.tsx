import React from "react";
import { fireEvent, render, within } from "../../../lib/test-utils";
import { OnboardingScreen } from "../../../components/onboarding/OnboardingScreen";
import { StyleSheet, Text } from "react-native";
import { act } from "react-test-renderer";
import { colors } from "../../../lib/theme/colors";

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

  it("renders the shared light back button pattern when a back handler is provided", () => {
    const onBackPress = jest.fn();
    const { getByTestId } = render(
      <OnboardingScreen
        actionLabel="Continue"
        onActionPress={() => {}}
        onBackPress={onBackPress}
        subtitle="subtitle"
        title="title"
      >
        <Text>body</Text>
      </OnboardingScreen>
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    const backButton = getByTestId("onboarding-back-button");
    const backLabel = within(backButton).getByText("Back");

    expect(within(backButton).getByText("chevron-back")).toBeTruthy();
    expect(StyleSheet.flatten(backButton.props.style).alignSelf).toBe("flex-start");
    expect(StyleSheet.flatten(backLabel.props.style).color).toBe(colors.dark.accent1);

    fireEvent.press(backButton);

    expect(onBackPress).toHaveBeenCalledTimes(1);
  });
});
