import React from "react";
import { render } from "../../lib/test-utils";
import { ThemedText } from "../../components/ThemedText";

describe("ThemedText", () => {
  it("renders text content", () => {
    const { getByText } = render(<ThemedText>Hello world</ThemedText>);
    expect(getByText("Hello world")).toBeTruthy();
  });

  it("supports variant changes", () => {
    const { getByText } = render(
      <ThemedText variant="secondary">Secondary</ThemedText>
    );

    expect(getByText("Secondary")).toBeTruthy();
  });

  it("supports size changes", () => {
    const { getByText } = render(<ThemedText size="lg">Large</ThemedText>);
    expect(getByText("Large")).toBeTruthy();
  });
});
