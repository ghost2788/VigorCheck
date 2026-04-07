import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findCurrentUser, requireCurrentUser } from "./lib/devIdentity";
import {
  buildRememberedEntryListItem,
  migrateLegacyHydrationShortcuts,
  replayRememberedEntry,
} from "./lib/rememberedEntries";

export const listForCurrentUser = query({
  args: {
    favoriteLimit: v.number(),
    recentLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return {
        favorites: [],
        favoritesHasMore: false,
        recent: [],
        recentHasMore: false,
      };
    }

    const favoriteRows = await ctx.db
      .query("rememberedEntries")
      .withIndex("by_user_and_favorited_and_last_used_at", (queryBuilder) =>
        queryBuilder.eq("userId", user._id).eq("favorited", true)
      )
      .order("desc")
      .take(args.favoriteLimit + 1);
    const recentRows = await ctx.db
      .query("rememberedEntries")
      .withIndex("by_user_and_favorited_and_last_used_at", (queryBuilder) =>
        queryBuilder.eq("userId", user._id).eq("favorited", false)
      )
      .order("desc")
      .take(args.recentLimit + 1);

    return {
      favorites: favoriteRows.slice(0, args.favoriteLimit).map(buildRememberedEntryListItem),
      favoritesHasMore: favoriteRows.length > args.favoriteLimit,
      recent: recentRows.slice(0, args.recentLimit).map(buildRememberedEntryListItem),
      recentHasMore: recentRows.length > args.recentLimit,
    };
  },
});

export const toggleFavorite = mutation({
  args: {
    rememberedEntryId: v.id("rememberedEntries"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const rememberedEntry = await ctx.db.get(args.rememberedEntryId);

    if (!rememberedEntry || rememberedEntry.userId !== user._id) {
      throw new Error("Remembered entry not found.");
    }

    await ctx.db.patch(rememberedEntry._id, {
      favorited: !rememberedEntry.favorited,
    });

    return { favorited: !rememberedEntry.favorited };
  },
});

export const logRememberedEntry = mutation({
  args: {
    rememberedEntryId: v.id("rememberedEntries"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const rememberedEntry = await ctx.db.get(args.rememberedEntryId);

    if (!rememberedEntry || rememberedEntry.userId !== user._id) {
      throw new Error("Remembered entry not found.");
    }

    return replayRememberedEntry(ctx, rememberedEntry);
  },
});

export const ensureMigrated = mutation({
  args: {},
  handler: async (ctx) => {
    return migrateLegacyHydrationShortcuts(ctx);
  },
});
