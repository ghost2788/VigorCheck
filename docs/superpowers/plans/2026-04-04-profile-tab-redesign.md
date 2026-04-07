# Profile Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Profile tab from a flat list of summary cards into a compact, scannable account hub matching the approved mockup.

**Architecture:** The detail screens, patch mutation, unsaved changes protection, and summary helpers already exist and work correctly. This is a UI-only restructuring of the main profile tab (`profile.tsx`) and `ProfileSummaryCard`, plus a new reminder summary component and domain helpers. No backend or schema changes needed.

**Tech Stack:** React Native, Expo Router, TypeScript, Convex (read-only — no mutations added)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/(tabs)/profile.tsx` | **Modify** | Restructure into hub layout with avatar, section labels, compact hero, reminders list |
| `components/ProfileSummaryCard.tsx` | **Modify** | Bump title to `lg`, drop subtitle prop, change action label to "Edit" |
| `components/ProfileReminderSummary.tsx` | **Create** | Reminder rows with dot indicators, on/off status, wake/sleep window |
| `lib/domain/profileSettings.ts` | **Modify** | Add `buildReminderSummaryItems()` helper for individual reminder rows |
| `lib/domain/profileSettings.test.ts` | **Modify** | Add tests for new helper |

---

### Task 1: Add `buildReminderSummaryItems` domain helper

**Files:**
- Modify: `lib/domain/profileSettings.ts`
- Modify: `lib/domain/profileSettings.test.ts`

- [ ] **Step 1: Write the failing test**

In `lib/domain/profileSettings.test.ts`, add:

```typescript
import {
  buildReminderSummaryItems,
} from "./profileSettings";

