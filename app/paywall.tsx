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
    statusLabel,
    supportMessage,
  } = useSubscription();
  const [error, setError] = React.useState<string | null>(null);

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
            paddingBottom: Math.max(insets.bottom + 140, 164),
            paddingTop: Math.max(insets.top + 24, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroStack}>
          <ThemedText size="xs" variant="accent1">
            SUBSCRIPTION REQUIRED
          </ThemedText>
          <WelcomeHudHero variant="compact" />
          <ThemedText size="xl" style={styles.title}>
            Keep your full VigorCheck plan running
          </ThemedText>
          <ThemedText variant="secondary" style={styles.body}>
            Continue with AI meal scans, full nutrient insight, and the daily progress systems
            you set up during onboarding. AI features include fair-use limits.
          </ThemedText>
        </View>

        <Card style={styles.statusCard}>
          <ThemedText size="sm">Account status</ThemedText>
          <ThemedText variant="secondary">{statusLabel ?? "Subscription required"}</ThemedText>
        </Card>

        <Card style={styles.offerCard}>
          <View style={styles.offerHeader}>
            <ThemedText size="sm">Monthly access</ThemedText>
            <ThemedText size="lg" style={{ color: theme.accent1 }}>
              {monthlyPackage?.product.priceString ?? "$6.99 / month"}
            </ThemedText>
          </View>
          <ThemedText variant="secondary" style={styles.offerBody}>
            Your 7-day free trial starts when onboarding is saved. After that, the monthly plan
            keeps AI features and progress tools available with monthly fair-use limits.
          </ThemedText>
          {supportMessage ? (
            <ThemedText size="sm" style={{ color: theme.accent3 }}>
              {supportMessage}
            </ThemedText>
          ) : null}
        </Card>

        <Card style={styles.bulletsCard}>
          <ThemedText size="sm">What stays unlocked</ThemedText>
          <View style={styles.bulletList}>
            <ThemedText variant="secondary">
              - AI meal scans and text entries with fair-use limits
            </ThemedText>
            <ThemedText variant="secondary">- Full vitamin and mineral coverage</ThemedText>
            <ThemedText variant="secondary">- Daily progress, trends, and history</ThemedText>
            <ThemedText variant="secondary">- Plan updates tied to your targets</ThemedText>
          </View>
        </Card>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.cardBorder,
            paddingBottom: Math.max(insets.bottom + 16, 32),
          },
        ]}
      >
        {error ? (
          <ThemedText size="sm" style={styles.footerError} variant="accent3">
            {error}
          </ThemedText>
        ) : null}

        <View style={styles.utilityActions} testID="paywall-utility-actions">
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
              <ThemedText size="sm" variant="secondary">
                Sign out
              </ThemedText>
            </Pressable>
          </View>
          <LegalLinksRow testID="paywall-legal-links" textVariant="tertiary" />
        </View>

        <Button
          disabled={isLoading || !isConfigured}
          label={isLoading ? "Working..." : "Start monthly plan"}
          onPress={() => void runAction(purchaseMonthly)}
          testID="paywall-primary-cta"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    lineHeight: 22,
    maxWidth: 320,
  },
  bulletList: {
    gap: 8,
  },
  bulletsCard: {
    gap: 12,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    gap: 16,
    paddingHorizontal: 24,
  },
  footer: {
    borderTopWidth: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 14,
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
  utilityActions: {
    gap: 10,
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
  statusCard: {
    gap: 8,
  },
  title: {
    lineHeight: 36,
    maxWidth: 320,
  },
});
