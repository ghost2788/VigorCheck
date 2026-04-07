import { v } from "convex/values";
import { createEmptyNutrition } from "../lib/domain/scan";
import {
  getDefaultHydrationShortcutMealType,
  resolveHydrationShortcutMealType,
} from "../lib/domain/hydrationShortcuts";
import { mutation, query, QueryCtx } from "./_generated/server";
import {
  createRememberedReplayId,
  upsertRememberedEntryFromReplaySources,
} from "./lib/rememberedEntries";
import { findCurrentUser, requireCurrentUser } from "./lib/devIdentity";
import {
  mealTypeValidator,
  nutritionValidator,
  rememberedShortcutCategoryValidator,
  rememberedShortcutLogModeValidator,
} from "./lib/validators";

function buildNutritionProfile(args: {
  calories: number;
  carbs: number;
  fat: number;
  nutritionProfile?: ReturnType<typeof createEmptyNutrition>;
  protein: number;
}) {
  const base = args.nutritionProfile ? { ...args.nutritionProfile } : createEmptyNutrition();

  base.calories = args.calories;
  base.protein = args.protein;
  base.carbs = args.carbs;
  base.fat = args.fat;

  return base;
}

export async function listHydrationShortcutsForCurrentUser(ctx: QueryCtx) {
  const user = await findCurrentUser(ctx);

  if (!user) {
    return [];
  }

  const shortcuts = await ctx.db
    .query("hydrationShortcuts")
    .withIndex("by_user", (query) => query.eq("userId", user._id))
    .collect();

  return [...shortcuts].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    if (left.lastUsedAt !== right.lastUsedAt) {
      return right.lastUsedAt - left.lastUsedAt;
    }

    return left.label.localeCompare(right.label);
  });
}

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => listHydrationShortcutsForCurrentUser(ctx),
});

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("hydrationShortcuts")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .take(1);

    if (existing.length > 0) {
      return { created: 0 };
    }

    const now = Date.now();

    await ctx.db.insert("hydrationShortcuts", {
      calories: 0,
      carbs: 0,
      category: "water",
      defaultAmountOz: 8,
      fat: 0,
      label: "Water 8 oz",
      lastUsedAt: now,
      logMode: "hydration_only",
      mealType: getDefaultHydrationShortcutMealType(),
      pinned: true,
      protein: 0,
      userId: user._id,
    });

    await ctx.db.insert("hydrationShortcuts", {
      calories: 0,
      carbs: 0,
      category: "water",
      defaultAmountOz: 16,
      fat: 0,
      label: "Water 16 oz",
      lastUsedAt: now - 1,
      logMode: "hydration_only",
      mealType: getDefaultHydrationShortcutMealType(),
      pinned: true,
      protein: 0,
      userId: user._id,
    });

    return { created: 2 };
  },
});

export const createShortcut = mutation({
  args: {
    calories: v.number(),
    carbs: v.number(),
    category: rememberedShortcutCategoryValidator,
    defaultAmountOz: v.number(),
    fat: v.number(),
    label: v.string(),
    logMode: rememberedShortcutLogModeValidator,
    mealType: v.optional(mealTypeValidator),
    nutritionProfile: v.optional(nutritionValidator),
    protein: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const now = Date.now();
    const nutritionProfile =
      args.logMode === "hydration_and_nutrition"
        ? buildNutritionProfile({
            calories: args.calories,
            carbs: args.carbs,
            fat: args.fat,
            nutritionProfile: args.nutritionProfile,
            protein: args.protein,
          })
        : undefined;

    const shortcutId = await ctx.db.insert("hydrationShortcuts", {
      calories: args.calories,
      carbs: args.carbs,
      category: args.category,
      defaultAmountOz: Math.max(1, Math.round(args.defaultAmountOz)),
      fat: args.fat,
      label: args.label.trim(),
      lastUsedAt: now,
      logMode: args.logMode,
      mealType: resolveHydrationShortcutMealType(args.mealType),
      nutritionProfile,
      pinned: true,
      protein: args.protein,
      userId: user._id,
    });

    return { shortcutId };
  },
});

