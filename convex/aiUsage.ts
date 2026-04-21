import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, MutationCtx, query, QueryCtx } from "./_generated/server";
import {
  AiUsageFeatureKind,
  AiUsageLimitKind,
  buildAiUsageBlockedMessage,
  buildAiUsageBucket,
  buildCalendarMonthWindowKey,
  buildTrialLifetimeWindowKey,
  getPrimaryAiUsageLimit,
  getPrimaryAiUsageLimitKind,
  pickPrimaryPhotoBucket,
} from "../lib/domain/aiUsage";
import { getLocalDateKey } from "../lib/domain/dayWindow";
import { normalizeSubscriptionSnapshot } from "../lib/domain/subscription";
import { findCurrentUser, requireCurrentUser } from "./lib/devIdentity";

const aiUsageFeatureKindValidator = v.union(v.literal("photo_scan"), v.literal("text_ai"));
const aiUsageLimitKindValidator = v.union(
  v.literal("calendar_month"),
  v.literal("daily_scan"),
  v.literal("trial_lifetime")
);

type CounterDoc = Doc<"aiUsageCounters">;

type NormalizedUsageContext = {
  accessStatus: "active" | "expired" | "trial";
  featureKind: AiUsageFeatureKind;
  periodBucket: ReturnType<typeof buildAiUsageBucket>;
  periodLimitKind: Exclude<AiUsageLimitKind, "daily_scan">;
  periodResetLabel: string;
  periodWindowKey: string;
  quotaTimeZone: string;
  trialStartDate: number;
  userId: Id<"users">;
  dailyBucket?: ReturnType<typeof buildAiUsageBucket>;
  dailyWindowKey?: string;
};

function getQuotaTimeZone(user: Doc<"users">) {
  return user.aiQuotaTimeZone ?? user.timeZone;
}

async function getCounterDoc(
  ctx: QueryCtx | MutationCtx,
  args: {
    userId: Id<"users">;
    windowKey: string;
    windowKind: AiUsageLimitKind;
  }
) {
  return ctx.db
    .query("aiUsageCounters")
    .withIndex("by_user_id_and_window_kind_and_window_key", (queryBuilder) =>
      queryBuilder
        .eq("userId", args.userId)
        .eq("windowKind", args.windowKind)
        .eq("windowKey", args.windowKey)
    )
    .unique();
}

function getUsageCount(counter: CounterDoc | null, featureKind: AiUsageFeatureKind) {
  if (!counter) {
    return 0;
  }

  return featureKind === "photo_scan" ? counter.photoScanCount : counter.textEntryCount;
}

function getPeriodLabel(status: "active" | "expired" | "trial") {
  return status === "trial" ? "Trial total" : "This month";
}

function getPeriodResetLabel(status: "active" | "expired" | "trial") {
  return status === "trial" ? "Trial total" : "Resets next month";
}

function getPeriodWindowKey({
  quotaTimeZone,
  status,
  trialStartDate,
}: {
  quotaTimeZone: string;
  status: "active" | "expired" | "trial";
  trialStartDate: number;
}) {
  if (status === "trial") {
    return buildTrialLifetimeWindowKey(trialStartDate);
  }

  return buildCalendarMonthWindowKey(Date.now(), quotaTimeZone);
}

async function buildUsageContext(
  ctx: QueryCtx | MutationCtx,
  featureKind: AiUsageFeatureKind,
  user: Doc<"users">
): Promise<NormalizedUsageContext> {
  const subscription = normalizeSubscriptionSnapshot({
    lastBillingSyncAt: user.lastBillingSyncAt,
    revenueCatAppUserId: user.revenueCatAppUserId,
    status: user.subscriptionStatus,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    subscriptionPlatform: user.subscriptionPlatform,
    subscriptionProductId: user.subscriptionProductId,
    trialEndsAt: user.trialEndsAt,
    trialStartDate: user.trialStartDate,
  });
  const accessStatus = subscription.status;
  const quotaTimeZone = getQuotaTimeZone(user);
  const periodLimitKind = getPrimaryAiUsageLimitKind(accessStatus);
  const periodWindowKey = getPeriodWindowKey({
    quotaTimeZone,
    status: accessStatus,
    trialStartDate: user.trialStartDate,
  });
  const periodCounter = await getCounterDoc(ctx, {
    userId: user._id,
    windowKey: periodWindowKey,
    windowKind: periodLimitKind,
  });
  const periodBucket = buildAiUsageBucket({
    label: getPeriodLabel(accessStatus),
    limit: getPrimaryAiUsageLimit(accessStatus, featureKind),
    used: getUsageCount(periodCounter, featureKind),
  });

  if (featureKind !== "photo_scan") {
    return {
      accessStatus,
      featureKind,
      periodBucket,
      periodLimitKind,
      periodResetLabel: getPeriodResetLabel(accessStatus),
      periodWindowKey,
      quotaTimeZone,
      trialStartDate: user.trialStartDate,
      userId: user._id,
    };
  }

  const dailyWindowKey = getLocalDateKey(Date.now(), quotaTimeZone);
  const dailyCounter = await getCounterDoc(ctx, {
    userId: user._id,
    windowKey: dailyWindowKey,
    windowKind: "daily_scan",
  });
  const dailyBucket = buildAiUsageBucket({
    label: "Today",
    limit: 12,
    used: getUsageCount(dailyCounter, featureKind),
  });

  return {
    accessStatus,
    dailyBucket,
    dailyWindowKey,
    featureKind,
    periodBucket,
    periodLimitKind,
    periodResetLabel: getPeriodResetLabel(accessStatus),
    periodWindowKey,
    quotaTimeZone,
    trialStartDate: user.trialStartDate,
    userId: user._id,
  };
}

