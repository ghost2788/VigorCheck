import React from "react";
import { useRouter } from "expo-router";
import { OnboardingOptionStep } from "../../components/onboarding/OnboardingOptionStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { PRIMARY_TRACKING_CHALLENGE_OPTIONS } from "../../lib/domain/targets";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
} from "../../lib/onboarding/flow";

export default function ChallengeScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();
  const compactOptions = React.useMemo(
    () => PRIMARY_TRACKING_CHALLENGE_OPTIONS.map(({ label, value }) => ({ label, value })),
    []
  );

  return (
    <OnboardingScreen
      actionDisabled={!draft.primaryTrackingChallenge}
      actionLabel="Continue"
      onActionPress={() => router.push(getNextOnboardingPath("challenge", draft))}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("challenge", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("challenge", draft)}
      title="What has been the hardest part of tracking?"
    >
      <OnboardingOptionStep
        onSelect={(value) => setDraftValue("primaryTrackingChallenge", value)}
        options={compactOptions}
        selectedValue={draft.primaryTrackingChallenge}
      />
    </OnboardingScreen>
  );
}
