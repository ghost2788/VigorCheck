import { mutation } from "./_generated/server";
import { buildRevenueCatAppUserId, normalizeSubscriptionSnapshot } from "../lib/domain/subscription";
import { requireCurrentUser } from "./lib/devIdentity";

export const forceTrialExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
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