export const togglePinned = mutation({
  args: {
    shortcutId: v.id("hydrationShortcuts"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const shortcut = await ctx.db.get(args.shortcutId);

    if (!shortcut || shortcut.userId !== user._id) {
      throw new Error("Shortcut not found.");
    }

    await ctx.db.patch(args.shortcutId, {
      pinned: !shortcut.pinned,
    });

    return { pinned: !shortcut.pinned };
  },
});

export const logShortcut = mutation({
  args: {
    shortcutId: v.id("hydrationShortcuts"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const shortcut = await ctx.db.get(args.shortcutId);

    if (!shortcut || shortcut.userId !== user._id) {
      throw new Error("Shortcut not found.");
    }

    const timestamp = Date.now();
    const amountOz = Math.max(1, Math.round(shortcut.defaultAmountOz));
    const rememberedReplayId = createRememberedReplayId();
    const nutrition = buildNutritionProfile({
      calories: shortcut.calories,
      carbs: shortcut.carbs,
      fat: shortcut.fat,
      nutritionProfile: shortcut.nutritionProfile as ReturnType<typeof createEmptyNutrition> | undefined,
      protein: shortcut.protein,
    });

    const hydrationLogId = await ctx.db.insert("hydrationLogs", {
      amountOz,
      rememberedEntryId: undefined,
      rememberedReplayId,
      shortcutId: shortcut._id,
      shortcutLabel: shortcut.label,
      timestamp,
      userId: user._id,
    });

    await ctx.db.patch(shortcut._id, {
      lastUsedAt: timestamp,
    });

    if (shortcut.logMode === "hydration_only") {
      return { hydrationLogId, mealId: undefined };
    }

    const mealId = await ctx.db.insert("meals", {
      aiConfidence: undefined,
      b12: nutrition.b12,
      b6: nutrition.b6,
      calcium: nutrition.calcium,
      choline: nutrition.choline,
      copper: nutrition.copper,
      entryMethod: "saved_meal",
      folate: nutrition.folate,
      iron: nutrition.iron,
      label: shortcut.label,
      magnesium: nutrition.magnesium,
      manganese: nutrition.manganese,
      mealType: resolveHydrationShortcutMealType(shortcut.mealType),
      niacin: nutrition.niacin,
      omega3: nutrition.omega3,
      phosphorus: nutrition.phosphorus,
      photoStorageId: undefined,
      potassium: nutrition.potassium,
      rememberedEntryId: undefined,
      rememberedReplayId,
      riboflavin: nutrition.riboflavin,
      thiamin: nutrition.thiamin,
      timestamp,
      totalCalories: nutrition.calories,
      totalCarbs: nutrition.carbs,
      totalFat: nutrition.fat,
      totalFiber: nutrition.fiber,
      totalProtein: nutrition.protein,
      totalSodium: nutrition.sodium,
      totalSugar: nutrition.sugar,
      userId: user._id,
      selenium: nutrition.selenium,
      vitaminA: nutrition.vitaminA,
      vitaminC: nutrition.vitaminC,
      vitaminD: nutrition.vitaminD,
      vitaminE: nutrition.vitaminE,
      vitaminK: nutrition.vitaminK,
      zinc: nutrition.zinc,
    });

    await ctx.db.insert("mealItems", {
      b12: nutrition.b12,
      b6: nutrition.b6,
      calcium: nutrition.calcium,
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      choline: nutrition.choline,
      confidence: undefined,
      copper: nutrition.copper,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      folate: nutrition.folate,
      foodName: shortcut.label,
      iron: nutrition.iron,
      magnesium: nutrition.magnesium,
      mealId,
      manganese: nutrition.manganese,
      niacin: nutrition.niacin,
      omega3: nutrition.omega3,
      phosphorus: nutrition.phosphorus,
      portionSize: amountOz,
      portionUnit: "oz",
      potassium: nutrition.potassium,
      prepMethod: undefined,
      protein: nutrition.protein,
      riboflavin: nutrition.riboflavin,
      selenium: nutrition.selenium,
      sodium: nutrition.sodium,
      source: "manual",
      sugar: nutrition.sugar,
      thiamin: nutrition.thiamin,
      usdaFoodId: undefined,
      vitaminA: nutrition.vitaminA,
      vitaminC: nutrition.vitaminC,
      vitaminD: nutrition.vitaminD,
      vitaminE: nutrition.vitaminE,
      vitaminK: nutrition.vitaminK,
      zinc: nutrition.zinc,
    });

    await upsertRememberedEntryFromReplaySources(ctx, {
      hydrationLogId,
      mealId,
      replayId: rememberedReplayId,
    });

    return { hydrationLogId, mealId };
  },
});
