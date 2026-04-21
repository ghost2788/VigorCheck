import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { Button } from "../../components/Button";

describe("Button", () => {
  it("renders the label", () => {
    const { getByText } = render(<Button label="Scan Meal" onPress={() => {}} />);
    expect(getByText("Scan Meal")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);

    fireEvent.press(getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("centers wrapped label text", () => {
    const { getByText } = render(<Button label="Create custom supplement" onPress={() => {}} />);

    expect(StyleSheet.flatten(getByText("Create custom supplement").props.style).textAlign).toBe("center");
  });
});
