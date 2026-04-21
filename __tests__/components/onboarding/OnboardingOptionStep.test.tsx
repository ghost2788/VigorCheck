import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../../lib/test-utils";
import { OnboardingOptionStep } from "../../../components/onboarding/OnboardingOptionStep";

describe("OnboardingOptionStep", () => {
  it("uses roomier vertical padding on shared option cards", () => {
    const { getByTestId } = render(
      <OnboardingOptionStep
        onSelect={() => {}}
        options={[
          { label: "First", value: "first" },
          { label: "Second", value: "second" },
        ]}
        selectedValue="first"
      />
    );

    expect(StyleSheet.flatten(getByTestId("onboarding-option-first").props.style).paddingVertical).toBe(22);
  });
});
