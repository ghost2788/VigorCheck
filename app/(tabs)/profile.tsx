import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ProfileForm } from "../../components/ProfileForm";
import { ReminderSettingsCard } from "../../components/ReminderSettingsCard";
import { ThemedText } from "../../components/ThemedText";
import { authClient } from "../../lib/auth/authClient";
import { useSubscription } from "../../lib/billing/SubscriptionProvider";
import { getDeviceTimeZone } from "../../lib/domain/dayWindow";
import { useReminderSync } from "../../lib/reminders/ReminderSyncProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);
  const upsertCurrentUser = useMutation(api.users.upsertCurrent);
  const updateReminderSettings = useMutation(api.users.updateReminderSettings);
  const { refreshReminders } = useReminderSync();
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

  if (currentUser === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading your profile...
        </ThemedText>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.card}>
          <ThemedText size="sm" style={styles.cardTitle}>
            No profile yet
          </ThemedText>
          <ThemedText variant="secondary" style={styles.cardBody}>
            Set your baseline once and Profile will become the place to tune targets later.
          </ThemedText>
          <Button label="Open setup" onPress={() => router.replace("/")} />
        </Card>
      </View>
    );
  }

  const accountName = session?.user?.name ?? currentUser.displayName ?? "Google account";
  const accountEmail = session?.user?.email ?? "Signed in with Google";

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
      <View style={styles.header}>
        <ThemedText size="xl">Profile</ThemedText>
        <ThemedText variant="secondary" style={styles.headerBody}>
          Manage your account, subscription, reminders, and baseline settings from one place.
        </ThemedText>
      </View>

      <Card style={styles.sectionCard}>
        <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
          Account
        </ThemedText>
        <ThemedText size="sm">{accountName}</ThemedText>
        <ThemedText variant="secondary">{accountEmail}</ThemedText>
        <Button
          label="Sign out"
          onPress={() =>
            void runAccountAction(async () => {
              await authClient.signOut();
              router.replace("/(auth)/welcome");
            })
          }
          variant="secondary"
        />
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionCopy}>
            <ThemedText variant="tertiary" size="xs" style={styles.eyebrow}>
              Subscription
            </ThemedText>
            <ThemedText size="sm">{statusLabel ?? "Subscription required"}</ThemedText>
          </View>
          {accessState?.status === "active" ? (
            <ThemedText size="sm" style={{ color: theme.accent1 }}>
              Pro
            </ThemedText>
          ) : null}
        </View>

        <ThemedText variant="secondary" style={styles.subscriptionBody}>
          {accessState?.status === "trial"
            ? "Your free trial is active. When it ends, a subscription keeps the full app unlocked."
            : accessState?.status === "active"
              ? "Your subscription is active. Restore and management actions are always available here."
              : "Your trial has ended. Restore or manage a subscription here, or renew to unlock the full app again."}
        </ThemedText>

        {supportMessage ? (
          <ThemedText size="sm" style={{ color: theme.accent3 }}>
            {supportMessage}
          </ThemedText>
        ) : null}

        {accountActionError ? (
          <ThemedText size="sm" style={{ color: theme.accent3 }}>
            {accountActionError}
          </ThemedText>
        ) : null}

        <View style={styles.subscriptionActions}>
          <Button
            disabled={billingBusy || !isConfigured}
            label={billingBusy ? "Working..." : accessState?.status === "active" ? "Manage subscription" : "Start monthly plan"}
            onPress={() =>
              void runAccountAction(
                accessState?.status === "active" ? manageSubscription : purchaseMonthly
              )
            }
          />
          <Button
            disabled={billingBusy || !isConfigured}
            label="Restore purchases"
            onPress={() => void runAccountAction(restorePurchases)}
            variant="secondary"
          />
          <Button
            disabled={billingBusy || !isConfigured}
            label="Manage subscription"
            onPress={() => void runAccountAction(manageSubscription)}
            variant="secondary"
          />
        </View>
      </Card>

      <ProfileForm
        autoPopulateTargets={false}
        embedded
        initialValues={{
          activityLevel: currentUser.activityLevel,
          age: currentUser.age,
          goalType: currentUser.goalType,
          height: currentUser.height,
          sex: currentUser.sex,
          targets: currentUser.targets,
          weight: currentUser.weight,
        }}
        onSubmit={async (values) => {
          await upsertCurrentUser({
            ...values,
            timeZone: getDeviceTimeZone(),
          });
        }}
        style={styles.profileForm}
        submitLabel="Save changes"
        subtitle="Update your baseline and target macros. Home and Trends will react to these changes immediately."
        title="Plan settings"
      />

      <View style={styles.footerStack}>
        <ReminderSettingsCard
          initialSettings={currentUser.reminders}
          onSave={async (settings) => {
            await updateReminderSettings(settings);
            refreshReminders();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  cardBody: {
    marginBottom: 18,
  },
  cardTitle: {
    marginBottom: 8,
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
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  eyebrow: {
    marginBottom: 8,
  },
  footerStack: {
    gap: 16,
    marginTop: 16,
  },
  header: {
    marginBottom: 18,
  },
  headerBody: {
    lineHeight: 22,
    marginTop: 10,
  },
  loadingLabel: {
    marginTop: 12,
  },
  profileForm: {
    paddingBottom: 0,
  },
  sectionCard: {
    gap: 10,
    marginBottom: 16,
  },
  subscriptionActions: {
    gap: 10,
  },
  subscriptionBody: {
    lineHeight: 20,
  },
  subscriptionCopy: {
    flex: 1,
  },
  subscriptionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