function buildGateResult(context: NormalizedUsageContext) {
  if (context.accessStatus === "expired") {
    return {
      allowed: false,
      blockingLimitKind: context.periodLimitKind,
      message: buildAiUsageBlockedMessage({
        accessStatus: context.accessStatus,
        featureKind: context.featureKind,
        limitKind: context.periodLimitKind,
      }),
      quotaTimeZone: context.quotaTimeZone,
    } as const;
  }

  if (context.featureKind === "photo_scan" && context.dailyBucket?.isBlocked) {
    return {
      allowed: false,
      blockingLimitKind: "daily_scan" as const,
      message: buildAiUsageBlockedMessage({
        accessStatus: context.accessStatus,
        featureKind: context.featureKind,
        limitKind: "daily_scan",
      }),
      quotaTimeZone: context.quotaTimeZone,
    };
  }

  if (context.periodBucket.isBlocked) {
    return {
      allowed: false,
      blockingLimitKind: context.periodLimitKind,
      message: buildAiUsageBlockedMessage({
        accessStatus: context.accessStatus,
        featureKind: context.featureKind,
        limitKind: context.periodLimitKind,
      }),
      quotaTimeZone: context.quotaTimeZone,
    };
  }

  return {
    allowed: true,
    blockingLimitKind: null,
    message: null,
    quotaTimeZone: context.quotaTimeZone,
  } as const;
}

async function incrementCounter(
  ctx: MutationCtx,
  args: {
    featureKind: AiUsageFeatureKind;
    userId: Id<"users">;
    windowKey: string;
    windowKind: AiUsageLimitKind;
  }
) {
  const existing = await getCounterDoc(ctx, {
    userId: args.userId,
    windowKey: args.windowKey,
    windowKind: args.windowKind,
  });
  const now = Date.now();

  if (!existing) {
    await ctx.db.insert("aiUsageCounters", {
      photoScanCount: args.featureKind === "photo_scan" ? 1 : 0,
      textEntryCount: args.featureKind === "text_ai" ? 1 : 0,
      updatedAt: now,
      userId: args.userId,
      windowKey: args.windowKey,
      windowKind: args.windowKind,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    photoScanCount:
      existing.photoScanCount + (args.featureKind === "photo_scan" ? 1 : 0),
    textEntryCount:
      existing.textEntryCount + (args.featureKind === "text_ai" ? 1 : 0),
    updatedAt: now,
  });
}

export const precheck = internalQuery({
  args: {
    featureKind: aiUsageFeatureKindValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const usageContext = await buildUsageContext(ctx, args.featureKind, user);
    return buildGateResult(usageContext);
  },
});

export const reserve = internalMutation({
  args: {
    featureKind: aiUsageFeatureKindValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const usageContext = await buildUsageContext(ctx, args.featureKind, user);
    const gateResult = buildGateResult(usageContext);

    if (!gateResult.allowed) {
      return gateResult;
    }

    if (!user.aiQuotaTimeZone) {
      await ctx.db.patch(user._id, {
        aiQuotaTimeZone: usageContext.quotaTimeZone,
      });
    }

    await incrementCounter(ctx, {
      featureKind: args.featureKind,
      userId: user._id,
      windowKey: usageContext.periodWindowKey,
      windowKind: usageContext.periodLimitKind,
    });

    if (args.featureKind === "photo_scan" && usageContext.dailyWindowKey) {
      await incrementCounter(ctx, {
        featureKind: args.featureKind,
        userId: user._id,
        windowKey: usageContext.dailyWindowKey,
        windowKind: "daily_scan",
      });
    }

    return gateResult;
  },
});

export const currentStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const photoContext = await buildUsageContext(ctx, "photo_scan", user);
    const textContext = await buildUsageContext(ctx, "text_ai", user);

    if (photoContext.accessStatus === "expired" || textContext.accessStatus === "expired") {
      return null;
    }

    const primaryPhotoBucket = pickPrimaryPhotoBucket({
      daily: photoContext.dailyBucket!,
      primary: photoContext.periodBucket,
    });

    return {
      photo: {
        daily: photoContext.dailyBucket!,
        isWarning:
          photoContext.periodBucket.isWarning || Boolean(photoContext.dailyBucket?.isWarning),
        period: {
          ...photoContext.periodBucket,
          resetLabel: photoContext.periodResetLabel,
        },
        primaryBucketLabel: primaryPhotoBucket.label,
      },
      status: photoContext.accessStatus,
      text: {
        isWarning: textContext.periodBucket.isWarning,
        period: {
          ...textContext.periodBucket,
          resetLabel: textContext.periodResetLabel,
        },
      },
    };
  },
});
