import React from "react";
import { useRouter } from "expo-router";
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeHudHero } from "../../components/auth/WelcomeHudHero";
import { Button } from "../../components/Button";
import { LegalLinksRow } from "../../components/LegalLinksRow";
import { ThemedText } from "../../components/ThemedText";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { useReducedMotionPreference } from "../../lib/ui/useReducedMotionPreference";

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotionPreference();
  const useCompactLayout = width <= 360;
  const heroOpacity = React.useRef(new Animated.Value(0)).current;
  const heroTranslateY = React.useRef(new Animated.Value(18)).current;
  const copyOpacity = React.useRef(new Animated.Value(0)).current;
  const copyTranslateY = React.useRef(new Animated.Value(18)).current;
  const actionsOpacity = React.useRef(new Animated.Value(0)).current;
  const actionsTranslateY = React.useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    if (reduceMotion) {
      heroOpacity.setValue(1);
      heroTranslateY.setValue(0);
      copyOpacity.setValue(1);
      copyTranslateY.setValue(0);
      actionsOpacity.setValue(1);
      actionsTranslateY.setValue(0);
      return;
    }

    const animations = Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          duration: 280,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          duration: 280,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(copyOpacity, {
          duration: 260,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(copyTranslateY, {
          duration: 260,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(actionsOpacity, {
          duration: 240,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(actionsTranslateY, {
          duration: 240,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animations.start();

    return () => {
      animations.stop();
    };
  }, [
    actionsOpacity,
    actionsTranslateY,
    copyOpacity,
    copyTranslateY,
    heroOpacity,
    heroTranslateY,
    reduceMotion,
  ]);

  return (
    <View
      testID="welcome-screen"
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingBottom: Math.max(insets.bottom + 24, 48),
          paddingTop: Math.max(insets.top, 18) + 18,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.topStack,
          {
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }],
          },
        ]}
      >
        <View style={styles.brandWrap}>
          <ThemedText style={styles.brand} testID="welcome-brand" variant="accent2">
            VigorCheck
          </ThemedText>
        </View>
        <View style={[styles.heroWrap, useCompactLayout ? styles.heroWrapCompact : null]}>
          <WelcomeHudHero testID="welcome-hud-hero" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.copyWrap,
          {
            opacity: copyOpacity,
            transform: [{ translateY: copyTranslateY }],
          },
        ]}
        testID="welcome-copy"
      >
        <ThemedText size="xl" style={[styles.title, useCompactLayout ? styles.titleCompact : null]}>
          Hit your macros without the logging grind.
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, useCompactLayout ? styles.subtitleCompact : null]}
          variant="secondary"
        >
          Build your plan in minutes. Track calories, protein, carbs, and fat faster with AI.
        </ThemedText>
      </Animated.View>

      <Animated.View
        testID="welcome-actions"
        style={[
          styles.actionWrap,
          useCompactLayout ? styles.actionWrapCompact : null,
          {
            opacity: actionsOpacity,
            transform: [{ translateY: actionsTranslateY }],
          },
        ]}
      >
        <Button label="Get started" onPress={() => router.push("/(onboarding)/goal")} style={styles.button} />
        <View style={styles.footer}>
          <ThemedText variant="secondary">Already have an account?</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/sign-in")}>
            <ThemedText style={{ color: theme.accent1 }}>Sign in</ThemedText>
          </Pressable>
        </View>
        <LegalLinksRow style={styles.legalLinks} testID="welcome-legal-links" textVariant="tertiary" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionWrap: {
    gap: 16,
    paddingTop: 24,
  },
  actionWrapCompact: {
    gap: 14,
    paddingTop: 18,
  },
  brandWrap: {
    paddingTop: 18,
  },
  brand: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
  },
  copyWrap: {
    gap: 14,
    maxWidth: 320,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },
  heroWrapCompact: {
    minHeight: 206,
  },
  legalLinks: {
    marginBottom: 12,
  },
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 340,
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 23,
  },
  topStack: {
    gap: 18,
  },
  title: {
    fontSize: 44,
    letterSpacing: -1.4,
    lineHeight: 52,
    maxWidth: 320,
  },
  titleCompact: {
    fontSize: 38,
    lineHeight: 44,
  },
});
