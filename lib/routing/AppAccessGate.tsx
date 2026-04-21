import { useConvexAuth, useQuery } from "convex/react";
import { Redirect, useSegments } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { useSubscription } from "../billing/SubscriptionProvider";
import { useTheme } from "../theme/ThemeProvider";

const PROTECTED_ROOT_SEGMENTS = new Set(["(tabs)", "history", "profile", "scan", "supplements"]);

export function isProtectedAppRoute(segments: readonly string[]) {
  const rootSegment = segments[0];

  return rootSegment ? PROTECTED_ROOT_SEGMENTS.has(rootSegment) : false;
}

export function AppAccessGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const { accessState } = useSubscription();
  const isProtectedRoute = isProtectedAppRoute(segments);

  if (!isProtectedRoute) {
    return <>{children}</>;
  }

  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return <AccessGateLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (currentUser === null) {
    return <Redirect href="/" />;
  }

  if (accessState === null) {
    return <AccessGateLoadingScreen />;
  }

  if (accessState.shouldShowPaywall) {
    return <Redirect href="/paywall" />;
  }

  return <>{children}</>;
}

function AccessGateLoadingScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.accent1} size="small" />
      <ThemedText variant="secondary" style={styles.loadingLabel}>
        Loading your plan...
      </ThemedText>
    </View>
  );
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
