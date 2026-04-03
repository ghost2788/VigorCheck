import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/devIdentity";

async function getOwnedHydrationLog(
  ctx: MutationCtx | QueryCtx,
  logId: Id<"hydrationLogs">
) {
  const user = await requireCurrentUser(ctx);
  const hydrationLog = await ctx.db.get(logId);

  if (!hydrationLog || hydrationLog.userId !== user._id) {
    throw new Error("Hydration log not found.");
  }

  return { hydrationLog, user };
}

export const getForEdit = query({
  args: {
    logId: v.id("hydrationLogs"),
  },
  handler: async (ctx, args) => {
    const { hydrationLog, user } = await getOwnedHydrationLog(ctx, args.logId);

    return {
      amountOz: hydrationLog.amountOz,
      id: hydrationLog._id,
      shortcutLabel: hydrationLog.shortcutLabel,
      timeZone: user.timeZone,
      timestamp: hydrationLog.timestamp,
    };
  },
});

export const logQuickAdd = mutation({
  args: {
    amountOz: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const amountOz = Math.max(0, Math.round(args.amountOz));

    if (amountOz <= 0) {
      throw new Error("Hydration amount must be greater than zero.");
    }

    const hydrationLogId = await ctx.db.insert("hydrationLogs", {
      amountOz,
      timestamp: Date.now(),
      userId: user._id,
    });

    return { hydrationLogId };
  },
});

export const updateLog = mutation({
  args: {
    amountOz: v.number(),
    logId: v.id("hydrationLogs"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { hydrationLog } = await getOwnedHydrationLog(ctx, args.logId);
    const amountOz = Math.max(0, Math.round(args.amountOz));

    if (amountOz <= 0) {
      throw new Error("Hydration amount must be greater than zero.");
    }

    await ctx.db.patch(hydrationLog._id, {
      amountOz,
      timestamp: args.timestamp,
    });

    return { hydrationLogId: hydrationLog._id };
  },
});

export const deleteLog = mutation({
  args: {
    logId: v.id("hydrationLogs"),
  },
  handler: async (ctx, args) => {
    const { hydrationLog } = await getOwnedHydrationLog(ctx, args.logId);

    await ctx.db.delete(hydrationLog._id);

    return { deleted: true };
  },
});
