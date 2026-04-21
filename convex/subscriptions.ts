import { v } from "convex/values";
import {
  buildRevenueCatAppUserId,
  getTrialEndsAt,
  normalizeSubscriptionSnapshot,
  resolveStoredSubscriptionStatus,
  SubscriptionPlatform,
  SubscriptionStatus,
} from "../lib/domain/subscription";
import { internalMutation, mutation } from "./_generated/server";
import { requireCurrentUser } from "./lib/devIdentity";

const subscriptionPlatformValidator = v.union(
  v.literal("android"),
  v.literal("ios"),
  v.literal("web"),
  v.literal("unknown")
);

function getStoredSubscriptionSnapshot(user: {
  lastBillingSyncAt?: number;
  revenueCatAppUserId?: string;
  subscriptionExpiresAt?: number;
  subscriptionPlatform?: SubscriptionPlatform;
  subscriptionProductId?: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: number;
  trialStartDate: number;
}) {
  return {
    lastBillingSyncAt: user.lastBillingSyncAt,
    revenueCatAppUserId: user.revenueCatAppUserId,
    status: user.subscriptionStatus,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    subscriptionPlatform: user.subscriptionPlatform,
    subscriptionProductId: user.subscriptionProductId,
    trialEndsAt: user.trialEndsAt,
    trialStartDate: user.trialStartDate,
  };
}

function getDefaultRevenueCatAppUserId(userId: string) {
  return buildRevenueCatAppUserId(userId);
}

function resolveNextSubscriptionStatus({
  activeEntitlement,
  now,
  subscriptionExpiresAt,
  user,
}: {
  activeEntitlement: boolean;
  now: number;
  subscriptionExpiresAt?: number;
  user: {
    lastBillingSyncAt?: number;
    revenueCatAppUserId?: string;
    subscriptionExpiresAt?: number;
    subscriptionPlatform?: SubscriptionPlatform;
    subscriptionProductId?: string;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: number;
    trialStartDate: number;
  };
}) {
  if (activeEntitlement) {
    return "active" as const;
  }

  return resolveStoredSubscriptionStatus({
    now,
    snapshot: {
      ...getStoredSubscriptionSnapshot(user),
      subscriptionExpiresAt: subscriptionExpiresAt ?? user.subscriptionExpiresAt,
      trialEndsAt: user.trialEndsAt ?? getTrialEndsAt(user.trialStartDate),
    },
  });
}

function buildSubscriptionPatch({
  activeEntitlement,
  now,
  revenueCatAppUserId,
  subscriptionExpiresAt,
  subscriptionPlatform,
  subscriptionProductId,
  user,
}: {
  activeEntitlement: boolean;
  now: number;
  revenueCatAppUserId?: string;
  subscriptionExpiresAt?: number;
  subscriptionPlatform?: SubscriptionPlatform;
  subscriptionProductId?: string;
  user: {
    _id: string;
    lastBillingSyncAt?: number;
    revenueCatAppUserId?: string;
    subscriptionExpiresAt?: number;
    subscriptionPlatform?: SubscriptionPlatform;
    subscriptionProductId?: string;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: number;
    trialStartDate: number;
  };
}) {
  const patch: {
    lastBillingSyncAt: number;
    revenueCatAppUserId: string;
    subscriptionExpiresAt?: number;
    subscriptionPlatform?: SubscriptionPlatform;
    subscriptionProductId?: string;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: number;
  } = {
    lastBillingSyncAt: now,
    revenueCatAppUserId:
      revenueCatAppUserId ?? user.revenueCatAppUserId ?? getDefaultRevenueCatAppUserId(user._id),
    subscriptionStatus: resolveNextSubscriptionStatus({
      activeEntitlement,
      now,
      subscriptionExpiresAt,
      user,
    }),
    trialEndsAt: user.trialEndsAt ?? getTrialEndsAt(user.trialStartDate),
  };

  if (subscriptionExpiresAt !== undefined) {
    patch.subscriptionExpiresAt = subscriptionExpiresAt;
  }

  if (subscriptionPlatform !== undefined) {
    patch.subscriptionPlatform = subscriptionPlatform;
  }

  if (subscriptionProductId !== undefined) {
    patch.subscriptionProductId = subscriptionProductId;
  }

  return patch;
}

export const syncCustomerInfo = mutation({
  args: {
    activeEntitlement: v.boolean(),
    revenueCatAppUserId: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
    subscriptionPlatform: v.optional(subscriptionPlatformValidator),
    subscriptionProductId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const patch = buildSubscriptionPatch({
      activeEntitlement: args.activeEntitlement,
      now: Date.now(),
      revenueCatAppUserId: args.revenueCatAppUserId,
      subscriptionExpiresAt: args.subscriptionExpiresAt,
      subscriptionPlatform: args.subscriptionPlatform,
      subscriptionProductId: args.subscriptionProductId,
      user,
    });

    await ctx.db.patch(user._id, patch);

    return normalizeSubscriptionSnapshot({
      ...getStoredSubscriptionSnapshot(user),
      ...patch,
    });
  },
});

export const applyRevenueCatWebhookEvent = internalMutation({
  args: {
    activeEntitlement: v.boolean(),
    candidateAppUserIds: v.array(v.string()),
    eventId: v.string(),
    eventType: v.string(),
    subscriptionExpiresAt: v.optional(v.number()),
    subscriptionPlatform: v.optional(subscriptionPlatformValidator),
    subscriptionProductId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query("revenueCatWebhookEvents")
      .withIndex("by_event_id", (query) => query.eq("eventId", args.eventId))
      .unique();

    if (existingEvent) {
      return { deduped: true, updated: false };
    }

    await ctx.db.insert("revenueCatWebhookEvents", {
      eventId: args.eventId,
      receivedAt: Date.now(),
      type: args.eventType,
    });

    let user = null;

    for (const candidateAppUserId of args.candidateAppUserIds) {
      user = await ctx.db
        .query("users")
        .withIndex("by_revenuecat_app_user_id", (query) =>
          query.eq("revenueCatAppUserId", candidateAppUserId)
        )
        .unique();

      if (user) {
        break;
      }
    }

    if (!user) {
      return { deduped: false, updated: false };
    }

    const patch = buildSubscriptionPatch({
      activeEntitlement: args.activeEntitlement,
      now: Date.now(),
      revenueCatAppUserId: user.revenueCatAppUserId,
      subscriptionExpiresAt: args.subscriptionExpiresAt,
      subscriptionPlatform: args.subscriptionPlatform,
      subscriptionProductId: args.subscriptionProductId,
      user,
    });

    await ctx.db.patch(user._id, patch);

    return { deduped: false, updated: true };
  },
});
