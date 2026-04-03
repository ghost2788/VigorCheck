import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import AuthWelcomeScreen from "../../app/(auth)/welcome";

const mockPush = jest.fn();
const DEFAULT_HEART_SOURCE = require("../../assets/branding/vigorcheck-heart-core.png");
const FLAGSHIP_HEART_SOURCE = require("../../assets/branding/vigorcheck-heart-flagship.png");

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

describe("AuthWelcomeScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders the visual-first opener without the old value-prop cards", () => {
    const { getByTestId, getByText, queryByTestId, queryByText } = render(<AuthWelcomeScreen />);

    expect(getByTestId("welcome-brand")).toBeTruthy();
    expect(getByTestId("welcome-hud-hero")).toBeTruthy();
    expect(getByTestId("welcome-heart-image")).toBeTruthy();
    expect(getByTestId("welcome-heart-image").props.source).toBe(FLAGSHIP_HEART_SOURCE);
    expect(getByTestId("welcome-heart-image").props.source).not.toBe(DEFAULT_HEART_SOURCE);
    expect(getByTestId("welcome-copy")).toBeTruthy();
    expect(queryByTestId("welcome-heart-svg")).toBeNull();
    expect(getByText("VigorCheck")).toBeTruthy();
    expect(getByText("A better way to track nutrition")).toBeTruthy();
    expect(getByText("Build your plan in minutes.")).toBeTruthy();
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
});
