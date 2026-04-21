import { useQuery } from "convex/react";
import { Redirect, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { LegalLinksRow } from "../components/LegalLinksRow";
import { ThemedText } from "../components/ThemedText";
import { WelcomeHudHero } from "../components/auth/WelcomeHudHero";
import { api } from "../convex/_generated/api";
import { authClient } from "../lib/auth/authClient";
import { useSubscription } from "../lib/billing/SubscriptionProvider";
import { openLegalLink } from "../lib/config/legalLinks";
import { useTheme } from "../lib/theme/ThemeProvider";

export default function PaywallScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const {
    accessState,
    isConfigured,
    isLoading,
    manageSubscription,
    offerings,
    purchaseMonthly,
    restorePurchases,
    supportMessage,
  } = useSubscription();
  const [error, setError] = React.useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = React.useState(false);

  if (currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (accessState && !accessState.shouldShowPaywall) {
    return <Redirect href="/(tabs)" />;
  }

  const monthlyPackage =
    offerings?.current?.monthly ?? offerings?.current?.availablePackages[0] ?? null;

  async function runAction(action: () => Promise<void>) {
    setError(null);

    try {
      await action();
    } catch (actionError) {
      console.error(actionError);
      setError("We couldn't complete that subscription step right now. Please try again.");
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 24, 48),
            paddingTop: Math.max(insets.top + 24, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
        testID="paywall-scroll"
      >
        <View style={styles.heroStack}>
          <ThemedText size="xs" variant="accent1">
            SUBSCRIPTION REQUIRED
          </ThemedText>
          <WelcomeHudHero variant="compact" />
          <ThemedText size="xl" style={styles.title}>
            Keep VigorCheck running
          </ThemedText>
        </View>

        <Card style={styles.offerCard}>
          <View style={styles.offerHeader}>
            <ThemedText size="sm">Monthly plan</ThemedText>
            <ThemedText size="lg" style={{ color: theme.accent1 }}>
              {monthlyPackage?.product.priceString ?? "$6.99 / month"}
            </ThemedText>
          </View>
          <ThemedText variant="secondary" style={styles.offerBody}>
            Your 7-day free trial starts when onboarding is saved. Subscribe to continue
            using your saved plan, AI scans, history, reminders, and progress tracking.
          </ThemedText>
          {supportMessage ? (
            <ThemedText size="sm" style={{ color: theme.accent3 }}>
              {supportMessage}
            </ThemedText>
          ) : null}
        </Card>

        {error ? (
          <ThemedText size="sm" style={styles.footerError} variant="accent3">
            {error}
          </ThemedText>
        ) : null}

        <Button
          disabled={isLoading || !isConfigured}
          label={isLoading ? "Working..." : "Start monthly plan"}
          onPress={() => void runAction(purchaseMonthly)}
          testID="paywall-primary-cta"
        />

        <Card style={styles.manageCard} testID="paywall-manage-card">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isManageOpen }}
            hitSlop={8}
            onPress={() => setIsManageOpen((value) => !value)}
            testID="paywall-manage-toggle"
          >
            <View style={styles.manageHeader}>
              <ThemedText size="sm" style={styles.manageTitle}>
                Manage account
              </ThemedText>
              <View style={styles.chevronButton}>
                <View
                  style={[
                    styles.chevron,
                    {
                      borderColor: theme.accent1,
                      transform: [{ rotate: isManageOpen ? "-135deg" : "45deg" }],
                    },
                  ]}
                  testID="paywall-manage-chevron"
                />
              </View>
            </View>
          </Pressable>

          {isManageOpen ? (
            <View style={styles.manageContent} testID="paywall-manage-content">
              <View style={styles.utilityRow} testID="paywall-billing-actions">
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => void runAction(restorePurchases)}
                  testID="paywall-restore-link"
                >
                  <ThemedText size="sm" variant="tertiary">
                    Restore purchases
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => void runAction(manageSubscription)}
                  testID="paywall-manage-link"
                >
                  <ThemedText size="sm" variant="tertiary">
                    Manage subscription
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.accountAction} testID="paywall-account-action">
                <Pressable
                  accessibilityRole="link"
                  hitSlop={8}
                  onPress={() => void runAction(() => openLegalLink("accountDeletion"))}
                  testID="paywall-account-deletion-link"
                >
                  <ThemedText size="sm" variant="tertiary">
                    Account deletion
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    void runAction(async () => {
                      await authClient.signOut();
                      router.replace("/(auth)/welcome");
                    })
                  }
                  testID="paywall-signout-link"
                >
                  <ThemedText size="sm" variant="tertiary">
                    Sign out
                  </ThemedText>
                </Pressable>
              </View>

              <LegalLinksRow testID="paywall-legal-links" textVariant="tertiary" />
            </View>
          ) : null}
        </Card>
      </ScrollView>
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
  content: {
    gap: 14,
    paddingHorizontal: 24,
  },
  footerError: {
    textAlign: "center",
  },
  heroStack: {
    alignItems: "flex-start",
    gap: 14,
  },
  accountAction: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },
  utilityRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },
  offerBody: {
    lineHeight: 20,
  },
  offerCard: {
    gap: 10,
  },
  offerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  screen: {
    flex: 1,
  },
  manageCard: {
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  manageContent: {
    gap: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  manageHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 16,
  },
  manageTitle: {
    flex: 1,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chevron: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    height: 10,
    width: 10,
  },
  chevronButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 32,
  },
  title: {
    lineHeight: 36,
    maxWidth: 320,
  },
});
