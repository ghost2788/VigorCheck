import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internalMutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { findCurrentUser, requireCurrentUser } from "./lib/devIdentity";
import { getLocalDateKey, getRelativeLocalDateKey } from "../lib/domain/dayWindow";

const RAW_EVENT_RETENTION_DAYS = 30;
const RAW_EVENT_PRUNE_BATCH_SIZE = 50;

const aiCallKindValidator = v.union(
  v.literal("photo_scan"),
  v.literal("supplement_scan"),
  v.literal("text_entry"),
  v.literal("drink_estimate")
);
const aiFeatureKindValidator = v.union(v.literal("photo_scan"), v.literal("text_ai"));
const aiResultStatusValidator = v.union(
  v.literal("completed"),
  v.literal("blocked_quota"),
  v.literal("provider_error"),
  v.literal("postprocess_error")
);
const aiUsageStateValidator = v.union(
  v.literal("present"),
  v.literal("missing"),
  v.literal("not_applicable")
);
const aiUsageLimitKindValidator = v.union(
  v.literal("trial_lifetime"),
  v.literal("calendar_month"),
  v.literal("daily_scan")
);

type DiagnosticsCallKind = "photo_scan" | "supplement_scan" | "text_entry" | "drink_estimate";
type DiagnosticsResultStatus =
  | "completed"
  | "blocked_quota"
  | "provider_error"
  | "postprocess_error";
type DiagnosticsUsageState = "present" | "missing" | "not_applicable";
type RollupDoc = Doc<"aiDailyDiagnosticsRollups">;

function getDiagnosticsTimeZone(user: Doc<"users">) {
  return user.aiQuotaTimeZone ?? user.timeZone;
}

async function getRollupDoc(
  ctx: QueryCtx | MutationCtx,
  args: {
    callKind: DiagnosticsCallKind;
    localDateKey: string;
    pricingVersion: string;
    userId: Id<"users">;
  }
) {
  return ctx.db
    .query("aiDailyDiagnosticsRollups")
    .withIndex("by_user_and_local_date_key_and_call_kind_and_pricing_version", (queryBuilder) =>
      queryBuilder
        .eq("userId", args.userId)
        .eq("localDateKey", args.localDateKey)
        .eq("callKind", args.callKind)
        .eq("pricingVersion", args.pricingVersion)
    )
    .unique();
}

function getBreakdownSeed(callKind: DiagnosticsCallKind) {
  return {
    blockedCount: 0,
    callKind,
    estimatedCostUsdMicros: 0,
    postprocessErrorCount: 0,
    requestCount: 0,
    usageMissingCount: 0,
  };
}

function buildRollupIncrements(args: {
  blockedLimitKind?: "trial_lifetime" | "calendar_month" | "daily_scan";
  cachedInputTokens?: number;
  estimatedCostUsdMicros?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  resultStatus: DiagnosticsResultStatus;
  totalTokens?: number;
  usageState: DiagnosticsUsageState;
}) {
  return {
    blockedCount: args.resultStatus === "blocked_quota" ? 1 : 0,
    cachedInputTokens: args.cachedInputTokens ?? 0,
    completedCount: args.resultStatus === "completed" ? 1 : 0,
    estimatedCostUsdMicros: args.estimatedCostUsdMicros ?? 0,
    inputTokens: args.inputTokens ?? 0,
    outputTokens: args.outputTokens ?? 0,
    postprocessErrorCount: args.resultStatus === "postprocess_error" ? 1 : 0,
    providerErrorCount: args.resultStatus === "provider_error" ? 1 : 0,
    reasoningTokens: args.reasoningTokens ?? 0,
    requestCount: 1,
    totalTokens: args.totalTokens ?? 0,
    usageMissingCount: args.usageState === "missing" ? 1 : 0,
  };
}

async function pruneExpiredEvents(
  ctx: MutationCtx,
  args: {
    cutoffCreatedAt: number;
    userId: Id<"users">;
  }
) {
  const expiredEvents = await ctx.db
    .query("aiRequestEvents")
    .withIndex("by_user_and_created_at", (queryBuilder) =>
      queryBuilder.eq("userId", args.userId).lt("createdAt", args.cutoffCreatedAt)
    )
    .take(RAW_EVENT_PRUNE_BATCH_SIZE);

  for (const event of expiredEvents) {
    await ctx.db.delete(event._id);
  }
}

