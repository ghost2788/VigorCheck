import React from "react";
import { useRouter } from "expo-router";
import { OnboardingOptionStep } from "../../components/onboarding/OnboardingOptionStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { SEX_OPTIONS } from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
} from "../../lib/onboarding/flow";

export default function SexScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();

  return (
    <OnboardingScreen
      actionDisabled={!draft.sex}
      actionLabel="Continue"
      onActionPress={() => router.push(getNextOnboardingPath("sex", draft))}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("sex", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("sex", draft)}
      subtitle="This helps set your starting calorie and nutrition targets."
      title="Which sex should we use for your plan?"
    >
      <OnboardingOptionStep
        onSelect={(value) => setDraftValue("sex", value)}
        options={SEX_OPTIONS}
        selectedValue={draft.sex}
      />
    </OnboardingScreen>
  );
}
