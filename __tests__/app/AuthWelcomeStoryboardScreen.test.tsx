import React from "react";
import { render } from "../../lib/test-utils";
import WelcomeStoryboardScreen from "../../app/(auth)/welcome-storyboard";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    top: 0,
  }),
}));

describe("WelcomeStoryboardScreen", () => {
  it("renders six welcome hero directions for browser review", () => {
    const { getByText, getByTestId } = render(<WelcomeStoryboardScreen />);

    expect(getByText("Pick the VigorCheck heart direction")).toBeTruthy();
    expect(getByText("Soft + brackets")).toBeTruthy();
    expect(getByText("Soft + target ring")).toBeTruthy();
    expect(getByText("Crystal + split frame")).toBeTruthy();
    expect(getByTestId("storyboard-card-soft-brackets")).toBeTruthy();
    expect(getByTestId("storyboard-card-crest-target")).toBeTruthy();
    expect(getByTestId("storyboard-hero-soft-brackets")).toBeTruthy();
    expect(getByTestId("storyboard-hero-crest-target")).toBeTruthy();
  });
});
