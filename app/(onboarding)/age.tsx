import React from "react";
import { useRouter } from "expo-router";
import { OnboardingNumberStep } from "../../components/onboarding/OnboardingNumberStep";
import { OnboardingScreen } from "../../components/onboarding/OnboardingScreen";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import {
  getNextOnboardingPath,
  getPreviousOnboardingPath,
  getSetupProgress,
  parsePositiveDraftNumber,
} from "../../lib/onboarding/flow";

export default function AgeScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();
  const [age, setAge] = React.useState(draft.age?.toString() ?? "");
  const parsedAge = parsePositiveDraftNumber(age);

  return (
    <OnboardingScreen
      actionDisabled={!parsedAge}
      actionLabel="Continue"
      onActionPress={() => {
        if (!parsedAge) {
          return;
        }

        setDraftValue("age", parsedAge);
        router.push(getNextOnboardingPath("age", { ...draft, age: parsedAge }));
      }}
      onBackPress={() => {
        const previous = getPreviousOnboardingPath("age", draft);
        if (previous) {
          router.push(previous);
        }
      }}
      progress={getSetupProgress("age", draft)}
      subtitle="Your age helps anchor calorie, hydration, and nutrient guidance."
      title="How old are you?"
    >
      <OnboardingNumberStep
        onChangeText={setAge}
        placeholder="Age in years"
        testID="ageStepInput"
        value={age}
      />
    </OnboardingScreen>
  );
}
