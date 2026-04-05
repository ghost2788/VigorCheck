import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ProfileReminderSummary } from "../../components/ProfileReminderSummary";
import { ProfileSummaryCard } from "../../components/ProfileSummaryCard";
import { ThemedText } from "../../components/ThemedText";
import { authClient } from "../../lib/auth/authClient";
import { useSubscription } from "../../lib/billing/SubscriptionProvider";
import { isInternalTestingToolsEnabled } from "../../lib/config/internalTesting";
import {
  buildBodyAndPreferencesSummary,
  buildGoalsAndTargetsSummary,
  buildReminderSummaryItems,
  formatClockTimeDisplay,
  toPlanSettings,
} from "../../lib/domain/profileSettings";
import { formatClockTime, parseClockTime } from "../../lib/domain/reminders";
import { useTheme } from "../../lib/theme/ThemeProvider";

function getSubscriptionHeroCopy({
  daysRemaining,
  status,
}: {
  daysRemaining: number;
  status: "trial" | "active" | "expired";
}) {
  if (status === "trial") {
    return {
      badge: `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`,
      body: "Your free trial is active. Start a plan to keep full access when it ends.",
      ctaLabel: "Start monthly plan",
    };
  }

  if (status === "active") {
    return {
      badge: "Pro active",
      body: "Your subscription is active. Restore and management actions stay available here.",
      ctaLabel: "Manage subscription",
    };
  }

  return {
    badge: "Expired",
    body: "Your trial has ended. Renew to unlock the full app again, or restore a previous purchase.",
    ctaLabel: "Renew monthly plan",
  };
}

