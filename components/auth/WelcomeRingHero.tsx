import React from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { useReducedMotionPreference } from "../../lib/ui/useReducedMotionPreference";
import { ConcentricProgressRings } from "../ConcentricProgressRings";

type WelcomeRingHeroProps = {
  style?: ViewStyle;
  testID?: string;
  variant?: "hero" | "compact";
};

const HERO_SIZES = {
  compact: {
    main: 128,
    orbit: 68,
    shellHeight: 150,
  },
  hero: {
    main: 220,
    orbit: 92,
    shellHeight: 280,
  },
} as const;

export function WelcomeRingHero({
  style,
  testID,
  variant = "hero",
}: WelcomeRingHeroProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotionPreference();
  const motionValue = React.useRef(new Animated.Value(0)).current;
  const sizes = HERO_SIZES[variant];

  React.useEffect(() => {
    if (reduceMotion) {
      motionValue.stopAnimation();
      motionValue.setValue(0.5);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motionValue, {
          duration: 3200,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(motionValue, {
          duration: 3200,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [motionValue, reduceMotion]);

  const heroTranslateY = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [0, 0, 0] : [5, -6, 5],
  });
  const orbitTranslateX = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [0, 0, 0] : [-4, 4, -4],
  });
  const orbitTranslateY = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [0, 0, 0] : [-3, 5, -3],
  });

  return (
    <View style={[styles.shell, { height: sizes.shellHeight }, style]} testID={testID}>
      <Animated.View
        style={[
          styles.orbit,
          styles.orbitLeft,
          {
            opacity: 0.72,
            transform: [{ translateX: orbitTranslateX }, { translateY: orbitTranslateY }],
          },
        ]}
      >
        <ConcentricProgressRings
          rings={[
            {
              color: theme.metricProtein,
              diameter: sizes.orbit,
              progress: 100,
              strokeWidth: 12,
            },
            {
              color: theme.accent3,
              diameter: Math.max(36, sizes.orbit - 22),
              progress: 100,
              strokeWidth: 10,
            },
          ]}
          size={sizes.orbit}
        >
          <View />
        </ConcentricProgressRings>
      </Animated.View>

      <Animated.View
        style={[
          styles.orbit,
          styles.orbitRight,
          {
            opacity: 0.62,
            transform: [{ translateX: Animated.multiply(orbitTranslateX, -1) }, { translateY: heroTranslateY }],
          },
        ]}
      >
        <ConcentricProgressRings
          rings={[
            {
              color: theme.metricCalories,
              diameter: sizes.orbit,
              progress: 100,
              strokeWidth: 12,
            },
            {
              color: theme.accent2,
              diameter: Math.max(36, sizes.orbit - 20),
              progress: 100,
              strokeWidth: 10,
            },
          ]}
          size={sizes.orbit}
        >
          <View />
        </ConcentricProgressRings>
      </Animated.View>

      <Animated.View
        style={[
          styles.mainCluster,
          {
            transform: [{ translateY: heroTranslateY }],
          },
        ]}
      >
        <ConcentricProgressRings
          rings={[
            {
              color: theme.metricCalories,
              diameter: sizes.main,
              progress: 100,
              strokeWidth: variant === "hero" ? 16 : 14,
            },
            {
              color: theme.metricProtein,
              diameter: sizes.main - 34,
              progress: 100,
              strokeWidth: variant === "hero" ? 14 : 12,
            },
            {
              color: theme.accent2,
              diameter: sizes.main - 68,
              progress: 100,
              strokeWidth: variant === "hero" ? 14 : 12,
            },
            {
              color: theme.accent3,
              diameter: sizes.main - 102,
              progress: 100,
              strokeWidth: variant === "hero" ? 12 : 10,
            },
          ]}
          size={sizes.main}
        >
          <View
            style={[
              styles.centerCore,
              {
                backgroundColor: theme.surfaceStrong,
                borderColor: theme.cardBorder,
                height: variant === "hero" ? 28 : 20,
                width: variant === "hero" ? 28 : 20,
              },
            ]}
          />
        </ConcentricProgressRings>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerCore: {
    borderRadius: 999,
    borderWidth: 1,
  },
  mainCluster: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbit: {
    position: "absolute",
  },
  orbitLeft: {
    left: "10%",
    top: "16%",
  },
  orbitRight: {
    right: "10%",
    top: "12%",
  },
  shell: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
});
