import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { WelcomeRingHero } from "../../components/auth/WelcomeRingHero";

describe("WelcomeRingHero", () => {
  it("renders the four-ring brand mark without the old orbit satellites or center core", () => {
    const { getByTestId, queryByTestId } = render(<WelcomeRingHero testID="welcome-ring-hero" />);

    expect(getByTestId("welcome-ring-hero")).toBeTruthy();
    expect(getByTestId("welcome-ring-stage")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-calories")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-protein")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-carbs")).toBeTruthy();
    expect(getByTestId("welcome-ring-layer-fat")).toBeTruthy();
    expect(getByTestId("welcome-ring-dot-calories-0")).toBeTruthy();
    expect(getByTestId("welcome-ring-glow-fat-47")).toBeTruthy();
    expect(queryByTestId("welcome-ring-orbit-left")).toBeNull();
    expect(queryByTestId("welcome-ring-center-core")).toBeNull();
  });

  it("uses the approved hero and compact mark sizes", () => {
    const hero = render(<WelcomeRingHero testID="hero-ring" />);
    const compact = render(<WelcomeRingHero testID="compact-ring" variant="compact" />);
    const brand = render(<WelcomeRingHero testID="brand-ring" variant="brand" />);

    const heroStageStyle = StyleSheet.flatten(hero.getByTestId("welcome-ring-stage").props.style);
    const compactStageStyle = StyleSheet.flatten(compact.getByTestId("welcome-ring-stage").props.style);
    const brandStageStyle = StyleSheet.flatten(brand.getByTestId("welcome-ring-stage").props.style);

    expect(heroStageStyle.height).toBe(272);
    expect(heroStageStyle.width).toBe(272);
    expect(compactStageStyle.height).toBe(184);
    expect(compactStageStyle.width).toBe(184);
    expect(brandStageStyle.height).toBe(96);
    expect(brandStageStyle.width).toBe(96);
  });
});
