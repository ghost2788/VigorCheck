import { useConvexAuth, useMutation, useQuery } from "convex/react";
import React from "react";
import { useRouter } from "expo-router";
import { DimensionValue, Pressable, StyleSheet, View } from "react-native";
import { Card } from "../../components/Card";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { getDeviceTimeZone } from "../../lib/domain/dayWindow";
import {
  computeBaseTargets,
  GoalPace,
  GoalType,
  PrimaryTrackingChallenge,
} from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import { isOnboardingDraftComplete } from "../../lib/onboarding/flow";
import { useTheme } from "../../lib/theme/ThemeProvider";

type ChallengeFocus = {
  focus: string;
  summary: string;
};

const RAIL_WIDTHS_BY_ROW: readonly DimensionValue[] = ["100%", "88%", "74%", "66%", "58%"];

function getPaceLabel(goalPace?: GoalPace) {
  switch (goalPace) {
    case "slow":
      return "slow and steady";
    case "aggressive":
      return "aggressive";
    default:
      return "moderate";
  }
}

function getGoalLabel(goalType: GoalType) {
  switch (goalType) {
    case "fat_loss":
      return "fat loss";
    case "muscle_gain":
      return "muscle gain";
    case "energy_balance":
      return "energy balance";
    default:
      return "general health";
  }
}

function getChallengeFocus(challenge: PrimaryTrackingChallenge): ChallengeFocus {
  switch (challenge) {
    case "consistency":
      return {
        focus: "First focus",
        summary: "Make daily logging feel lighter so consistency is easier to keep.",
      };
    case "knowing_what_to_eat":
      return {
        focus: "First focus",
        summary: "Keep your targets clear so food choices feel easier to judge.",
      };
    case "portion_sizes":
      return {
        focus: "First focus",
        summary: "Reduce serving guesswork so corrections stay fast and clean.",
      };
    case "motivation":
      return {
        focus: "First focus",
        summary: "Keep momentum visible so ordinary good days are easier to notice.",
      };
  }
}

function getSummaryHeading({
  displayName,
  goalType,
}: {
  displayName?: string;
  goalType: GoalType;
}) {
  if (displayName) {
    return `${displayName}, your plan is ready`;
  }

  return `Your ${getGoalLabel(goalType)} plan is ready`;
}

function TargetStatRow({
  animationProgress,
  color,
  label,
  railWidth,
  suffix,
  targetValue,
  testID,
}: {
  animationProgress: number;
  color: string;
  label: string;
  railWidth: DimensionValue;
  suffix?: string;
  targetValue: number;
  testID: string;
}) {
  const displayValue = Math.round(targetValue * animationProgress);
  const animatedFillWidth = `${(
    Number.parseFloat(String(railWidth).replace("%", "")) * animationProgress
  ).toFixed(2)}%` as DimensionValue;

  return (
    <Card style={styles.targetRow} testID={`summary-target-row-${testID}`}>
      <View style={styles.targetRowTop}>
        <ThemedText size="sm" variant="secondary">
          {label}
        </ThemedText>
        <ThemedText size="lg" style={{ color }}>
          {displayValue}
          {suffix ?? ""}
        </ThemedText>
      </View>
      <View
        style={[styles.targetRail, { backgroundColor: `${color}22`, width: railWidth }]}
        testID={`summary-target-rail-${testID}`}
      >
        <View
          style={[styles.targetRailFill, { backgroundColor: color, width: animatedFillWidth }]}
          testID={`summary-target-rail-fill-${testID}`}
        />
      </View>
    </Card>
  );
}

