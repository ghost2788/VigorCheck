import React from "react";
import { useRouter } from "expo-router";
import { OnboardingOptionStep } from "../../components/onboarding/OnboardingOptionStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { GOAL_OPTIONS, requiresGoalPace } from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getSetupProgress,
  getPreviousOnboardingPath,
} from "../../lib/onboarding/flow";

export default function GoalScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();

  return (
    <OnboardingScreen
      actionDisabled={!draft.goalType}
      actionLabel="Continue"
      onActionPress={() => {
        if (!draft.goalType) {
          return;
        }

        if (!requiresGoalPace(draft.goalType)) {
          setDraftValue("goalPace", undefined);
        }

        router.push(getNextOnboardingPath("goal", draft));
      }}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("goal", draft);
        if (previous) {
          router.push(previous);
          return;
        }

        router.push("/(auth)/welcome");
      }}
      progress={getSetupProgress("goal", draft)}
      subtitle="Pick the outcome you want your daily plan to support."
      title="What are you working toward?"
    >
      <OnboardingOptionStep
        onSelect={(value) => setDraftValue("goalType", value)}
        options={GOAL_OPTIONS}
        selectedValue={draft.goalType}
      />
    </OnboardingScreen>
  );
}
