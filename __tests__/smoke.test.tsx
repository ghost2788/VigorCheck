import React from "react";
import { Text } from "react-native";
import { render } from "../lib/test-utils";

describe("smoke test", () => {
  it("renders text", () => {
    const { getByText } = render(<Text>hello</Text>);
    expect(getByText("hello")).toBeTruthy();
  });
});
