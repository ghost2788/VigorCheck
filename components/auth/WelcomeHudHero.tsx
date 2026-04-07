import React from "react";
import { Animated, Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from "react-native";
import { useReducedMotionPreference } from "../../lib/ui/useReducedMotionPreference";

export type WelcomeHudHeartVariant = "faceted" | "soft" | "crest" | "crystal";
export type WelcomeHudFrameVariant = "brackets" | "split" | "target";
type WelcomeHudTone = "theme" | "vigorRed";

type WelcomeHudHeroProps = {
  frameVariant?: WelcomeHudFrameVariant;
  heartImageSource?: ImageSourcePropType;
  heartVariant?: WelcomeHudHeartVariant;
  showAccentDots?: boolean;
  style?: ViewStyle;
  testID?: string;
  tone?: WelcomeHudTone;
  variant?: "hero" | "compact";
};

const AnimatedImage = Animated.createAnimatedComponent(Image);
const HEART_IMAGE: ImageSourcePropType = require("../../assets/branding/vigorcheck-heart-flagship.png");

const HERO_SIZES = {
  compact: {
    glowHeight: 96,
    glowWidth: 122,
    heart: 138,
    stage: 196,
  },
  hero: {
    glowHeight: 138,
    glowWidth: 174,
    heart: 198,
    stage: 286,
  },
} as const;

export function WelcomeHudHero({
  frameVariant: _frameVariant = "brackets",
  heartImageSource,
  heartVariant: _heartVariant = "faceted",
  showAccentDots: _showAccentDots = true,
  style,
  testID,
  tone: _tone = "theme",
  variant = "hero",
}: WelcomeHudHeroProps) {
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
          duration: 1800,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(motionValue, {
          duration: 1800,
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

  const heartScale = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [1, 1, 1] : [1, 1.02, 1],
  });
  const glowScale = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [1, 1, 1] : [0.96, 1.04, 0.96],
  });
  const glowOpacity = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [0.2, 0.2, 0.2] : [0.14, 0.26, 0.14],
  });
  const haloOpacity = motionValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: reduceMotion ? [0.18, 0.18, 0.18] : [0.1, 0.18, 0.1],
  });
  const frameBox = Math.round(sizes.heart * 1.06);
  const frameInset = Math.round((sizes.stage - frameBox) / 2);
  const bracketLength = variant === "hero" ? 30 : 22;
  const bracketStroke = variant === "hero" ? 4 : 3;
  const railWidth = Math.round(frameBox * 0.36);
  const railInset = frameInset - (variant === "hero" ? 14 : 10);

  return (
    <View style={[styles.shell, style]} testID={testID}>
      <View
        style={[
          styles.stage,
          {
            height: sizes.stage,
            width: sizes.stage,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowHalo,
            {
              height: sizes.glowHeight * 1.55,
              opacity: haloOpacity,
              transform: [{ scale: glowScale }],
              width: sizes.glowWidth * 1.55,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowCore,
            {
              height: sizes.glowHeight,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
              width: sizes.glowWidth,
            },
          ]}
        />
        <View pointerEvents="none" style={styles.frameLayer}>
          <View
            style={[
              styles.topRail,
              {
                top: railInset,
                width: railWidth,
              },
            ]}
            testID="welcome-hud-top-rail"
          />
          <View
            style={[
              styles.bottomRail,
              {
                bottom: railInset,
                width: railWidth,
              },
            ]}
            testID="welcome-hud-bottom-rail"
          />
          <View
            style={[
              styles.leftBracket,
              {
                height: frameBox,
                left: frameInset,
                top: frameInset,
                width: bracketLength,
              },
            ]}
            testID="welcome-hud-left-bracket"
          >
            <View style={styles.leftBracketUpper}>
              <View style={[styles.leftBracketTop, { height: bracketStroke, width: bracketLength }]} />
              <View style={[styles.leftBracketSpine, { height: bracketLength, width: bracketStroke }]} />
            </View>
            <View style={styles.leftBracketLower}>
              <View style={[styles.leftBracketSpine, { height: bracketLength, width: bracketStroke }]} />
              <View style={[styles.leftBracketBottom, { height: bracketStroke, width: bracketLength }]} />
            </View>
          </View>
          <View
            style={[
              styles.rightBracket,
              {
                height: frameBox,
                right: frameInset,
                top: frameInset,
                width: bracketLength,
              },
            ]}
            testID="welcome-hud-right-bracket"
          >
            <View style={styles.rightBracketUpper}>
              <View style={[styles.rightBracketTop, { height: bracketStroke, width: bracketLength }]} />
              <View style={[styles.rightBracketSpine, { height: bracketLength, width: bracketStroke }]} />
            </View>
            <View style={styles.rightBracketLower}>
              <View style={[styles.rightBracketSpine, { height: bracketLength, width: bracketStroke }]} />
              <View style={[styles.rightBracketBottom, { height: bracketStroke, width: bracketLength }]} />
            </View>
          </View>
        </View>

        <AnimatedImage
          resizeMode="contain"
          source={heartImageSource ?? HEART_IMAGE}
          style={[
            styles.heartImage,
            {
              height: sizes.heart,
              transform: [{ scale: heartScale }],
              width: sizes.heart,
            },
          ]}
          testID="welcome-heart-image"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomRail: {
    alignSelf: "center",
    backgroundColor: "rgba(240, 161, 77, 0.14)",
    borderRadius: 999,
    height: 2,
    position: "absolute",
  },
  frameLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glowCore: {
    backgroundColor: "rgba(244, 153, 61, 0.36)",
    borderRadius: 999,
    position: "absolute",
  },
  glowHalo: {
    backgroundColor: "rgba(244, 153, 61, 0.18)",
    borderRadius: 999,
    position: "absolute",
  },
  heartImage: {
    zIndex: 2,
  },
  leftBracket: {
    justifyContent: "space-between",
    position: "absolute",
  },
  leftBracketLower: {
    alignItems: "flex-start",
    gap: 0,
  },
  leftBracketUpper: {
    alignItems: "flex-start",
    gap: 0,
  },
  leftBracketBottom: {
    backgroundColor: "#F0A14D",
    borderRadius: 999,
    height: 4,
    width: 24,
  },
  leftBracketSpine: {
    alignSelf: "flex-start",
    backgroundColor: "#F0A14D",
    borderRadius: 999,
  },
  leftBracketTop: {
    backgroundColor: "#F0A14D",
    borderRadius: 999,
  },
  rightBracket: {
    justifyContent: "space-between",
    position: "absolute",
  },
  rightBracketLower: {
    alignItems: "flex-end",
    gap: 0,
  },
  rightBracketUpper: {
    alignItems: "flex-end",
    gap: 0,
  },
  rightBracketBottom: {
    alignSelf: "flex-end",
    backgroundColor: "#F0A14D",
    borderRadius: 999,
    height: 4,
    width: 24,
  },
  rightBracketSpine: {
    alignSelf: "flex-end",
    backgroundColor: "#F0A14D",
    borderRadius: 999,
  },
  rightBracketTop: {
    alignSelf: "flex-end",
    backgroundColor: "#F0A14D",
    borderRadius: 999,
  },
  shell: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  topRail: {
    alignSelf: "center",
    backgroundColor: "rgba(240, 161, 77, 0.18)",
    borderRadius: 999,
    height: 2,
    position: "absolute",
  },
});