export default function SummaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { draft, markPostOnboardingHomeCTA, resetDraft } = useOnboardingFlow();
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const draftComplete = isOnboardingDraftComplete(draft);
  const hasFinishedRef = React.useRef(false);

  const finishOnboarding = React.useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;
    markPostOnboardingHomeCTA();
    resetDraft();
    setSaving(false);
    router.replace("/(tabs)");
  }, [markPostOnboardingHomeCTA, resetDraft, router]);

  React.useEffect(() => {
    if (!draftComplete) {
      setAnimationProgress(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      const nextProgress = Math.min((Date.now() - startedAt) / 720, 1);
      setAnimationProgress(nextProgress);

      if (nextProgress >= 1) {
        clearInterval(intervalId);
      }
    }, 16);

    return () => {
      clearInterval(intervalId);
    };
  }, [draftComplete]);

  React.useEffect(() => {
    if (!draftComplete || !saving || !currentUser) {
      return;
    }

    finishOnboarding();
  }, [currentUser, draftComplete, finishOnboarding, saving]);

  if (!draftComplete) {
    return null;
  }

  const completedDraft = draft;
  const computed = computeBaseTargets(completedDraft);
  const focus = getChallengeFocus(completedDraft.primaryTrackingChallenge);
  const heading = getSummaryHeading({
    displayName: completedDraft.displayName,
    goalType: completedDraft.goalType,
  });
  const rows = [
    {
      color: theme.metricCalories,
      key: "calories",
      label: "Calories",
      suffix: undefined,
      targetValue: computed.calories,
    },
    {
      color: theme.metricProtein,
      key: "protein",
      label: "Protein",
      suffix: " g",
      targetValue: computed.protein,
    },
    {
      color: theme.accent2,
      key: "carbs",
      label: "Carbs",
      suffix: " g",
      targetValue: computed.carbs,
    },
    {
      color: theme.accent3,
      key: "fat",
      label: "Fat",
      suffix: " g",
      targetValue: computed.fat,
    },
    {
      color: theme.metricHydration,
      key: "hydration",
      label: "Hydration",
      suffix: " cups",
      targetValue: computed.hydration,
    },
  ] as const;
  const explanation = `Built from your ${getGoalLabel(completedDraft.goalType)} goal, ${getPaceLabel(
    completedDraft.goalPace
  )} pace, and ${completedDraft.activityLevel} activity.`;
  const isCurrentUserLoading = isAuthenticated && currentUser === undefined;

  async function handlePrimaryAction() {
    if (!isAuthenticated) {
      router.push("/(auth)/create-account");
      return;
    }

    setSaving(true);
    setError(null);
    hasFinishedRef.current = false;

    try {
      await completeOnboarding({
        ...completedDraft,
        displayName: completedDraft.displayName,
        targets: {
          calories: computed.calories,
          carbs: computed.carbs,
          fat: computed.fat,
          protein: computed.protein,
        },
        timeZone: getDeviceTimeZone(),
      });

      finishOnboarding();
    } catch (submitError) {
      console.error(submitError);
      setError("We couldn't save your plan right now. Please try again.");
    } finally {
      if (!hasFinishedRef.current) {
        setSaving(false);
      }
    }
  }

  return (
    <OnboardingScreen
      actionDisabled={isLoading || isCurrentUserLoading || saving}
      actionLabel={!isAuthenticated ? "Create account to save plan" : saving ? "Saving..." : "Start tracking"}
      actionTestID="summary-primary-cta"
      error={error}
      footerContent={
        !isAuthenticated ? (
          <View style={styles.footerLinkRow}>
            <ThemedText variant="secondary">Already have an account?</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/sign-in")}>
              <ThemedText style={{ color: theme.accent1 }}>Sign in</ThemedText>
            </Pressable>
          </View>
        ) : null
      }
      footerMode="sticky"
      footerTestID="summary-sticky-footer"
      onActionPress={() => void handlePrimaryAction()}
      onBackPress={() => router.push("/(onboarding)/activity")}
      progress={null}
      progressLabel="Starting plan"
      title={heading}
    >
      <View style={styles.stack}>
        <Card style={styles.explainerCard}>
          <ThemedText size="sm">{explanation}</ThemedText>
        </Card>

        <View style={styles.targetList}>
          {rows.map((row, index) => (
            <TargetStatRow
              animationProgress={animationProgress}
              color={row.color}
              key={row.key}
              label={row.label}
              railWidth={RAIL_WIDTHS_BY_ROW[index]}
              suffix={row.suffix}
              targetValue={row.targetValue}
              testID={row.key}
            />
          ))}
        </View>

        <Card
          style={[
            styles.focusCard,
            {
              backgroundColor: theme.surfaceStrong,
              borderColor: theme.accent1,
            },
          ]}
        >
          <ThemedText size="sm" variant="accent1">
            {focus.focus}
          </ThemedText>
          <ThemedText>{focus.summary}</ThemedText>
        </Card>

        <Card style={styles.secondaryCard}>
          <ThemedText size="sm">This is a starting plan</ThemedText>
          <ThemedText variant="secondary">
            Refine targets in Profile as you log real days and learn what feels sustainable.
          </ThemedText>
        </Card>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  explainerCard: {
    gap: 8,
    paddingVertical: 14,
  },
  focusCard: {
    gap: 10,
  },
  footerLinkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingTop: 4,
  },
  secondaryCard: {
    gap: 10,
  },
  stack: {
    gap: 12,
  },
  targetList: {
    gap: 10,
  },
  targetRail: {
    alignSelf: "flex-start",
    borderRadius: 999,
    height: 5,
    overflow: "hidden",
  },
  targetRailFill: {
    borderRadius: 999,
    height: "100%",
  },
  targetRow: {
    gap: 10,
    paddingVertical: 14,
  },
  targetRowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
