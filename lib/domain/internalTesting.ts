import {
  buildRevenueCatAppUserId,
  getTrialEndsAt,
  normalizeSubscriptionSnapshot,
  type StoredSubscriptionSnapshot,
} from "./subscription";

export const DEV_TOOLS_REVEAL_HOLD_DURATION_MS = 5_000;
export const INTERNAL_TOOLS_UNLOCK_TTL_MS = 24 * 60 * 60 * 1000;
export const INTERNAL_TESTING_DISABLED_ERROR_MESSAGE =
  "Internal testing tools are not enabled for this deployment.";
export const INTERNAL_TESTING_PASSWORD_MISSING_ERROR_MESSAGE =
  "Internal testing tools password is not configured for this deployment.";
export const INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE =
  "The internal tools password is incorrect.";
export const INTERNAL_TOOLS_UNLOCK_REQUIRED_ERROR_MESSAGE = "Dev tools unlock required.";
export const INTERNAL_TOOLS_RELOCK_MESSAGE = "Dev tools locked. Unlock again to continue.";

type InternalTestingEnabledArgs = {
  explicitFlag?: string | null;
};

export function isClientInternalTestingEnabled({
  explicitFlag,
  isDev,
}: InternalTestingEnabledArgs & {
  isDev: boolean;
}) {
  if (explicitFlag === "true") {
    return true;
  }

  if (explicitFlag === "false") {
    return false;
  }

  return isDev;
}

export function isServerInternalTestingEnabled({
  explicitFlag,
}: InternalTestingEnabledArgs) {
  if (explicitFlag === "true") {
    return true;
  }

  if (explicitFlag === "false") {
    return false;
  }

  return false;
}

export function isInternalTestingPasswordConfigured(password?: string | null) {
  return Boolean(password?.trim());
}

export function isServerInternalTestingAvailable({
  explicitFlag,
  password,
}: InternalTestingEnabledArgs & {
  password?: string | null;
}) {
  return (
    isServerInternalTestingEnabled({
      explicitFlag,
    }) && isInternalTestingPasswordConfigured(password)
  );
}

export function buildRestoredTrialPatch({
  now,
  revenueCatAppUserId,
  userId,
}: {
  now: number;
  revenueCatAppUserId?: string | null;
  userId: string;
}) {
  return {
    lastBillingSyncAt: now,
    revenueCatAppUserId: revenueCatAppUserId ?? buildRevenueCatAppUserId(userId),
    subscriptionStatus: "trial" as const,
    trialEndsAt: getTrialEndsAt(now),
    trialStartDate: now,
  };
}

export function canRestoreTrialFromStoredSnapshot(
  subscription: StoredSubscriptionSnapshot,
  now = Date.now()
) {
  return normalizeSubscriptionSnapshot(subscription, now).status !== "active";
}

export function isInternalToolsInvalidPasswordError(error: unknown) {
  return (
    error instanceof Error && error.message === INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE
  );
}

export function isInternalToolsUnlockRequiredError(error: unknown) {
  return error instanceof Error && error.message === INTERNAL_TOOLS_UNLOCK_REQUIRED_ERROR_MESSAGE;
}
