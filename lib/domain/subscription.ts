export type SubscriptionStatus = "trial" | "active" | "expired";
export type SubscriptionPlatform = "android" | "ios" | "web" | "unknown";

export type StoredSubscriptionSnapshot = {
  lastBillingSyncAt?: number | null;
  revenueCatAppUserId?: string | null;
  status: SubscriptionStatus;
  subscriptionExpiresAt?: number | null;
  subscriptionPlatform?: SubscriptionPlatform | null;
  subscriptionProductId?: string | null;
  trialEndsAt?: number | null;
  trialStartDate?: number | null;
};

export type NormalizedSubscriptionSnapshot = {
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  lastBillingSyncAt: number | null;
  revenueCatAppUserId: string | null;
  status: SubscriptionStatus;
  subscriptionExpiresAt: number | null;
  subscriptionPlatform: SubscriptionPlatform | null;
  subscriptionProductId: string | null;
  trialEndsAt: number | null;
  trialStartDate: number | null;
};

export type ResolvedSubscriptionAccess = NormalizedSubscriptionSnapshot & {
  accessSource: "expired" | "local_subscription" | "server_subscription" | "trial";
  daysRemaining: number;
  hasAccess: boolean;
  hasActiveLocalEntitlement: boolean;
  shouldShowPaywall: boolean;
};

export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function buildRevenueCatAppUserId(userId: string) {
  return `vigorcheck_${userId}`;
}

export function getTrialEndsAt(trialStartDate: number) {
  return trialStartDate + TRIAL_DURATION_MS;
}

export function getDaysRemaining(endsAt: number | null, now = Date.now()) {
  if (!endsAt || endsAt <= now) {
    return 0;
  }

  return Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000));
}

export function normalizeSubscriptionSnapshot(
  snapshot: StoredSubscriptionSnapshot,
  now = Date.now()
): NormalizedSubscriptionSnapshot {
  const trialStartDate = snapshot.trialStartDate ?? null;
  const trialEndsAt = snapshot.trialEndsAt ?? (trialStartDate ? getTrialEndsAt(trialStartDate) : null);
  const subscriptionExpiresAt = snapshot.subscriptionExpiresAt ?? null;
  const hasActiveSubscription =
    snapshot.status === "active" &&
    (subscriptionExpiresAt === null || subscriptionExpiresAt > now);
  const hasActiveTrial =
    !hasActiveSubscription && snapshot.status === "trial" && trialEndsAt !== null && trialEndsAt > now;
  const status: SubscriptionStatus = hasActiveSubscription
    ? "active"
    : hasActiveTrial
      ? "trial"
      : "expired";

  return {
    hasActiveSubscription,
    hasActiveTrial,
    lastBillingSyncAt: snapshot.lastBillingSyncAt ?? null,
    revenueCatAppUserId: snapshot.revenueCatAppUserId ?? null,
    status,
    subscriptionExpiresAt,
    subscriptionPlatform: snapshot.subscriptionPlatform ?? null,
    subscriptionProductId: snapshot.subscriptionProductId ?? null,
    trialEndsAt,
    trialStartDate,
  };
}

export function resolveSubscriptionAccess({
  hasActiveLocalEntitlement,
  now = Date.now(),
  subscription,
}: {
  hasActiveLocalEntitlement: boolean;
  now?: number;
  subscription: StoredSubscriptionSnapshot;
}): ResolvedSubscriptionAccess {
  const normalized = normalizeSubscriptionSnapshot(subscription, now);

  if (hasActiveLocalEntitlement) {
    return {
      ...normalized,
      accessSource: "local_subscription",
      daysRemaining: getDaysRemaining(normalized.subscriptionExpiresAt, now),
      hasAccess: true,
      hasActiveLocalEntitlement: true,
      shouldShowPaywall: false,
      status: "active",
    };
  }

  if (normalized.hasActiveSubscription) {
    return {
      ...normalized,
      accessSource: "server_subscription",
      daysRemaining: getDaysRemaining(normalized.subscriptionExpiresAt, now),
      hasAccess: true,
      hasActiveLocalEntitlement: false,
      shouldShowPaywall: false,
    };
  }

  if (normalized.hasActiveTrial) {
    return {
      ...normalized,
      accessSource: "trial",
      daysRemaining: getDaysRemaining(normalized.trialEndsAt, now),
      hasAccess: true,
      hasActiveLocalEntitlement: false,
      shouldShowPaywall: false,
    };
  }

  return {
    ...normalized,
    accessSource: "expired",
    daysRemaining: 0,
    hasAccess: false,
    hasActiveLocalEntitlement: false,
    shouldShowPaywall: true,
  };
}
