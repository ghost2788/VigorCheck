import {
  getDaysRemaining,
  getTrialEndsAt,
  normalizeSubscriptionSnapshot,
  resolveStoredSubscriptionStatus,
  resolveSubscriptionAccess,
  TRIAL_DURATION_MS,
} from "../../lib/domain/subscription";

describe("subscription domain helpers", () => {
  const now = Date.UTC(2026, 3, 3, 18, 0, 0);

  it("computes a seven day trial window", () => {
    const startedAt = Date.UTC(2026, 3, 1, 12, 0, 0);

    expect(getTrialEndsAt(startedAt)).toBe(startedAt + TRIAL_DURATION_MS);
  });

  it("derives trial end dates from legacy trialStartDate fields", () => {
    const trialStartDate = now - 2 * 24 * 60 * 60 * 1000;
    const normalized = normalizeSubscriptionSnapshot(
      {
        status: "trial",
        trialStartDate,
      },
      now
    );

    expect(normalized.status).toBe("trial");
    expect(normalized.trialEndsAt).toBe(getTrialEndsAt(trialStartDate));
    expect(normalized.hasActiveTrial).toBe(true);
  });

  it("expires trials once the seven day window has elapsed", () => {
    const trialEndsAt = now - 1;
    const normalized = normalizeSubscriptionSnapshot(
      {
        status: "trial",
        trialEndsAt,
      },
      now
    );

    expect(normalized.status).toBe("expired");
    expect(normalized.hasActiveTrial).toBe(false);
  });

  it("keeps active subscriptions unlocked from the stored server state", () => {
    const subscriptionExpiresAt = now + 3 * 24 * 60 * 60 * 1000;
    const access = resolveSubscriptionAccess({
      hasActiveLocalEntitlement: false,
      now,
      subscription: {
        status: "active",
        subscriptionExpiresAt,
      },
    });

    expect(access.status).toBe("active");
    expect(access.accessSource).toBe("server_subscription");
    expect(access.hasAccess).toBe(true);
    expect(access.daysRemaining).toBe(3);
  });

  it("keeps a canceled-but-still-paid subscription active until its future expiry", () => {
    const subscriptionExpiresAt = now + 5 * 60 * 1000;

    expect(
      resolveStoredSubscriptionStatus({
        now,
        snapshot: {
          status: "expired",
          subscriptionExpiresAt,
        },
      })
    ).toBe("active");

    const access = resolveSubscriptionAccess({
      hasActiveLocalEntitlement: false,
      now,
      subscription: {
        status: "expired",
        subscriptionExpiresAt,
      },
    });

    expect(access.status).toBe("active");
    expect(access.accessSource).toBe("server_subscription");
    expect(access.hasAccess).toBe(true);
  });

  it("lets a fresh local RevenueCat entitlement bypass stale expired server state", () => {
    const access = resolveSubscriptionAccess({
      hasActiveLocalEntitlement: true,
      now,
      subscription: {
        status: "expired",
        subscriptionExpiresAt: now - 60_000,
        trialEndsAt: now - 60_000,
      },
    });

    expect(access.status).toBe("active");
    expect(access.accessSource).toBe("local_subscription");
    expect(access.hasAccess).toBe(true);
    expect(access.shouldShowPaywall).toBe(false);
  });

  it("rounds remaining days up so a partial last day still shows as one day left", () => {
    expect(getDaysRemaining(now + 12 * 60 * 60 * 1000, now)).toBe(1);
  });
});
