import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireCurrentUser } from "./lib/devIdentity";

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
