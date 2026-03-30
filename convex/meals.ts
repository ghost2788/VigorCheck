import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";
import { createEmptyNutrition } from "../lib/domain/scan";
import { requireCurrentUser } from "./lib/devIdentity";
import { aiEntryMethodValidator, mealTypeValidator, savedScanItemValidator } from "./lib/validators";

const micronutrients = {
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminK: 0,
  b6: 0,
  b12: 0,
  folate: 0,
  thiamin: 0,
  niacin: 0,
  riboflavin: 0,
  calcium: 0,
  iron: 0,
  potassium: 0,
  magnesium: 0,
  zinc: 0,
  phosphorus: 0,
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sumMealTotals(
  items: Array<{
    nutrition: {
      b12: number;
      b6: number;
      calcium: number;
      calories: number;
      carbs: number;
      fat: number;
      fiber: number;
      folate: number;
      iron: number;
      magnesium: number;
      niacin: number;
      phosphorus: number;
      potassium: number;
      protein: number;
      riboflavin: number;
      sodium: number;
      sugar: number;
      thiamin: number;
      vitaminA: number;
      vitaminC: number;
      vitaminD: number;
      vitaminE: number;
      vitaminK: number;
      zinc: number;
    };
  }>
) {
  return items.reduce(
    (totals, item) => ({
      b12: totals.b12 + item.nutrition.b12,
      b6: totals.b6 + item.nutrition.b6,
      calcium: totals.calcium + item.nutrition.calcium,
      calories: totals.calories + item.nutrition.calories,
      carbs: totals.carbs + item.nutrition.carbs,
      fat: totals.fat + item.nutrition.fat,
      fiber: totals.fiber + item.nutrition.fiber,
      folate: totals.folate + item.nutrition.folate,
      iron: totals.iron + item.nutrition.iron,
      magnesium: totals.magnesium + item.nutrition.magnesium,
      niacin: totals.niacin + item.nutrition.niacin,
      phosphorus: totals.phosphorus + item.nutrition.phosphorus,
      potassium: totals.potassium + item.nutrition.potassium,
      protein: totals.protein + item.nutrition.protein,
      riboflavin: totals.riboflavin + item.nutrition.riboflavin,
      sodium: totals.sodium + item.nutrition.sodium,
      sugar: totals.sugar + item.nutrition.sugar,
      thiamin: totals.thiamin + item.nutrition.thiamin,
      vitaminA: totals.vitaminA + item.nutrition.vitaminA,
      vitaminC: totals.vitaminC + item.nutrition.vitaminC,
      vitaminD: totals.vitaminD + item.nutrition.vitaminD,
      vitaminE: totals.vitaminE + item.nutrition.vitaminE,
      vitaminK: totals.vitaminK + item.nutrition.vitaminK,
      zinc: totals.zinc + item.nutrition.zinc,
    }),
    createEmptyNutrition()
  );
}

type SavedAiItem = {
  confidence: "high" | "medium" | "low";
  estimatedGrams: number;
  name: string;
  nutrition: ReturnType<typeof createEmptyNutrition>;
  portionLabel: string;
  prepMethod?: string;
  source: "ai_estimated" | "manual" | "usda";
  usdaFoodId?: string;
};

async function insertAiMeal(
  ctx: MutationCtx,
  args: {
    entryMethod: "ai_text" | "photo_scan";
    items: SavedAiItem[];
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    overallConfidence: "high" | "medium" | "low";
    photoStorageId?: Id<"_storage">;
  }
) {
  const user = await requireCurrentUser(ctx);

  if (!args.items.length) {
    throw new Error("At least one reviewed item is required before saving this meal.");
  }

  if (args.entryMethod === "photo_scan" && !args.photoStorageId) {
    throw new Error("Photo scans require a stored photo before saving.");
  }

  const totals = sumMealTotals(args.items);
  const timestamp = Date.now();
  const label =
    args.items.length === 1
      ? args.items[0].name
      : `${capitalize(args.mealType)} ${args.entryMethod === "photo_scan" ? "scan" : "text"} (${args.items.length} items)`;
  const mealId = await ctx.db.insert("meals", {
    aiConfidence: args.overallConfidence,
    entryMethod: args.entryMethod,
    label,
    mealType: args.mealType,
    photoStorageId: args.photoStorageId,
    timestamp,
    totalCalories: totals.calories,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    totalFiber: totals.fiber,
    totalProtein: totals.protein,
    totalSodium: totals.sodium,
    totalSugar: totals.sugar,
    userId: user._id,
    vitaminA: totals.vitaminA,
    vitaminC: totals.vitaminC,
    vitaminD: totals.vitaminD,
    vitaminE: totals.vitaminE,
    vitaminK: totals.vitaminK,
    b6: totals.b6,
    b12: totals.b12,
    folate: totals.folate,
    thiamin: totals.thiamin,
    niacin: totals.niacin,
    riboflavin: totals.riboflavin,
    calcium: totals.calcium,
    iron: totals.iron,
    potassium: totals.potassium,
    magnesium: totals.magnesium,
    zinc: totals.zinc,
    phosphorus: totals.phosphorus,
  });

  for (const item of args.items) {
    await ctx.db.insert("mealItems", {
      calories: item.nutrition.calories,
      carbs: item.nutrition.carbs,
      confidence: item.confidence,
      fat: item.nutrition.fat,
      fiber: item.nutrition.fiber,
      foodName: item.name,
      mealId,
      portionSize: item.estimatedGrams,
      portionUnit: "g",
      prepMethod: item.prepMethod,
      protein: item.nutrition.protein,
      sodium: item.nutrition.sodium,
      source: item.source,
      sugar: item.nutrition.sugar,
      usdaFoodId: item.usdaFoodId,
      vitaminA: item.nutrition.vitaminA,
      vitaminC: item.nutrition.vitaminC,
      vitaminD: item.nutrition.vitaminD,
      vitaminE: item.nutrition.vitaminE,
      vitaminK: item.nutrition.vitaminK,
      b6: item.nutrition.b6,
      b12: item.nutrition.b12,
      folate: item.nutrition.folate,
      thiamin: item.nutrition.thiamin,
      niacin: item.nutrition.niacin,
      riboflavin: item.nutrition.riboflavin,
      calcium: item.nutrition.calcium,
      iron: item.nutrition.iron,
      potassium: item.nutrition.potassium,
      magnesium: item.nutrition.magnesium,
      zinc: item.nutrition.zinc,
      phosphorus: item.nutrition.phosphorus,
    });
  }

  return { mealId };
}

export const logManual = mutation({
  args: {
    calories: v.number(),
    carbs: v.number(),
    fat: v.number(),
    mealType: mealTypeValidator,
    name: v.optional(v.string()),
    protein: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const timestamp = Date.now();
    const label = args.name?.trim() || undefined;
    const foodName = label || `${capitalize(args.mealType)} quick add`;
    const mealId = await ctx.db.insert("meals", {
      aiConfidence: undefined,
      entryMethod: "manual",
      label,
      mealType: args.mealType,
      photoStorageId: undefined,
      timestamp,
      totalCalories: args.calories,
      totalCarbs: args.carbs,
      totalFat: args.fat,
      totalFiber: 0,
      totalProtein: args.protein,
      totalSodium: 0,
      totalSugar: 0,
      userId: user._id,
      ...micronutrients,
    });

    await ctx.db.insert("mealItems", {
      calories: args.calories,
      carbs: args.carbs,
      confidence: undefined,
      fat: args.fat,
      fiber: 0,
      foodName,
      mealId,
      portionSize: 1,
      portionUnit: "serving",
      prepMethod: undefined,
      protein: args.protein,
      sodium: 0,
      source: "manual",
      sugar: 0,
      usdaFoodId: undefined,
      ...micronutrients,
    });

    return { mealId };
  },
});

export const saveScanned = mutation({
  args: {
    items: v.array(savedScanItemValidator),
    mealType: mealTypeValidator,
    overallConfidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    photoStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return insertAiMeal(ctx, {
      entryMethod: "photo_scan",
      items: args.items,
      mealType: args.mealType,
      overallConfidence: args.overallConfidence,
      photoStorageId: args.photoStorageId,
    });
  },
});

export const saveAiEntry = mutation({
  args: {
    entryMethod: aiEntryMethodValidator,
    items: v.array(savedScanItemValidator),
    mealType: mealTypeValidator,
    overallConfidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) =>
    insertAiMeal(ctx, {
      entryMethod: args.entryMethod,
      items: args.items,
      mealType: args.mealType,
      overallConfidence: args.overallConfidence,
      photoStorageId: args.photoStorageId,
    }),
});
