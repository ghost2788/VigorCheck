import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { WelcomeHudHero } from "../../components/auth/WelcomeHudHero";

describe("WelcomeHudHero", () => {
  it("renders the shared ring mark instead of the old aperture logo layers", () => {
    const { getByTestId, queryByTestId } = render(<WelcomeHudHero testID="welcome-hud-hero" />);

    expect(getByTestId("welcome-hud-hero")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-calories")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-protein")).toBeTruthy();
    expect(queryByTestId("welcome-logo-static")).toBeNull();
    expect(queryByTestId("welcome-logo-aperture")).toBeNull();
    expect(queryByTestId("welcome-heart-image")).toBeNull();
  });

  it("uses the compact sizing contract when requested", () => {
    const { getByTestId } = render(<WelcomeHudHero testID="welcome-hud-hero" variant="compact" />);

    const stageStyle = StyleSheet.flatten(getByTestId("welcome-ring-stage").props.style);
    expect(stageStyle.height).toBe(184);
    expect(stageStyle.width).toBe(184);
  });

  it("uses the shared brand mark sizing contract when requested", () => {
    const { getByTestId } = render(<WelcomeHudHero testID="welcome-hud-hero" variant="brand" />);

    const stageStyle = StyleSheet.flatten(getByTestId("welcome-ring-stage").props.style);
    expect(stageStyle.height).toBe(96);
    expect(stageStyle.width).toBe(96);
  });
});
