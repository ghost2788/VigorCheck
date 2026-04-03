import React from "react";
import { useRouter } from "expo-router";
import { GoalPaceStep } from "../../components/onboarding/GoalPaceStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
} from "../../lib/onboarding/flow";

export default function GoalPaceScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();
  const selectedPace = draft.goalPace ?? "moderate";

  React.useEffect(() => {
    if (!draft.goalPace) {
      setDraftValue("goalPace", "moderate");
    }
  }, [draft.goalPace, setDraftValue]);

  return (
    <OnboardingScreen
      actionLabel="Continue"
      onActionPress={() => router.push(getNextOnboardingPath("goalPace", { ...draft, goalPace: selectedPace }))}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("goalPace", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("goalPace", draft)}
      title="How fast do you want to move?"
    >
      <GoalPaceStep onSelect={(value) => setDraftValue("goalPace", value)} selectedValue={selectedPace} />
    </OnboardingScreen>
  );
}
