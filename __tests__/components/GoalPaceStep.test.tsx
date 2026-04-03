import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { GoalPaceStep } from "../../components/onboarding/GoalPaceStep";

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("GoalPaceStep", () => {
  it("renders the three-card selector with moderate selected by default", () => {
    const { getByLabelText, getByTestId, getByText } = render(
      <GoalPaceStep onSelect={() => {}} selectedValue="moderate" />
    );

    expect(getByText("Slow")).toBeTruthy();
    expect(getByText("Moderate")).toBeTruthy();
    expect(getByText("Aggressive")).toBeTruthy();
    expect(getByText("Recommended")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("goal-pace-stack").props.style).flexDirection).toBe("column");
    expect(getByLabelText("Moderate pace").props.accessibilityState).toEqual({ selected: true });
  });

  it("calls onSelect when a different pace card is pressed", () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(<GoalPaceStep onSelect={onSelect} selectedValue="moderate" />);

    fireEvent.press(getByLabelText("Aggressive pace"));

    expect(onSelect).toHaveBeenCalledWith("aggressive");
  });
});
