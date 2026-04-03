import React from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AuthField } from "../../components/auth/AuthField";
import { AuthScreen } from "../../components/auth/AuthScreen";
import { Button } from "../../components/Button";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";

export default function AuthNameScreen() {
  const router = useRouter();
  const { draft, setDraftValue } = useOnboardingFlow();
  const [name, setName] = React.useState(draft.displayName ?? "");

  return (
    <AuthScreen
      subtitle="If your provider didn't give us a first name, add one here so your plan feels like yours."
      title="What should we call you?"
    >
      <View style={styles.stack}>
        <AuthField
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="First name"
          value={name}
        />
        <Button
          disabled={!name.trim()}
          label="Continue"
          onPress={() => {
            setDraftValue("displayName", name.trim());
            router.replace("/(onboarding)/summary");
          }}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
});
