import "expo-dev-client";
import "react-native-gesture-handler";

import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { ThemedText } from "../components/ThemedText";
import { ConvexClientProvider } from "../lib/ConvexClientProvider";
import { getAuthBaseUrl, getConvexUrl, useWarmUpBrowser } from "../lib/auth/authClient";
import { SubscriptionProvider } from "../lib/billing/SubscriptionProvider";
import { OnboardingFlowProvider } from "../lib/onboarding/OnboardingFlowProvider";
import { ReminderSyncProvider } from "../lib/reminders/ReminderSyncProvider";
import { ScanFlowProvider } from "../lib/scan/ScanFlowProvider";
import { ThemeProvider, useTheme } from "../lib/theme/ThemeProvider";

function RootNavigator() {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

function AuthProviders({ children }: { children: React.ReactNode }) {
  useWarmUpBrowser();

  return (
    <ConvexClientProvider>
      <SubscriptionProvider>
        <ReminderSyncProvider>
          <ScanFlowProvider>{children}</ScanFlowProvider>
        </ReminderSyncProvider>
      </SubscriptionProvider>
    </ConvexClientProvider>
  );
}

function MissingAuthConfigScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <Card style={styles.configCard}>
        <ThemedText size="xl" style={styles.configTitle}>
          Finish auth setup
        </ThemedText>
        <ThemedText variant="secondary" style={styles.configBody}>
          Add your Convex deployment URLs to `.env.local`, then reload the app.
        </ThemedText>
        <ThemedText size="xs" variant="tertiary">
          Required: `EXPO_PUBLIC_CONVEX_URL`
        </ThemedText>
        <ThemedText size="xs" variant="tertiary">
          Required: `EXPO_PUBLIC_CONVEX_SITE_URL`
        </ThemedText>
      </Card>
    </View>
  );
}

function AppProviders() {
  const convexUrl = getConvexUrl();
  const authBaseUrl = getAuthBaseUrl();

  if (!convexUrl || !authBaseUrl) {
    return <MissingAuthConfigScreen />;
  }

  return (
    <AuthProviders>
      <RootNavigator />
    </AuthProviders>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingFlowProvider>
            <AppProviders />
          </OnboardingFlowProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  configBody: {
    lineHeight: 22,
    marginBottom: 16,
  },
  configCard: {
    gap: 10,
    maxWidth: 420,
    width: "100%",
  },
  configTitle: {
    marginBottom: 4,
  },
});
