import React from "react";
import { useRouter } from "expo-router";
import { OnboardingOptionStep } from "../../components/onboarding/OnboardingOptionStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { ACTIVITY_OPTIONS } from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
} from "../../lib/onboarding/flow";

export default function ActivityScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();

  return (
    <OnboardingScreen
      actionDisabled={!draft.activityLevel}
      actionLabel="Build my plan"
      onActionPress={() => router.push(getNextOnboardingPath("activity", draft))}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("activity", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("activity", draft)}
      subtitle="Choose the activity level that matches most of your week."
      title="How active are you?"
    >
      <OnboardingOptionStep
        onSelect={(value) => setDraftValue("activityLevel", value)}
        options={ACTIVITY_OPTIONS}
        selectedValue={draft.activityLevel}
      />
    </OnboardingScreen>
  );
}
