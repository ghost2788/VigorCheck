import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { buildAppIconRingLayouts } from "../../lib/branding/appIconSpec";

type WelcomeRingHeroProps = {
  style?: ViewStyle;
  testID?: string;
  variant?: "hero" | "compact";
};

const HERO_SIZES = {
  compact: 184,
  hero: 272,
} as const;

export function WelcomeRingHero({
  style,
  testID,
  variant = "hero",
}: WelcomeRingHeroProps) {
  const sizes = HERO_SIZES[variant];
  const ringLayouts = React.useMemo(() => buildAppIconRingLayouts(sizes), [sizes]);

  return (
    <View style={[styles.shell, style]} testID={testID}>
      <View style={[styles.stage, { height: sizes, width: sizes }]} testID="welcome-ring-stage">
        {ringLayouts.map((ring) => (
          <View key={ring.id} style={StyleSheet.absoluteFill} testID={`welcome-ring-layer-${ring.id}`}>
            {ring.dots.map((dot) => (
              <React.Fragment key={`${ring.id}-${dot.index}`}>
                <View
                  style={[
                    styles.glow,
                    {
                      backgroundColor: `${ring.color}26`,
                      borderRadius: dot.glowSize / 2,
                      height: dot.glowSize,
                      left: dot.centerX - dot.glowSize / 2,
                      top: dot.centerY - dot.glowSize / 2,
                      width: dot.glowSize,
                    },
                  ]}
                  testID={`welcome-ring-glow-${ring.id}-${dot.index}`}
                />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: ring.color,
                      borderRadius: dot.size / 2,
                      height: dot.size,
                      left: dot.centerX - dot.size / 2,
                      top: dot.centerY - dot.size / 2,
                      width: dot.size,
                    },
                  ]}
                  testID={`welcome-ring-dot-${ring.id}-${dot.index}`}
                />
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
  },
  glow: {
    position: "absolute",
  },
  shell: {
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    position: "relative",
  },
});