function formatReminderWindow(wakeTime: string, sleepTime: string): string {
  const wake = formatClockTimeDisplay(
    formatClockTime(parseClockTime(wakeTime) ?? { hour: 7, minute: 0 })
  );
  const sleep = formatClockTimeDisplay(
    formatClockTime(parseClockTime(sleepTime) ?? { hour: 22, minute: 0 })
  );

  return `Window: ${wake} \u2013 ${sleep}`;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const forceTrialExpired = useMutation(api.testing.forceTrialExpired);
  const { data: session } = authClient.useSession();
  const {
    accessState,
    isConfigured,
    isLoading: billingBusy,
    manageSubscription,
    purchaseMonthly,
    restorePurchases,
    statusLabel,
    supportMessage,
  } = useSubscription();
  const [accountActionError, setAccountActionError] = React.useState<string | null>(null);
  const showInternalTestingTools = isInternalTestingToolsEnabled();

  if (currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText style={styles.loadingLabel} variant="secondary">
          Loading your profile...
        </ThemedText>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm" style={styles.emptyTitle}>
            No profile yet
          </ThemedText>
          <ThemedText style={styles.emptyBody} variant="secondary">
            Finish onboarding once and Profile becomes your home for subscriptions, reminders, and
            plan updates.
          </ThemedText>
          <Button label="Open setup" onPress={() => router.replace("/")} />
        </Card>
      </View>
    );
  }

  const accountName = session?.user?.name ?? currentUser.displayName ?? "Google account";
  const accountEmail = session?.user?.email ?? "Signed in with Google";
  const planSettings = toPlanSettings(currentUser);
  const subscriptionStatus = accessState?.status ?? "expired";
  const heroCopy = getSubscriptionHeroCopy({
    daysRemaining: accessState?.daysRemaining ?? 0,
    status: subscriptionStatus,
  });

  async function runAccountAction(action: () => Promise<void>) {
    setAccountActionError(null);

    try {
      await action();
    } catch (error) {
      console.error(error);
      setAccountActionError("We couldn't complete that account action right now. Please try again.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <ThemedText size="xl">Profile</ThemedText>
        <ThemedText style={styles.headerBody} variant="secondary">
          Your account, plan, and preferences.
        </ThemedText>
      </View>

      {/* ── Subscription Hero ── */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <ThemedText size="xs" style={styles.eyebrow} variant="tertiary">
              Subscription
            </ThemedText>
            <ThemedText size="lg">{statusLabel ?? "Subscription required"}</ThemedText>
          </View>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor:
                  subscriptionStatus === "expired" ? `${theme.accent3}22` : `${theme.accent1}1f`,
                borderColor:
                  subscriptionStatus === "expired" ? `${theme.accent3}44` : `${theme.accent1}33`,
              },
            ]}
          >
            <ThemedText size="sm" variant={subscriptionStatus === "expired" ? "accent3" : "accent1"}>
              {heroCopy.badge}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.heroBody} variant="secondary">
          {heroCopy.body}
        </ThemedText>

        {supportMessage ? (
          <ThemedText size="sm" variant="accent3">
            {supportMessage}
          </ThemedText>
        ) : null}

        {accountActionError ? (
          <ThemedText size="sm" variant="accent3">
            {accountActionError}
          </ThemedText>
        ) : null}

        <Button
          disabled={billingBusy || !isConfigured}
          label={billingBusy ? "Working..." : heroCopy.ctaLabel}
          onPress={() =>
            void runAccountAction(
              subscriptionStatus === "active" ? manageSubscription : purchaseMonthly
            )
          }
        />

        <Pressable
          disabled={billingBusy || !isConfigured}
          onPress={() => void runAccountAction(restorePurchases)}
          style={styles.restoreLink}
        >
          <ThemedText
            size="sm"
            style={[
              styles.restoreText,
              { opacity: billingBusy || !isConfigured ? 0.45 : 1 },
            ]}
            variant="tertiary"
          >
            Restore purchases
          </ThemedText>
        </Pressable>
      </Card>

      {/* ── Account ── */}
      <Card style={styles.accountCard}>
        <View style={styles.accountCopy}>
          <ThemedText size="sm">{accountName}</ThemedText>
          <ThemedText size="sm" variant="secondary">{accountEmail}</ThemedText>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() =>
            void runAccountAction(async () => {
              await authClient.signOut();
              router.replace("/(auth)/welcome");
            })
          }
        >
          <ThemedText size="sm" variant="tertiary">
            Sign out
          </ThemedText>
        </Pressable>
      </Card>

      {/* ── Your Plan ── */}
      <ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
        Your plan
      </ThemedText>

      <ProfileSummaryCard
        actionLabel="Edit"
        items={buildGoalsAndTargetsSummary(planSettings)}
        onPress={() => router.push("/profile/plan-settings")}
        title="Goals & Targets"
      />

      <ProfileSummaryCard
        actionLabel="Edit"
        items={buildBodyAndPreferencesSummary(planSettings)}
        onPress={() => router.push("/profile/plan-settings")}
        title="Body & Preferences"
      />

      {/* ── Reminders ── */}
      <ThemedText size="xs" style={styles.sectionLabel} variant="tertiary">
        Reminders
      </ThemedText>

      <ProfileReminderSummary
        items={buildReminderSummaryItems(currentUser.reminders)}
        onPress={() => router.push("/profile/reminder-settings")}
        windowLabel={formatReminderWindow(
          currentUser.reminders.wakeTime,
          currentUser.reminders.sleepTime
        )}
      />

      {/* ── Internal Testing ── */}
      {showInternalTestingTools ? (
        <View style={[styles.testingSection, { borderTopColor: theme.cardBorder }]}>
          <View style={[styles.testingCard, { borderColor: theme.cardBorder }]}>
            <ThemedText size="xs" variant="tertiary">
              Internal testing
            </ThemedText>
            <ThemedText style={styles.testingBody} variant="tertiary">
              Force the paywall path without waiting for the trial to finish naturally.
            </ThemedText>
            <Pressable
              onPress={() =>
                void runAccountAction(async () => {
                  await forceTrialExpired({});
                })
              }
              style={[styles.testingButton, { borderColor: theme.cardBorder }]}
            >
              <ThemedText size="xs" variant="tertiary">
                Force trial expiry
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  emptyBody: {
    lineHeight: 22,
    marginBottom: 18,
  },
  emptyCard: {
    width: "100%",
  },
  emptyTitle: {
    marginBottom: 8,
  },
  eyebrow: {
    marginBottom: 4,
  },
  header: {
    marginBottom: 4,
  },
  headerBody: {
    lineHeight: 22,
    marginTop: 10,
  },
  heroBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBody: {
    lineHeight: 20,
  },
  heroCard: {
    gap: 12,
  },
  heroCopy: {
    flex: 1,
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  loadingLabel: {
    marginTop: 12,
  },
  restoreLink: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  restoreText: {
    letterSpacing: 0.4,
  },
  sectionLabel: {
    marginTop: 8,
    paddingLeft: 4,
  },
  testingBody: {
    lineHeight: 18,
  },
  testingButton: {
    alignItems: "center",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  testingCard: {
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  testingSection: {
    borderTopWidth: 1,
    marginTop: 24,
    paddingTop: 20,
  },
});
