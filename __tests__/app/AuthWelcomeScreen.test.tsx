import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import AuthWelcomeScreen from "../../app/(auth)/welcome";
import * as legalLinks from "../../lib/config/legalLinks";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    top: 0,
  }),
}));

jest.mock("../../lib/ui/useReducedMotionPreference", () => ({
  useReducedMotionPreference: () => true,
}));

describe("AuthWelcomeScreen", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  beforeEach(() => {
    mockPush.mockReset();
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("renders the visual-first opener without the old value-prop cards", () => {
    const { getByTestId, getByText, queryByTestId, queryByText } = render(<AuthWelcomeScreen />);

    expect(getByTestId("welcome-brand")).toBeTruthy();
    expect(getByTestId("welcome-hud-hero")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-calories")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-fat")).toBeTruthy();
    expect(getByTestId("welcome-copy")).toBeTruthy();
    expect(queryByTestId("welcome-heart-image")).toBeNull();
    expect(queryByTestId("welcome-logo-static")).toBeNull();
    expect(queryByTestId("welcome-logo-aperture")).toBeNull();
    expect(getByText("VigorCheck")).toBeTruthy();
    expect(getByText("Hit your macros without the logging grind.")).toBeTruthy();
    expect(
      getByText("Build your plan in minutes. Track calories, protein, carbs, and fat faster with AI.")
    ).toBeTruthy();
    expect(queryByText("CalTracker")).toBeNull();
    expect(queryByText("Personalized daily targets")).toBeNull();
    expect(queryByText("Fastest path to consistent logging")).toBeNull();
    expect(queryByText("A calmer way to track nutrition")).toBeNull();
    expect(queryByText("Build your plan in minutes, then keep it easy.")).toBeNull();
  });

  it("routes into onboarding and sign in from the opener", () => {
    const { getByText } = render(<AuthWelcomeScreen />);

    fireEvent.press(getByText("Get started"));
    expect(mockPush).toHaveBeenCalledWith("/(onboarding)/goal");

    fireEvent.press(getByText("Sign in"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("renders and opens privacy, terms, and support links from the reviewer entry screen", () => {
    const { getByText } = render(<AuthWelcomeScreen />);

    fireEvent.press(getByText("Privacy"));
    fireEvent.press(getByText("Terms"));
    fireEvent.press(getByText("Support"));

    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(1, "privacy");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(2, "terms");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(3, "support");
  });

  it("adds more spacing between the headline and subhead for wrapped copy", () => {
    const { getByTestId } = render(<AuthWelcomeScreen />);

    const copyStyle = StyleSheet.flatten(getByTestId("welcome-copy").props.style);

    expect(copyStyle.gap).toBe(14);
  });

  it("uses a taller headline line-height so descenders are not clipped on wrapped lines", () => {
    const { getByText } = render(<AuthWelcomeScreen />);

    const titleStyle = StyleSheet.flatten(
      getByText("Hit your macros without the logging grind.").props.style
    );

    expect(titleStyle.lineHeight).toBe(52);
  });
});
