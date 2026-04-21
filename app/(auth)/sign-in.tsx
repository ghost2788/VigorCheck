import React from "react";
import { useQuery } from "convex/react";
import { Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthScreen } from "../../components/auth/AuthScreen";
import { Button } from "../../components/Button";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { startGoogleAuth } from "../../lib/auth/authClient";

export default function SignInScreen() {
  const router = useRouter();
  const authStatus = useQuery(api.auth.status);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setError(null);

    try {
      await startGoogleAuth("signIn");
      router.replace("/");
    } catch (authError) {
      console.error(authError);
      setError("We couldn't start that sign-in flow right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footerActionLabel="Create account"
      footerLabel="New here?"
      onFooterActionPress={() => router.replace("/(auth)/create-account")}
      showBrandHeader
      subtitle="Sign in to resume your saved plan, reminders, history, and analytics."
      title="Sign in"
    >
      <View style={styles.stack}>
        <Button
          disabled={Platform.OS === "web" || authStatus?.googleConfigured === false || submitting}
          label={submitting ? "Working..." : "Continue with Google"}
          onPress={() => void handleGoogleSignIn()}
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
