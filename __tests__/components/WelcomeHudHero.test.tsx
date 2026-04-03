import React from "react";
import { render } from "../../lib/test-utils";
import { WelcomeHudHero } from "../../components/auth/WelcomeHudHero";

const DEFAULT_HEART_SOURCE = require("../../assets/branding/vigorcheck-heart-core.png");
const FLAGSHIP_HEART_SOURCE = require("../../assets/branding/vigorcheck-heart-flagship.png");

describe("WelcomeHudHero", () => {
  it("renders the shared PNG-backed hero image", () => {
    const { getByTestId, queryByTestId } = render(<WelcomeHudHero testID="welcome-hud-hero" />);

    expect(getByTestId("welcome-hud-hero")).toBeTruthy();
    expect(getByTestId("welcome-heart-image")).toBeTruthy();
    expect(getByTestId("welcome-heart-image").props.source).toBe(DEFAULT_HEART_SOURCE);
    expect(queryByTestId("welcome-heart-svg")).toBeNull();
    expect(queryByTestId("welcome-hud-svg")).toBeNull();
    expect(queryByTestId("welcome-hud-frame-core")).toBeNull();
    expect(getByTestId("welcome-hud-top-rail")).toBeTruthy();
    expect(getByTestId("welcome-hud-bottom-rail")).toBeTruthy();
    expect(getByTestId("welcome-hud-left-bracket")).toBeTruthy();
    expect(getByTestId("welcome-hud-right-bracket")).toBeTruthy();
  });

  it("uses an override heart image when one is provided", () => {
    const { getByTestId } = render(
      <WelcomeHudHero heartImageSource={FLAGSHIP_HEART_SOURCE} testID="welcome-hud-hero" />
    );

    expect(getByTestId("welcome-heart-image").props.source).toBe(FLAGSHIP_HEART_SOURCE);
  });
});
