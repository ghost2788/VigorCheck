import React from "react";
import { useQuery } from "convex/react";
import { Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthScreen } from "../../components/auth/AuthScreen";
import { Button } from "../../components/Button";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { startGoogleAuth } from "../../lib/auth/authClient";

export default function CreateAccountScreen() {
  const router = useRouter();
  const authStatus = useQuery(api.auth.status);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGoogleSignUp() {
    setSubmitting(true);
    setError(null);

    try {
      await startGoogleAuth("signUp");
      router.replace("/");
    } catch (authError) {
      console.error(authError);
      setError("We couldn't start that sign-up flow right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footerActionLabel="Sign in"
      footerLabel="Already have an account?"
      onFooterActionPress={() => router.replace("/(auth)/sign-in")}
      subtitle="Create your account to start a 7-day free trial and save your targets, reminders, history, and trends."
      title="Create your account"
    >
      <View style={styles.stack}>
        <Button
          disabled={Platform.OS === "web" || authStatus?.googleConfigured === false || submitting}
          label={submitting ? "Working..." : "Continue with Google"}
          onPress={() => void handleGoogleSignUp()}
          variant="secondary"
        />

        {error ? <ThemedText variant="accent2">{error}</ThemedText> : null}
        {authStatus?.googleConfigured === false ? (
          <ThemedText variant="secondary">
            Finish Google OAuth setup in Better Auth before testing sign-in on device.
          </ThemedText>
        ) : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
});
