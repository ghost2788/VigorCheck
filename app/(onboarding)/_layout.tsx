import { useConvexAuth, useQuery } from "convex/react";
import React from "react";
import { Redirect, Slot, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import { getOnboardingRedirectForPath } from "../../lib/onboarding/flow";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function OnboardingLayout() {
  const { theme } = useTheme();
  const { isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.current);
  const pathname = usePathname();
  const { draft, isHydrated } = useOnboardingFlow();

  if (isLoading || !isHydrated || currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading setup...
        </ThemedText>
      </View>
    );
  }

  if (currentUser) {
    return <Redirect href="/(tabs)" />;
  }

  const redirectPath = getOnboardingRedirectForPath({
    draft,
    pathname,
  });

  if (redirectPath && redirectPath !== pathname) {
    return <Redirect href={redirectPath} />;
  }

  return <Slot />;
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
