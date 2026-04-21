import { getLocalMonthKey } from "./dayWindow";
import type { SubscriptionStatus } from "./subscription";

export const AI_USAGE_SOFT_CAP_RATIO = 0.8;

export const AI_USAGE_LIMITS = {
  active: {
    photoScans: 100,
    textEntries: 750,
  },
  dailyPhotoScans: 12,
  trial: {
    photoScans: 12,
    textEntries: 100,
  },
} as const;

export type AiUsageFeatureKind = "photo_scan" | "text_ai";
export type AiUsageLimitKind = "calendar_month" | "daily_scan" | "trial_lifetime";

export type AiUsageBucket = {
  isBlocked: boolean;
  isWarning: boolean;
  label: string;
  limit: number;
  remaining: number;
  used: number;
};

export function buildTrialLifetimeWindowKey(trialStartDate: number) {
  return `trial-${trialStartDate}`;
}

export function buildCalendarMonthWindowKey(timestamp: number, timeZone: string) {
  return getLocalMonthKey(timestamp, timeZone);
}

export function buildAiUsageBucket({
  label = "",
  limit,
  used,
}: {
  label?: string;
  limit: number;
  used: number;
}): AiUsageBucket {
  const normalizedUsed = Math.max(0, used);
  const remaining = Math.max(0, limit - normalizedUsed);

  return {
    isBlocked: normalizedUsed >= limit,
    isWarning: normalizedUsed / limit >= AI_USAGE_SOFT_CAP_RATIO,
    label,
    limit,
    remaining,
    used: normalizedUsed,
  };
}

export function pickPrimaryPhotoBucket({
  daily,
  primary,
}: {
  daily: AiUsageBucket;
  primary: AiUsageBucket;
}) {
  if (daily.remaining < primary.remaining) {
    return daily;
  }

  return primary;
}

export function getPrimaryAiUsageLimit(
  accessStatus: SubscriptionStatus,
  featureKind: AiUsageFeatureKind
) {
  if (accessStatus === "trial") {
    return featureKind === "photo_scan"
      ? AI_USAGE_LIMITS.trial.photoScans
      : AI_USAGE_LIMITS.trial.textEntries;
  }

  return featureKind === "photo_scan"
    ? AI_USAGE_LIMITS.active.photoScans
    : AI_USAGE_LIMITS.active.textEntries;
}

export function getPrimaryAiUsageLimitKind(accessStatus: SubscriptionStatus): Exclude<AiUsageLimitKind, "daily_scan"> {
  return accessStatus === "trial" ? "trial_lifetime" : "calendar_month";
}

export function buildAiUsageBlockedMessage({
  accessStatus,
  featureKind,
  limitKind,
}: {
  accessStatus: SubscriptionStatus;
  featureKind: AiUsageFeatureKind;
  limitKind: AiUsageLimitKind;
}) {
  if (accessStatus === "expired") {
    return "Your trial has ended. Start the monthly plan to keep using AI features.";
  }

  if (limitKind === "daily_scan") {
    return "You've reached today's AI photo scan limit. Try again tomorrow.";
  }

  if (accessStatus === "trial") {
    const limit =
      featureKind === "photo_scan"
        ? AI_USAGE_LIMITS.trial.photoScans
        : AI_USAGE_LIMITS.trial.textEntries;
    const label = featureKind === "photo_scan" ? "AI photo scans" : "AI text entries";
    return `You've used all ${limit} ${label} in your free trial. Start the monthly plan to continue.`;
  }

  return featureKind === "photo_scan"
    ? "You've reached this month's AI photo scan fair-use limit. It resets next month."
    : "You've reached this month's AI text fair-use limit. It resets next month.";
}