describe("buildReminderSummaryItems", () => {
  it("returns all four reminders with on/off status", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: true,
      notifyMealLogging: true,
      notifyGoalCompletion: false,
      notifyEndOfDay: false,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items).toEqual([
      { label: "Hydration", enabled: true },
      { label: "Meal logging", enabled: true },
      { label: "Goal completion", enabled: false },
      { label: "End-of-day", enabled: false },
    ]);
  });

  it("returns all enabled when all toggles are on", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: true,
      notifyMealLogging: true,
      notifyGoalCompletion: true,
      notifyEndOfDay: true,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items.every((item) => item.enabled)).toBe(true);
  });

  it("returns all disabled when all toggles are off", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: false,
      notifyMealLogging: false,
      notifyGoalCompletion: false,
      notifyEndOfDay: false,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items.every((item) => !item.enabled)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest profileSettings.test --no-coverage`
Expected: FAIL — `buildReminderSummaryItems` is not exported

- [ ] **Step 3: Write the implementation**

In `lib/domain/profileSettings.ts`, add the type and function:

```typescript
export type ReminderSummaryItem = {
  label: string;
  enabled: boolean;
};

export function buildReminderSummaryItems(settings: ReminderSettings): ReminderSummaryItem[] {
  return [
    { label: "Hydration", enabled: settings.notifyHydration },
    { label: "Meal logging", enabled: settings.notifyMealLogging },
    { label: "Goal completion", enabled: settings.notifyGoalCompletion },
    { label: "End-of-day", enabled: settings.notifyEndOfDay },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest profileSettings.test --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/domain/profileSettings.ts lib/domain/profileSettings.test.ts
git commit -m "feat(profile): add buildReminderSummaryItems domain helper"
```

---

### Task 2: Update `buildGoalsAndTargetsSummary` to split Carbs and Fat

The mockup shows Carbs and Fat as separate grid items instead of the current combined "Carbs / Fat" cell. This gives a cleaner 2-column grid.

**Files:**
- Modify: `lib/domain/profileSettings.ts:259-288`
- Modify: `lib/domain/profileSettings.test.ts`

- [ ] **Step 1: Write the failing test**

In `lib/domain/profileSettings.test.ts`, add:

```typescript
import {
  buildGoalsAndTargetsSummary,
} from "./profileSettings";

describe("buildGoalsAndTargetsSummary", () => {
  it("returns Carbs and Fat as separate items", () => {
    const items = buildGoalsAndTargetsSummary({
      activityLevel: "moderate",
      age: 32,
      goalPace: "moderate",
      goalType: "fat_loss",
      height: 70,
      preferredUnitSystem: "imperial",
      primaryTrackingChallenge: "consistency",
      sex: "male",
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      timeZone: "America/New_York",
      weight: 185,
    });

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Carbs");
    expect(labels).toContain("Fat");
    expect(labels).not.toContain("Carbs / Fat");

    expect(items.find((i) => i.label === "Carbs")?.value).toBe("200 g");
    expect(items.find((i) => i.label === "Fat")?.value).toBe("67 g");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest profileSettings.test --no-coverage`
Expected: FAIL — "Carbs / Fat" is still combined

- [ ] **Step 3: Update `buildGoalsAndTargetsSummary`**

In `lib/domain/profileSettings.ts`, replace the function body:

```typescript
export function buildGoalsAndTargetsSummary(settings: PlanSettings): SummaryItem[] {
  return [
    {
      label: "Goal",
      value: formatGoalTypeLabel(settings.goalType),
    },
    {
      label: "Pace",
      value: requiresGoalPace(settings.goalType)
        ? formatGoalPaceLabel(settings.goalPace)
        : "Not used",
    },
    {
      label: "Calories",
      value: `${settings.targets.calories} kcal`,
    },
    {
      label: "Protein",
      value: `${settings.targets.protein} g`,
    },
    {
      label: "Carbs",
      value: `${settings.targets.carbs} g`,
    },
    {
      label: "Fat",
      value: `${settings.targets.fat} g`,
    },
  ];
}
```

Note: The "Challenge" row is removed from Goals & Targets. It was low-value in the summary and the mockup drops it to keep the card tight.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest profileSettings.test --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/domain/profileSettings.ts lib/domain/profileSettings.test.ts
git commit -m "feat(profile): split Carbs/Fat into separate summary items, drop Challenge row"
```

---

### Task 3: Update `ProfileSummaryCard` — bump title size, drop subtitle

The mockup uses 16px bold titles (size `lg` in the app's type scale is 18px/500w — close enough and already defined). Subtitles are removed. Action label becomes just "Edit".

**Files:**
- Modify: `components/ProfileSummaryCard.tsx`

- [ ] **Step 1: Remove `subtitle` prop and bump title size**

Replace the full `ProfileSummaryCard.tsx` content:

```typescript
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SummaryItem } from "../lib/domain/profileSettings";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ProfileSummaryCardProps = {
  actionLabel?: string;
  items: SummaryItem[];
  onPress?: () => void;
  title: string;
};

export function ProfileSummaryCard({
  actionLabel,
  items,
  onPress,
  title,
}: ProfileSummaryCardProps) {
  const { theme } = useTheme();

  const content = (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText size="lg" style={styles.title}>
          {title}
        </ThemedText>

        {actionLabel ? (
          <View style={styles.actionRow}>
            <ThemedText size="sm" variant="accent1">
              {actionLabel}
            </ThemedText>
            <Ionicons color={theme.accent1} name="chevron-forward" size={16} />
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <ThemedText size="xs" variant="tertiary" style={styles.label}>
              {item.label}
            </ThemedText>
            <ThemedText size="sm">{item.value}</ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginLeft: 16,
  },
  card: {
    gap: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  item: {
    gap: 4,
    minWidth: "47%",
  },
  label: {
    marginBottom: 2,
  },
  title: {
    flex: 1,
  },
});
```

Key changes:
- Removed `subtitle` prop and related rendering
- Changed title from `size="sm"` to `size="lg"`
- Removed `headerCopy` wrapper View — title gets `flex: 1` directly
- Removed `subtitle` style

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: Errors in `profile.tsx` where `subtitle` prop is still passed. This is expected — we fix it in Task 5.

- [ ] **Step 3: Commit**

```bash
git add components/ProfileSummaryCard.tsx
git commit -m "feat(profile): bump ProfileSummaryCard title to lg, remove subtitle prop"
```

---

### Task 4: Create `ProfileReminderSummary` component

This replaces the grid-based `ProfileSummaryCard` for reminders with a purpose-built component showing individual reminder rows with dot indicators.

**Files:**
- Create: `components/ProfileReminderSummary.tsx`

- [ ] **Step 1: Create the component**

Create `components/ProfileReminderSummary.tsx`:

```typescript
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ReminderSummaryItem } from "../lib/domain/profileSettings";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ProfileReminderSummaryProps = {
  items: ReminderSummaryItem[];
  onPress: () => void;
  windowLabel: string;
};

export function ProfileReminderSummary({
  items,
  onPress,
  windowLabel,
}: ProfileReminderSummaryProps) {
  const { theme } = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <ThemedText size="lg" style={styles.title}>
            Notifications
          </ThemedText>
          <View style={styles.actionRow}>
            <ThemedText size="sm" variant="accent1">
              Edit
            </ThemedText>
            <Ionicons color={theme.accent1} name="chevron-forward" size={16} />
          </View>
        </View>

        {items.map((item) => (
          <View key={item.label} style={styles.reminderRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: item.enabled ? theme.accent1 : theme.textMuted,
                },
              ]}
            />
            <ThemedText
              size="sm"
              style={styles.reminderLabel}
              variant={item.enabled ? "primary" : "tertiary"}
            >
              {item.label}
            </ThemedText>
            <ThemedText size="sm" variant="secondary">
              {item.enabled ? "On" : "Off"}
            </ThemedText>
          </View>
        ))}

        <View style={[styles.windowRow, { borderTopColor: theme.cardBorder }]}>
          <ThemedText size="sm" variant="tertiary">
            {windowLabel}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginLeft: 16,
  },
  card: {
    gap: 0,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  reminderLabel: {
    flex: 1,
  },
  reminderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
  },
  windowRow: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
});
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (component is not imported yet, but should compile standalone)

- [ ] **Step 3: Commit**

```bash
git add components/ProfileReminderSummary.tsx
git commit -m "feat(profile): add ProfileReminderSummary component with dot indicators"
```

---

### Task 5: Rewrite `profile.tsx` with the new hub layout

This is the main task — restructure the profile tab to match the approved mockup.

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Rewrite profile.tsx**

Replace the full content of `app/(tabs)/profile.tsx`:

```typescript
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
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
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.surfaceStrong,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="sm" variant="secondary">
            {getInitials(accountName)}
          </ThemedText>
        </View>
        <View style={styles.accountCopy}>
          <ThemedText size="sm">{accountName}</ThemedText>
          <ThemedText variant="secondary">{accountEmail}</ThemedText>
        </View>
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
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
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
```

Key changes from the current file:
- **Subscription hero**: Replaced the dual-button row (`heroActionsRow` with "Restore purchases" + "Manage" buttons) with a single text link "Restore purchases" below the primary CTA
- **Account card**: Added initials avatar circle before the name/email
- **Section labels**: Added "YOUR PLAN" and "REMINDERS" eyebrow labels between card groups
- **Summary cards**: Changed `actionLabel` from "Edit plan"/"Edit reminders" to "Edit", removed `subtitle` props
- **Reminders**: Replaced `ProfileSummaryCard` with `ProfileReminderSummary` using `buildReminderSummaryItems()`
- **Internal testing**: Replaced `Card` + `Button` with dashed-border container and dashed-border pressable, added top divider with extra margin
- **Header subtitle**: Shortened to "Your account, plan, and preferences."

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — all imports and props should resolve

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS — no test regressions

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat(profile): redesign profile tab as compact account hub with avatar, section labels, reminder rows"
```

---

### Task 6: Verify full build and visual check

**Files:** None (verification only)

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS with zero failures

- [ ] **Step 3: Run Convex validation**

Run: `npx convex dev --once`
Expected: PASS — no schema changes were made, backend should be unchanged

- [ ] **Step 4: Visual spot check**

Launch the app on a simulator/device and verify:
1. Profile tab shows subscription hero with single CTA + text restore link
2. Initials avatar renders in the account card
3. "YOUR PLAN" section label appears above Goals & Targets
4. Goals & Targets shows 6 items: Goal, Pace, Calories, Protein, Carbs, Fat
5. Body & Preferences shows 6 items: Sex, Age, Height, Weight, Activity, Units
6. Both cards say "Edit >" and push to `/profile/plan-settings`
7. "REMINDERS" section label appears above Notifications card
8. Notification card shows 4 reminder rows with green/gray dots
9. Wake/sleep window line appears at the bottom of the notification card
10. Tapping reminder card pushes to `/profile/reminder-settings`
11. Internal testing section (if enabled) shows dashed border below a divider
12. Sign out still works from the account card
13. All three subscription states (trial/active/expired) render correctly

- [ ] **Step 5: Commit any fixes from visual check**

If any spacing or styling adjustments are needed after the visual check, commit them:

```bash
git add -A
git commit -m "fix(profile): visual polish from profile redesign spot check"
```