export const recordRequest = internalMutation({
  args: {
    blockedLimitKind: v.optional(aiUsageLimitKindValidator),
    cachedInputTokens: v.optional(v.number()),
    callKind: aiCallKindValidator,
    completedAt: v.number(),
    createdAt: v.number(),
    estimatedCostUsdMicros: v.optional(v.number()),
    featureKind: aiFeatureKindValidator,
    inputTokens: v.optional(v.number()),
    model: v.string(),
    outputTokens: v.optional(v.number()),
    pricingVersion: v.string(),
    reasoningTokens: v.optional(v.number()),
    resultStatus: aiResultStatusValidator,
    totalTokens: v.optional(v.number()),
    usageState: aiUsageStateValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    const timeZone = getDiagnosticsTimeZone(user);
    const localDateKey = getLocalDateKey(args.completedAt, timeZone);

    await ctx.db.insert("aiRequestEvents", {
      blockedLimitKind: args.blockedLimitKind,
      cachedInputTokens: args.cachedInputTokens,
      callKind: args.callKind,
      completedAt: args.completedAt,
      createdAt: args.createdAt,
      estimatedCostUsdMicros: args.estimatedCostUsdMicros,
      featureKind: args.featureKind,
      inputTokens: args.inputTokens,
      model: args.model,
      outputTokens: args.outputTokens,
      pricingVersion: args.pricingVersion,
      reasoningTokens: args.reasoningTokens,
      resultStatus: args.resultStatus,
      totalTokens: args.totalTokens,
      usageState: args.usageState,
      userId: user._id,
    });

    const existingRollup = await getRollupDoc(ctx, {
      callKind: args.callKind,
      localDateKey,
      pricingVersion: args.pricingVersion,
      userId: user._id,
    });
    const increments = buildRollupIncrements(args);

    if (existingRollup) {
      await ctx.db.patch(existingRollup._id, {
        blockedCount: existingRollup.blockedCount + increments.blockedCount,
        cachedInputTokens: existingRollup.cachedInputTokens + increments.cachedInputTokens,
        completedCount: existingRollup.completedCount + increments.completedCount,
        estimatedCostUsdMicros:
          existingRollup.estimatedCostUsdMicros + increments.estimatedCostUsdMicros,
        inputTokens: existingRollup.inputTokens + increments.inputTokens,
        outputTokens: existingRollup.outputTokens + increments.outputTokens,
        postprocessErrorCount:
          existingRollup.postprocessErrorCount + increments.postprocessErrorCount,
        providerErrorCount: existingRollup.providerErrorCount + increments.providerErrorCount,
        reasoningTokens: existingRollup.reasoningTokens + increments.reasoningTokens,
        requestCount: existingRollup.requestCount + increments.requestCount,
        totalTokens: existingRollup.totalTokens + increments.totalTokens,
        updatedAt: now,
        usageMissingCount: existingRollup.usageMissingCount + increments.usageMissingCount,
      });
    } else {
      await ctx.db.insert("aiDailyDiagnosticsRollups", {
        ...increments,
        callKind: args.callKind,
        localDateKey,
        pricingVersion: args.pricingVersion,
        updatedAt: now,
        userId: user._id,
      });
    }

    await pruneExpiredEvents(ctx, {
      cutoffCreatedAt: now - RAW_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      userId: user._id,
    });
  },
});

export const currentUserDiagnostics = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const now = Date.now();
    const timeZone = getDiagnosticsTimeZone(user);
    const endDateKey = getLocalDateKey(now, timeZone);
    const startDateKey = getRelativeLocalDateKey({
      dayOffset: -29,
      timeZone,
      timestamp: now,
    });
    const rollups = ctx.db
      .query("aiDailyDiagnosticsRollups")
      .withIndex("by_user_and_local_date_key", (queryBuilder) =>
        queryBuilder.eq("userId", user._id).gte("localDateKey", startDateKey).lte("localDateKey", endDateKey)
      );
    const breakdownByKind: Record<DiagnosticsCallKind, ReturnType<typeof getBreakdownSeed>> = {
      drink_estimate: getBreakdownSeed("drink_estimate"),
      photo_scan: getBreakdownSeed("photo_scan"),
      supplement_scan: getBreakdownSeed("supplement_scan"),
      text_entry: getBreakdownSeed("text_entry"),
    };
    const totals = {
      blockedCount: 0,
      estimatedCostUsdMicros: 0,
      postprocessErrorCount: 0,
      requestCount: 0,
      usageMissingCount: 0,
    };

    for await (const rollup of rollups) {
      const breakdown = breakdownByKind[rollup.callKind];
      breakdown.blockedCount += rollup.blockedCount;
      breakdown.estimatedCostUsdMicros += rollup.estimatedCostUsdMicros;
      breakdown.postprocessErrorCount += rollup.postprocessErrorCount;
      breakdown.requestCount += rollup.requestCount;
      breakdown.usageMissingCount += rollup.usageMissingCount;

      totals.blockedCount += rollup.blockedCount;
      totals.estimatedCostUsdMicros += rollup.estimatedCostUsdMicros;
      totals.postprocessErrorCount += rollup.postprocessErrorCount;
      totals.requestCount += rollup.requestCount;
      totals.usageMissingCount += rollup.usageMissingCount;
    }

    const recentEvents = await ctx.db
      .query("aiRequestEvents")
      .withIndex("by_user_and_created_at", (queryBuilder) => queryBuilder.eq("userId", user._id))
      .order("desc")
      .take(5);

    return {
      breakdown: [
        breakdownByKind.photo_scan,
        breakdownByKind.supplement_scan,
        breakdownByKind.text_entry,
        breakdownByKind.drink_estimate,
      ],
      recentEvents: recentEvents.map((event) => ({
        callKind: event.callKind,
        completedAt: event.completedAt,
        estimatedCostUsdMicros: event.estimatedCostUsdMicros ?? null,
        model: event.model,
        resultStatus: event.resultStatus,
        totalTokens: event.totalTokens ?? null,
        usageState: event.usageState,
      })),
      totals,
      window: {
        endDateKey,
        startDateKey,
      },
    };
  },
});
