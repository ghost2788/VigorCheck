import React from "react";
import { useRouter } from "expo-router";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { WelcomeHudHero } from "../../components/auth/WelcomeHudHero";
import { Card } from "../../components/Card";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { ThemedText } from "../../components/ThemedText";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import { ONBOARDING_PATHS } from "../../lib/onboarding/flow";
import { useTheme } from "../../lib/theme/ThemeProvider";

const BUILD_STEPS = [
  "Calculating your targets...",
  "Building your nutrition plan...",
  "Personalizing your focus areas...",
  "Preparing your dashboard...",
];

const INITIAL_PROGRESS = 0.08;
const MIN_DURATION_MS = 5000;
const STEP_ADVANCE_MS = 1200;

export default function BuildPlanScreen() {
  const { replace } = useRouter();
  const { draft } = useOnboardingFlow();
  const { theme } = useTheme();
  const progressValue = React.useRef(new Animated.Value(INITIAL_PROGRESS)).current;
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const [visibleStepCount, setVisibleStepCount] = React.useState(1);

  React.useEffect(() => {
    const stepTimers = BUILD_STEPS.slice(1).map((_, index) =>
      setTimeout(() => {
        setVisibleStepCount(index + 2);
        setActiveStepIndex(index + 1);
      }, STEP_ADVANCE_MS * (index + 1))
    );
    const timeoutId = setTimeout(() => {
      replace(ONBOARDING_PATHS.summary);
    }, MIN_DURATION_MS);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [replace]);

  React.useEffect(() => {
    const animation = Animated.timing(progressValue, {
      duration: MIN_DURATION_MS,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progressValue]);

  const progressFillWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <OnboardingScreen
      actionLabel="Building..."
      actionDisabled
      footerMode="none"
      onActionPress={() => {}}
      onBackPress={() => replace(ONBOARDING_PATHS.activity)}
      progress={null}
      progressLabel="Finalizing your plan"
      subtitle="Setting up your personalized plan..."
      title={`${draft.displayName ?? "Your"} plan is being built`}
    >
      <View style={styles.stack}>
        <WelcomeHudHero style={styles.hero} testID="welcome-hud-hero" variant="compact" />
        <Card style={[styles.card, { borderColor: theme.accent1 }]}>
          <View style={[styles.progressTrack, { backgroundColor: theme.ringTrack }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.accent1,
                  width: progressFillWidth,
                },
              ]}
            />
          </View>

          <View style={styles.statusList}>
            {BUILD_STEPS.slice(0, visibleStepCount).map((step, index) => (
              <BuildStatusRow
                active={index <= activeStepIndex}
                key={step}
                step={step}
              />
            ))}
          </View>
        </Card>
      </View>
    </OnboardingScreen>
  );
}

function BuildStatusRow({
  active,
  step,
}: {
  active: boolean;
  step: string;
}) {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.statusRow,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: active ? theme.accent1 : theme.ringTrack,
          },
        ]}
      />
      <ThemedText style={styles.statusLine} variant={active ? "primary" : "tertiary"}>
        {step}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  hero: {
    marginBottom: 2,
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  statusLine: {
    lineHeight: 22,
  },
  statusList: {
    gap: 10,
  },
  statusRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  stack: {
    gap: 8,
  },
});
