import React from "react";
import { ViewStyle } from "react-native";
import { WelcomeRingHero } from "./WelcomeRingHero";

type WelcomeHudHeroProps = {
  style?: ViewStyle;
  testID?: string;
  variant?: "hero" | "compact";
};

export function WelcomeHudHero({
  style,
  testID,
  variant = "hero",
}: WelcomeHudHeroProps) {
  return <WelcomeRingHero style={style} testID={testID} variant={variant} />;
}
