import { useConvexAuth, useMutation, useQuery } from "convex/react";
import React from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { api } from "../convex/_generated/api";
import { getDeviceTimeZone } from "../lib/domain/dayWindow";
import { computeBaseTargets } from "../lib/domain/targets";
import { useSubscription } from "../lib/billing/SubscriptionProvider";
import { isOnboardingDraftComplete } from "../lib/onboarding/flow";
import { useOnboardingFlow } from "../lib/onboarding/OnboardingFlowProvider";
import { useTheme } from "../lib/theme/ThemeProvider";

export default function BootstrapScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { draft, isHydrated, markPostOnboardingHomeCTA, resetDraft } = useOnboardingFlow();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { accessState } = useSubscription();
  const currentUser = useQuery(api.users.current);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const draftComplete = isOnboardingDraftComplete(draft);
  const [isAutoCompleting, setIsAutoCompleting] = React.useState(false);
  const [autoCompleteFailed, setAutoCompleteFailed] = React.useState(false);
  const hasAttemptedAutoComplete = React.useRef(false);
  const isMounted = React.useRef(true);

  React.useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  React.useEffect(() => {
    if (
      !isHydrated ||
      isLoading ||
      !isAuthenticated ||
      currentUser !== null ||
      !draftComplete ||
      autoCompleteFailed ||
      hasAttemptedAutoComplete.current
    ) {
      return;
    }

    hasAttemptedAutoComplete.current = true;
    setIsAutoCompleting(true);

    const completedDraft = draft;
    const computed = computeBaseTargets(completedDraft);

    const autoSavePromise = completeOnboarding({
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

    void autoSavePromise
      .then(() => {
        if (!isMounted.current) {
          return;
        }

        markPostOnboardingHomeCTA();
        resetDraft();
        router.replace("/(tabs)");
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted.current) {
          return;
        }

        hasAttemptedAutoComplete.current = false;
        setAutoCompleteFailed(true);
        setIsAutoCompleting(false);
      });
  }, [
    autoCompleteFailed,
    completeOnboarding,
    currentUser,
    draft,
    draftComplete,
    isAuthenticated,
    isHydrated,
    isLoading,
    markPostOnboardingHomeCTA,
    resetDraft,
    router,
  ]);

  if (isLoading || !isHydrated || currentUser === undefined || isAutoCompleting) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          {isAutoCompleting ? "Saving your plan..." : "Loading your plan..."}
        </ThemedText>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (currentUser) {
    if (accessState?.shouldShowPaywall) {
      return <Redirect href="/paywall" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  if (draftComplete) {
    return <Redirect href="/(onboarding)/summary" />;
  }

  return <Redirect href="/(onboarding)/goal" />;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingLabel: {
    marginTop: 12,
  },
});
