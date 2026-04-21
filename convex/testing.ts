import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buildRestoredTrialPatch, canRestoreTrialFromStoredSnapshot } from "../lib/domain/internalTesting";
import { buildRevenueCatAppUserId, normalizeSubscriptionSnapshot } from "../lib/domain/subscription";
import { requireCurrentUser } from "./lib/devIdentity";
import {
  createInternalToolsUnlockSession,
  ensureInternalToolsAvailable,
  ensureInternalToolsUnlockToken,
  isInternalToolsAvailableForDeployment,
} from "./lib/internalTools";

export const devToolsAvailability = query({
  args: {},
  handler: async () => {
    return {
      enabled: isInternalToolsAvailableForDeployment(),
    };
  },
});

export const unlockInternalTools = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const session = await createInternalToolsUnlockSession({
      password: args.password,
    });

    await ctx.db.patch(user._id, {
      internalToolsUnlockExpiresAt: session.expiresAt,
      internalToolsUnlockTokenHash: session.tokenHash,
    });

    return {
      unlockToken: session.unlockToken,
    };
  },
});

export const forceTrialExpired = mutation({
  args: {
    unlockToken: v.string(),
  },
  handler: async (ctx, args) => {
    ensureInternalToolsAvailable();
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    await ensureInternalToolsUnlockToken(user, args.unlockToken, now);

    const patch = {
      lastBillingSyncAt: now,
      revenueCatAppUserId: user.revenueCatAppUserId ?? buildRevenueCatAppUserId(user._id),
      subscriptionStatus: "expired" as const,
      trialEndsAt: now - 1_000,
    };

    await ctx.db.patch(user._id, patch);

    return normalizeSubscriptionSnapshot({
      lastBillingSyncAt: patch.lastBillingSyncAt,
      revenueCatAppUserId: patch.revenueCatAppUserId,
      status: patch.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      subscriptionPlatform: user.subscriptionPlatform,
      subscriptionProductId: user.subscriptionProductId,
      trialEndsAt: patch.trialEndsAt,
      trialStartDate: user.trialStartDate,
    });
  },
});

export const restoreTrial = mutation({
  args: {
    unlockToken: v.string(),
  },
  handler: async (ctx, args) => {
    ensureInternalToolsAvailable();
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    await ensureInternalToolsUnlockToken(user, args.unlockToken, now);

    if (
      !canRestoreTrialFromStoredSnapshot(
        {
          lastBillingSyncAt: user.lastBillingSyncAt,
          revenueCatAppUserId: user.revenueCatAppUserId,
          status: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          subscriptionPlatform: user.subscriptionPlatform,
          subscriptionProductId: user.subscriptionProductId,
          trialEndsAt: user.trialEndsAt,
          trialStartDate: user.trialStartDate,
        },
        now
      )
    ) {
      throw new Error("Trial restore is unavailable while this account has active access.");
    }

    const patch = buildRestoredTrialPatch({
      now,
      revenueCatAppUserId: user.revenueCatAppUserId,
      userId: user._id,
    });

    await ctx.db.patch(user._id, patch);

    return normalizeSubscriptionSnapshot({
      lastBillingSyncAt: patch.lastBillingSyncAt,
      revenueCatAppUserId: patch.revenueCatAppUserId,
      status: patch.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      subscriptionPlatform: user.subscriptionPlatform,
      subscriptionProductId: user.subscriptionProductId,
      trialEndsAt: patch.trialEndsAt,
      trialStartDate: patch.trialStartDate,
    });
  },
});
