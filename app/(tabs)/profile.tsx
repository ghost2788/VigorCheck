import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ProfileReminderSummary } from "../../components/ProfileReminderSummary";
import { ProfileSummaryCard } from "../../components/ProfileSummaryCard";
import { ThemedText } from "../../components/ThemedText";
import { authClient } from "../../lib/auth/authClient";
import { useSubscription } from "../../lib/billing/SubscriptionProvider";
import { isInternalTestingToolsEnabled } from "../../lib/config/internalTesting";
import { openLegalLink } from "../../lib/config/legalLinks";
import {
  DEV_TOOLS_REVEAL_HOLD_DURATION_MS,
  INTERNAL_TOOLS_RELOCK_MESSAGE,
  isInternalToolsInvalidPasswordError,
  isInternalToolsUnlockRequiredError,
} from "../../lib/domain/internalTesting";
import {
  buildBodyAndPreferencesSummary,
  buildGoalsAndTargetsSummary,
  buildReminderSummaryItems,
  formatClockTimeDisplay,
  toPlanSettings,
} from "../../lib/domain/profileSettings";
import { formatClockTime, parseClockTime } from "../../lib/domain/reminders";
import { useDevToolsAccess } from "../../lib/internalTesting/DevToolsAccessProvider";
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

function formatUsageBucketRemaining(label: string, remaining: number) {
  if (label === "Today") {
    return `${remaining} left today`;
  }

  if (label === "Trial total") {
    return `${remaining} left in trial`;
  }

  return `${remaining} left this month`;
}

