import {
  buildRestoredTrialPatch,
  canRestoreTrialFromStoredSnapshot,
  isInternalTestingPasswordConfigured,
  isClientInternalTestingEnabled,
  isServerInternalTestingAvailable,
  isServerInternalTestingEnabled,
} from "../../lib/domain/internalTesting";
import { buildRevenueCatAppUserId, getTrialEndsAt } from "../../lib/domain/subscription";

describe("internal testing helpers", () => {
  const now = Date.UTC(2026, 3, 7, 18, 0, 0);

  it("enables client internal testing by default in dev", () => {
    expect(
      isClientInternalTestingEnabled({
        explicitFlag: undefined,
        isDev: true,
      })
    ).toBe(true);
  });

  it("lets the explicit client flag disable internal testing in dev", () => {
    expect(
      isClientInternalTestingEnabled({
        explicitFlag: "false",
        isDev: true,
      })
    ).toBe(false);
  });

  it("keeps server internal testing off until the backend env flag is explicitly enabled", () => {
    expect(
      isServerInternalTestingEnabled({
        explicitFlag: undefined,
      })
    ).toBe(false);
  });

  it("enables server internal testing when the backend env flag is true", () => {
    expect(
      isServerInternalTestingEnabled({
        explicitFlag: "true",
      })
    ).toBe(true);
  });

  it("treats blank internal-tools passwords as unconfigured", () => {
    expect(isInternalTestingPasswordConfigured("")).toBe(false);
    expect(isInternalTestingPasswordConfigured("   ")).toBe(false);
    expect(isInternalTestingPasswordConfigured("secret")).toBe(true);
  });

  it("requires both the backend flag and password for server availability", () => {
    expect(
      isServerInternalTestingAvailable({
        explicitFlag: "true",
        password: "secret",
      })
    ).toBe(true);

    expect(
      isServerInternalTestingAvailable({
        explicitFlag: "true",
        password: "",
      })
    ).toBe(false);

    expect(
      isServerInternalTestingAvailable({
        explicitFlag: undefined,
        password: "secret",
      })
    ).toBe(false);
  });

  it("builds a fresh seven day trial patch for the current user", () => {
    const patch = buildRestoredTrialPatch({
      now,
      revenueCatAppUserId: undefined,
      userId: "user-123",
    });

    expect(patch.lastBillingSyncAt).toBe(now);
    expect(patch.revenueCatAppUserId).toBe(buildRevenueCatAppUserId("user-123"));
    expect(patch.subscriptionStatus).toBe("trial");
    expect(patch.trialStartDate).toBe(now);
    expect(patch.trialEndsAt).toBe(getTrialEndsAt(now));
  });

  it("blocks restore for stored active subscriptions", () => {
    expect(
      canRestoreTrialFromStoredSnapshot(
        {
          status: "active",
          subscriptionExpiresAt: now + 60_000,
        },
        now
      )
    ).toBe(false);
  });

  it("allows restore for expired snapshots", () => {
    expect(
      canRestoreTrialFromStoredSnapshot(
        {
          status: "expired",
          trialEndsAt: now - 60_000,
        },
        now
      )
    ).toBe(true);
  });
});