function formatDiagnosticsCurrency(usdMicros: number) {
  const dollars = usdMicros / 1_000_000;

  if (dollars > 0 && dollars < 0.01) {
    return "<$0.01";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(dollars);
}

function formatDiagnosticsRequestCount(count: number) {
  return `${count} ${count === 1 ? "request" : "requests"}`;
}

function formatDiagnosticsCallKindLabel(
  callKind: "photo_scan" | "supplement_scan" | "text_entry" | "drink_estimate"
) {
  if (callKind === "photo_scan") {
    return "Photo scans";
  }

  if (callKind === "supplement_scan") {
    return "Supplement scans";
  }

  if (callKind === "text_entry") {
    return "Text entries";
  }

  return "Drink estimates";
}

function formatDiagnosticsEventTitle(
  callKind: "photo_scan" | "supplement_scan" | "text_entry" | "drink_estimate"
) {
  if (callKind === "photo_scan") {
    return "Photo scan";
  }

  if (callKind === "supplement_scan") {
    return "Supplement scan";
  }

  if (callKind === "text_entry") {
    return "Text entry";
  }

  return "Drink estimate";
}

function formatDiagnosticsStatusLabel({
  resultStatus,
  usageState,
}: {
  resultStatus: "completed" | "blocked_quota" | "provider_error" | "postprocess_error";
  usageState: "present" | "missing" | "not_applicable";
}) {
  const statusLabel =
    resultStatus === "completed"
      ? "Completed"
      : resultStatus === "blocked_quota"
        ? "Blocked"
        : resultStatus === "provider_error"
          ? "Provider error"
          : "Postprocess error";

  if (usageState === "missing") {
    return `${statusLabel} \u2022 usage missing`;
  }

  return statusLabel;
}

function formatDiagnosticsTokenLabel(totalTokens: number | null) {
  if (totalTokens === null) {
    return "No token data";
  }

  return `${totalTokens.toLocaleString("en-US")} tokens`;
}

export default function ProfileScreen() {
  const { setThemePreference, theme, themePreference } = useTheme();
  const router = useRouter();
  const clientInternalTestingEnabled = isInternalTestingToolsEnabled();
  const {
    isDevToolsTriggerRevealed,
    isDevToolsUnlocked,
    relockDevTools,
    resetDevToolsAccess,
    revealDevToolsTrigger,
    unlockDevTools,
    unlockToken,
  } = useDevToolsAccess();
  const currentUser = useQuery(api.users.current);
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
  const aiUsage = useQuery(
    api.aiUsage.currentStatus,
    accessState?.status === "trial" ? {} : "skip"
  );
  const devToolsAvailability = useQuery(
    api.testing.devToolsAvailability,
    clientInternalTestingEnabled ? {} : "skip"
  );
  const canSurfaceDevToolsFlow =
    clientInternalTestingEnabled && devToolsAvailability?.enabled === true;
  const aiDiagnosticsResult = useQuery(
    api.aiObservability.currentUserDiagnostics,
    canSurfaceDevToolsFlow && unlockToken ? { unlockToken } : "skip"
  );
  const unlockInternalTools = useMutation(api.testing.unlockInternalTools);
  const forceTrialExpired = useMutation(api.testing.forceTrialExpired);
  const restoreTrial = useMutation(api.testing.restoreTrial);
  const { data: session } = authClient.useSession();
  const [accountActionError, setAccountActionError] = React.useState<string | null>(null);
  const [isUnlockCardVisible, setIsUnlockCardVisible] = React.useState(false);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = React.useState("");
  const previousUserIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const nextUserId = currentUser?._id ?? null;

    if (previousUserIdRef.current && nextUserId && previousUserIdRef.current !== nextUserId) {
      resetDevToolsAccess();
      setAccountActionError(null);
      setIsUnlockCardVisible(false);
      setUnlockError(null);
      setUnlockPassword("");
    }

    previousUserIdRef.current = nextUserId;
  }, [currentUser?._id, resetDevToolsAccess]);

  React.useEffect(() => {
    if (isDevToolsUnlocked && aiDiagnosticsResult?.status === "locked") {
      relockDevTools();
      setAccountActionError(INTERNAL_TOOLS_RELOCK_MESSAGE);
      setIsUnlockCardVisible(false);
      setUnlockError(null);
      setUnlockPassword("");
    }
  }, [aiDiagnosticsResult, isDevToolsUnlocked, relockDevTools]);

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
  const canRestoreTrial = subscriptionStatus !== "active";
  const showUnlockedDevTools = canSurfaceDevToolsFlow && isDevToolsUnlocked;
  const showDevToolsEntryPoint = canSurfaceDevToolsFlow && isDevToolsTriggerRevealed;
  const aiDiagnostics =
    aiDiagnosticsResult && aiDiagnosticsResult.status === "ready" ? aiDiagnosticsResult : null;
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

  async function runDevToolsAction(action: () => Promise<void>) {
    setAccountActionError(null);

    try {
      await action();
    } catch (error) {
      console.error(error);

      if (isInternalToolsUnlockRequiredError(error)) {
        relockDevTools();
        setAccountActionError(INTERNAL_TOOLS_RELOCK_MESSAGE);
        return;
      }

      setAccountActionError("We couldn't complete that account action right now. Please try again.");
    }
  }

  function buildAppearanceOptionStyle(selected: boolean) {
    return {
      backgroundColor: selected ? `${theme.accent1}16` : theme.surfaceSoft,
      borderColor: selected ? `${theme.accent1}55` : theme.cardBorder,
    };
  }

  function closeUnlockCard() {
    setIsUnlockCardVisible(false);
    setUnlockError(null);
    setUnlockPassword("");
  }

  async function submitUnlockRequest() {
    if (!unlockPassword.trim()) {
      return;
    }

    setIsUnlocking(true);
    setUnlockError(null);
    setAccountActionError(null);

    try {
      const result = await unlockInternalTools({
        password: unlockPassword,
      });

      unlockDevTools(result.unlockToken);
      setUnlockPassword("");
      setIsUnlockCardVisible(false);
    } catch (error) {
      if (isInternalToolsInvalidPasswordError(error) && error instanceof Error) {
        setUnlockError(error.message);
      } else {
        console.error(error);
        setUnlockError("Dev tools aren't available for this build right now.");
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <ThemedText size="xl">Profile</ThemedText>
          <ThemedText style={styles.headerBody} variant="secondary">
            Your account, plan, and preferences.
          </ThemedText>
        </View>

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
              <ThemedText
                size="sm"
                variant={subscriptionStatus === "expired" ? "accent3" : "accent1"}
              >
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

        <Card style={styles.appearanceCard}>
          <View style={styles.appearanceCopy}>
            <ThemedText size="lg">Appearance</ThemedText>
            <ThemedText size="sm" variant="secondary">
              Applies to this device
            </ThemedText>
          </View>

          <View style={styles.appearanceOptionsRow}>
            {(["dark", "light"] as const).map((option) => {
              const selected = themePreference === option;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => setThemePreference(option)}
                  style={[styles.appearanceOption, buildAppearanceOptionStyle(selected)]}
                  testID={`appearance-option-${option}`}
                >
                  <ThemedText size="sm" variant={selected ? "accent1" : "secondary"}>
                    {option === "dark" ? "Dark" : "Light"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Card>

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

        {subscriptionStatus === "trial" && aiUsage ? (
          <Card
            style={[
              styles.usageCard,
              aiUsage.photo.isWarning || aiUsage.text.isWarning
                ? {
                    backgroundColor: `${theme.accent3}10`,
                    borderColor: `${theme.accent3}26`,
                    shadowColor: theme.shadow,
                  }
                : null,
            ]}
          >
            <View style={styles.usageHeader}>
              <View style={styles.usageHeaderCopy}>
                <ThemedText size="lg">AI usage</ThemedText>
                <ThemedText size="sm" variant="secondary">
                  Free trial totals and monthly fair-use limits update when AI starts.
                </ThemedText>
              </View>
              {aiUsage.photo.isWarning || aiUsage.text.isWarning ? (
                <View
                  style={[
                    styles.usageBadge,
                    {
                      backgroundColor: `${theme.accent3}16`,
                      borderColor: `${theme.accent3}2c`,
                    },
                  ]}
                >
                  <ThemedText size="sm" variant="accent3">
                    Approaching limit
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.usageRow}>
              <View style={styles.usageRowCopy}>
                <ThemedText size="sm">Photo scans</ThemedText>
                <ThemedText
                  size="sm"
                  style={styles.usagePrimaryLine}
                  variant={aiUsage.photo.isWarning ? "accent3" : "accent1"}
                >
                  {formatUsageBucketRemaining(
                    aiUsage.photo.primaryBucketLabel,
                    aiUsage.photo.primaryBucketLabel === aiUsage.photo.daily.label
                      ? aiUsage.photo.daily.remaining
                      : aiUsage.photo.period.remaining
                  )}
                </ThemedText>
                {aiUsage.photo.primaryBucketLabel !== aiUsage.photo.period.label ? (
                  <ThemedText size="sm" variant="secondary">
                    {formatUsageBucketRemaining(
                      aiUsage.photo.period.label,
                      aiUsage.photo.period.remaining
                    )}
                  </ThemedText>
                ) : null}
                {aiUsage.photo.primaryBucketLabel !== aiUsage.photo.daily.label ? (
                  <ThemedText size="sm" variant="secondary">
                    {formatUsageBucketRemaining(
                      aiUsage.photo.daily.label,
                      aiUsage.photo.daily.remaining
                    )}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={[styles.usageDivider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.usageRow}>
              <View style={styles.usageRowCopy}>
                <ThemedText size="sm">AI text entries</ThemedText>
                <ThemedText
                  size="sm"
                  style={styles.usagePrimaryLine}
                  variant={aiUsage.text.isWarning ? "accent3" : "accent1"}
                >
                  {formatUsageBucketRemaining(
                    aiUsage.text.period.label,
                    aiUsage.text.period.remaining
                  )}
                </ThemedText>
                <ThemedText size="sm" variant="secondary">
                  {aiUsage.text.period.resetLabel}
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={styles.accountCard}>
          <View style={styles.accountHeaderRow}>
            {canSurfaceDevToolsFlow ? (
              <Pressable
                delayLongPress={DEV_TOOLS_REVEAL_HOLD_DURATION_MS}
                onLongPress={revealDevToolsTrigger}
                style={styles.accountCopy}
                testID="profile-dev-tools-trigger"
              >
                <ThemedText size="sm">{accountName}</ThemedText>
                <ThemedText size="sm" variant="secondary">
                  {accountEmail}
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.accountCopy}>
                <ThemedText size="sm">{accountName}</ThemedText>
                <ThemedText size="sm" variant="secondary">
                  {accountEmail}
                </ThemedText>
              </View>
            )}
            <Pressable
              hitSlop={8}
              onPress={() =>
                void runAccountAction(async () => {
                  resetDevToolsAccess();
                  closeUnlockCard();
                  await authClient.signOut();
                  router.replace("/(auth)/welcome");
                })
              }
            >
              <ThemedText size="sm" variant="tertiary">
                Sign out
              </ThemedText>
            </Pressable>
          </View>

          {showDevToolsEntryPoint ? (
            <Pressable onPress={() => setIsUnlockCardVisible(true)} style={styles.devToolsLink}>
              <ThemedText size="sm" variant="tertiary">
                Dev tools
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => void runAccountAction(() => openLegalLink("accountDeletion"))}
            style={styles.accountDeletionLink}
            testID="profile-account-deletion-link"
          >
            <ThemedText size="sm" variant="tertiary">
              Request account deletion
            </ThemedText>
          </Pressable>
        </Card>

        {showDevToolsEntryPoint && isUnlockCardVisible ? (
          <Card style={styles.unlockCard} testID="profile-dev-tools-unlock-card">
            <ThemedText size="lg">Unlock dev tools</ThemedText>
            <ThemedText size="sm" variant="secondary">
              Enter the internal tools password for this build.
            </ThemedText>

            <View
              style={[
                styles.unlockField,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setUnlockPassword}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                style={[styles.unlockInput, { color: theme.text }]}
                testID="profile-dev-tools-password-input"
                value={unlockPassword}
              />
            </View>

            {unlockError ? (
              <ThemedText size="sm" variant="accent3">
                {unlockError}
              </ThemedText>
            ) : null}

            <View style={styles.unlockActions}>
              <Button
                label="Cancel"
                onPress={closeUnlockCard}
                style={styles.unlockActionButton}
                variant="secondary"
              />
              <Button
                disabled={isUnlocking || !unlockPassword.trim()}
                label={isUnlocking ? "Unlocking..." : "Unlock"}
                onPress={() => void submitUnlockRequest()}
                style={styles.unlockActionButton}
              />
            </View>
          </Card>
        ) : null}

        {showUnlockedDevTools ? (
          <View style={[styles.testingSection, { borderTopColor: theme.cardBorder }]}>
            <View style={[styles.testingCard, { borderColor: theme.cardBorder }]}>
              <ThemedText size="xs" variant="tertiary">
                Internal testing
              </ThemedText>
              <ThemedText style={styles.testingBody} variant="tertiary">
                Force the paywall path or restore a fresh local 7-day trial while you test this dev
                build.
              </ThemedText>
              <View style={styles.testingActions}>
                <Pressable
                  onPress={() =>
                    void runDevToolsAction(async () => {
                      if (!unlockToken) {
                        throw new Error("Missing unlock token.");
                      }

                      await forceTrialExpired({ unlockToken });
                    })
                  }
                  style={[styles.testingButton, { borderColor: theme.cardBorder }]}
                  testID="profile-testing-force-trial-expiry"
                >
                  <ThemedText size="xs" variant="tertiary">
                    Force trial expiry
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityState={{ disabled: !canRestoreTrial }}
                  disabled={!canRestoreTrial}
                  onPress={() =>
                    void runDevToolsAction(async () => {
                      if (!unlockToken) {
                        throw new Error("Missing unlock token.");
                      }

                      await restoreTrial({ unlockToken });
                    })
                  }
                  style={[
                    styles.testingButton,
                    {
                      borderColor: canRestoreTrial ? theme.cardBorder : `${theme.cardBorder}99`,
                      opacity: canRestoreTrial ? 1 : 0.45,
                    },
                  ]}
                  testID="profile-testing-restore-trial"
                >
                  <ThemedText size="xs" variant="tertiary">
                    Restore 7-day trial
                  </ThemedText>
                </Pressable>
              </View>
              {!canRestoreTrial ? (
                <ThemedText size="sm" variant="secondary">
                  Trial restore stays disabled while this account already has active access.
                </ThemedText>
              ) : null}
            </View>

            <View style={[styles.testingCard, { borderColor: theme.cardBorder }]}>
              <ThemedText size="xs" variant="tertiary">
                AI diagnostics
              </ThemedText>
              <ThemedText style={styles.testingBody} variant="tertiary">
                Last 30 days from rollups, plus the latest 5 raw events.
              </ThemedText>
              {aiDiagnostics ? (
                <View style={styles.diagnosticsBlock}>
                  <View style={styles.diagnosticsTotalsRow}>
                    <ThemedText size="sm">
                      {formatDiagnosticsRequestCount(aiDiagnostics.totals.requestCount)}
                    </ThemedText>
                    <ThemedText size="sm" variant="secondary">
                      {`${formatDiagnosticsCurrency(aiDiagnostics.totals.estimatedCostUsdMicros)} estimated cost`}
                    </ThemedText>
                  </View>
                  <ThemedText size="sm" variant="secondary">
                    {`${aiDiagnostics.totals.blockedCount} blocked • ${aiDiagnostics.totals.postprocessErrorCount} postprocess issues • ${aiDiagnostics.totals.usageMissingCount} usage missing`}
                  </ThemedText>

                  <View style={[styles.testingDivider, { backgroundColor: theme.cardBorder }]} />

                  {aiDiagnostics.breakdown.map((row) => (
                    <View key={row.callKind} style={styles.diagnosticsRow}>
                      <View style={styles.diagnosticsRowCopy}>
                        <ThemedText size="sm">{formatDiagnosticsCallKindLabel(row.callKind)}</ThemedText>
                        <ThemedText size="sm" variant="secondary">
                          {formatDiagnosticsRequestCount(row.requestCount)}
                        </ThemedText>
                      </View>
                      <ThemedText size="sm" variant="tertiary">
                        {formatDiagnosticsCurrency(row.estimatedCostUsdMicros)}
                      </ThemedText>
                    </View>
                  ))}

                  <View style={[styles.testingDivider, { backgroundColor: theme.cardBorder }]} />

                  <View style={styles.diagnosticsRecentHeader}>
                    <ThemedText size="sm">Recent requests</ThemedText>
                    <ThemedText size="sm" variant="secondary">
                      Latest 5
                    </ThemedText>
                  </View>

                  {aiDiagnostics.recentEvents.length ? (
                    aiDiagnostics.recentEvents.map((event, index) => (
                      <View
                        key={`${event.callKind}-${event.completedAt}-${index}`}
                        style={styles.diagnosticsRow}
                      >
                        <View style={styles.diagnosticsRowCopy}>
                          <ThemedText size="sm">{formatDiagnosticsEventTitle(event.callKind)}</ThemedText>
                          <ThemedText size="sm" variant="secondary">
                            {`${event.model} • ${formatDiagnosticsStatusLabel({
                              resultStatus: event.resultStatus,
                              usageState: event.usageState,
                            })}`}
                          </ThemedText>
                          <ThemedText size="sm" variant="secondary">
                            {formatDiagnosticsTokenLabel(event.totalTokens)}
                          </ThemedText>
                        </View>
                        <ThemedText size="sm" variant="tertiary">
                          {event.estimatedCostUsdMicros === null
                            ? "No cost"
                            : formatDiagnosticsCurrency(event.estimatedCostUsdMicros)}
                        </ThemedText>
                      </View>
                    ))
                  ) : (
                    <ThemedText size="sm" variant="secondary">
                      No AI requests yet.
                    </ThemedText>
                  )}
                </View>
              ) : (
                <ThemedText size="sm" variant="secondary">
                  Loading diagnostics...
                </ThemedText>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    gap: 12,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountDeletionLink: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  accountHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  appearanceCard: {
    gap: 14,
  },
  appearanceCopy: {
    gap: 4,
  },
  appearanceOption: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appearanceOptionsRow: {
    flexDirection: "row",
    gap: 10,
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
  devToolsLink: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  diagnosticsBlock: {
    gap: 10,
  },
  diagnosticsRecentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  diagnosticsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  diagnosticsRowCopy: {
    flex: 1,
    gap: 2,
  },
  diagnosticsTotalsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  testingActions: {
    gap: 10,
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
  testingDivider: {
    height: 1,
    width: "100%",
  },
  testingSection: {
    borderTopWidth: 1,
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
  },
  unlockActionButton: {
    flex: 1,
  },
  unlockActions: {
    flexDirection: "row",
    gap: 10,
  },
  unlockField: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  unlockInput: {
    fontSize: 16,
    minHeight: 44,
  },
  unlockCard: {
    gap: 12,
  },
  usageBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  usageCard: {
    gap: 14,
  },
  usageDivider: {
    height: 1,
    width: "100%",
  },
  usageHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  usageHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  usagePrimaryLine: {
    marginTop: 2,
  },
  usageRow: {
    gap: 6,
  },
  usageRowCopy: {
    gap: 2,
  },
});
