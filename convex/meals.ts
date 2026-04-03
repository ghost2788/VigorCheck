import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";
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

function buildManualFoodName({
  mealType,
  name,
}: {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name?: string;
}) {
  return name?.trim() || `${capitalize(mealType)} quick add`;
}

function buildAiMealLabel({
  entryMethod,
  items,
  label,
  mealType,
}: {
  entryMethod: "ai_text" | "photo_scan" | "barcode";
  items: SavedAiItem[];
  label?: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}) {
  if (label?.trim()) {
    return label.trim();
  }

  return items.length === 1
    ? items[0].name
    : `${capitalize(mealType)} ${entryMethod === "photo_scan" ? "scan" : entryMethod === "ai_text" ? "text" : "barcode"} (${items.length} items)`;
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
  barcodeValue?: string;
  confidence: "high" | "medium" | "low";
  estimatedGrams: number;
  name: string;
  nutrition: ReturnType<typeof createEmptyNutrition>;
  portionLabel: string;
  prepMethod?: string;
  source: "ai_estimated" | "manual" | "usda" | "barcode_catalog";
  usdaFoodId?: string;
};

async function insertAiMeal(
  ctx: MutationCtx,
  args: {
    entryMethod: "ai_text" | "photo_scan" | "barcode";
    items: SavedAiItem[];
    label?: string;
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
  const label = buildAiMealLabel({
    entryMethod: args.entryMethod,
    items: args.items,
    label: args.label,
    mealType: args.mealType,
  });
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
      b12: item.nutrition.b12,
      b6: item.nutrition.b6,
      barcodeValue: item.barcodeValue,
      calcium: item.nutrition.calcium,
      calories: item.nutrition.calories,
      carbs: item.nutrition.carbs,
      confidence: item.confidence,
      fat: item.nutrition.fat,
      fiber: item.nutrition.fiber,
      folate: item.nutrition.folate,
      foodName: item.name,
      iron: item.nutrition.iron,
      magnesium: item.nutrition.magnesium,
      mealId,
      niacin: item.nutrition.niacin,
      phosphorus: item.nutrition.phosphorus,
      portionSize: item.estimatedGrams,
      portionUnit: "g",
      potassium: item.nutrition.potassium,
      prepMethod: item.prepMethod,
      protein: item.nutrition.protein,
      riboflavin: item.nutrition.riboflavin,
      sodium: item.nutrition.sodium,
      source: item.source,
      sugar: item.nutrition.sugar,
      thiamin: item.nutrition.thiamin,
      usdaFoodId: item.usdaFoodId,
      vitaminA: item.nutrition.vitaminA,
      vitaminC: item.nutrition.vitaminC,
      vitaminD: item.nutrition.vitaminD,
      vitaminE: item.nutrition.vitaminE,
      vitaminK: item.nutrition.vitaminK,
      zinc: item.nutrition.zinc,
    });
  }

  return { mealId };
}

async function getOwnedMeal(
  ctx: MutationCtx | QueryCtx,
  mealId: Id<"meals">
) {
  const user = await requireCurrentUser(ctx);
  const meal = await ctx.db.get(mealId);

  if (!meal || meal.userId !== user._id) {
    throw new Error("Meal not found.");
  }

  return { meal, user };
}

async function loadMealItems(
  ctx: MutationCtx | QueryCtx,
  mealId: Id<"meals">
) {
  return ctx.db
    .query("mealItems")
    .withIndex("by_meal", (queryBuilder) => queryBuilder.eq("mealId", mealId))
    .collect();
}

async function replaceMealItems(
  ctx: MutationCtx,
  {
    items,
    mealId,
  }: {
    items: SavedAiItem[];
    mealId: Id<"meals">;
  }
) {
  const existingItems = await loadMealItems(ctx, mealId);

  for (const item of existingItems) {
    await ctx.db.delete(item._id);
  }

  for (const item of items) {
    await ctx.db.insert("mealItems", {
      b12: item.nutrition.b12,
      b6: item.nutrition.b6,
      barcodeValue: item.barcodeValue,
      calcium: item.nutrition.calcium,
      calories: item.nutrition.calories,
      carbs: item.nutrition.carbs,
      confidence: item.confidence,
      fat: item.nutrition.fat,
      fiber: item.nutrition.fiber,
      folate: item.nutrition.folate,
      foodName: item.name,
      iron: item.nutrition.iron,
      magnesium: item.nutrition.magnesium,
      mealId,
      niacin: item.nutrition.niacin,
      phosphorus: item.nutrition.phosphorus,
      portionSize: item.estimatedGrams,
      portionUnit: "g",
      potassium: item.nutrition.potassium,
      prepMethod: item.prepMethod,
      protein: item.nutrition.protein,
      riboflavin: item.nutrition.riboflavin,
      sodium: item.nutrition.sodium,
      source: item.source,
      sugar: item.nutrition.sugar,
      thiamin: item.nutrition.thiamin,
      usdaFoodId: item.usdaFoodId,
      vitaminA: item.nutrition.vitaminA,
      vitaminC: item.nutrition.vitaminC,
      vitaminD: item.nutrition.vitaminD,
      vitaminE: item.nutrition.vitaminE,
      vitaminK: item.nutrition.vitaminK,
      zinc: item.nutrition.zinc,
    });
  }
}

export const getForEdit = query({
  args: {
    mealId: v.id("meals"),
  },
  handler: async (ctx, args) => {
    const { meal, user } = await getOwnedMeal(ctx, args.mealId);
    const items = await loadMealItems(ctx, meal._id);

    return {
      items: items.map((item) => ({
        confidence: item.confidence,
        estimatedGrams: item.portionUnit === "g" ? item.portionSize : 100,
        foodName: item.foodName,
        id: item._id,
        nutrition: {
          b12: item.b12,
          b6: item.b6,
          calcium: item.calcium,
          calories: item.calories,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          folate: item.folate,
          iron: item.iron,
          magnesium: item.magnesium,
          niacin: item.niacin,
          phosphorus: item.phosphorus,
          potassium: item.potassium,
          protein: item.protein,
          riboflavin: item.riboflavin,
          sodium: item.sodium,
          sugar: item.sugar,
          thiamin: item.thiamin,
          vitaminA: item.vitaminA,
          vitaminC: item.vitaminC,
          vitaminD: item.vitaminD,
          vitaminE: item.vitaminE,
          vitaminK: item.vitaminK,
          zinc: item.zinc,
        },
        portionLabel:
          item.portionUnit === "g" ? `${item.portionSize} g` : `${item.portionSize} ${item.portionUnit}`,
        prepMethod: item.prepMethod,
        barcodeValue: item.barcodeValue,
        source: item.source,
        usdaFoodId: item.usdaFoodId,
      })),
      meal: {
        aiConfidence: meal.aiConfidence,
        entryMethod: meal.entryMethod,
        id: meal._id,
        label: meal.label,
        mealType: meal.mealType,
        photoStorageId: meal.photoStorageId,
        timestamp: meal.timestamp,
      },
      timeZone: user.timeZone,
    };
  },
});

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
    const foodName = buildManualFoodName({
      mealType: args.mealType,
      name: args.name,
    });
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
      label: undefined,
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
      label: undefined,
      mealType: args.mealType,
      overallConfidence: args.overallConfidence,
      photoStorageId: args.photoStorageId,
    }),
});

export const updateManual = mutation({
  args: {
    calories: v.number(),
    carbs: v.number(),
    fat: v.number(),
    mealId: v.id("meals"),
    mealType: mealTypeValidator,
    name: v.optional(v.string()),
    protein: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { meal } = await getOwnedMeal(ctx, args.mealId);

    if (meal.entryMethod !== "manual") {
      throw new Error("Only manual meals can use this edit path.");
    }

    const items = await loadMealItems(ctx, meal._id);
    const firstItem = items[0];

    if (!firstItem) {
      throw new Error("Meal item not found.");
    }

    await ctx.db.patch(meal._id, {
      label: args.name?.trim() || undefined,
      mealType: args.mealType,
      timestamp: args.timestamp,
      totalCalories: args.calories,
      totalCarbs: args.carbs,
      totalFat: args.fat,
      totalProtein: args.protein,
    });
    await ctx.db.patch(firstItem._id, {
      calories: args.calories,
      carbs: args.carbs,
      fat: args.fat,
      foodName: buildManualFoodName({
        mealType: args.mealType,
        name: args.name,
      }),
      protein: args.protein,
    });

    return { mealId: meal._id };
  },
});

export const updateAiEntry = mutation({
  args: {
    items: v.array(savedScanItemValidator),
    label: v.optional(v.string()),
    mealId: v.id("meals"),
    mealType: mealTypeValidator,
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { meal } = await getOwnedMeal(ctx, args.mealId);

    if (
      meal.entryMethod !== "photo_scan" &&
      meal.entryMethod !== "ai_text" &&
      meal.entryMethod !== "barcode"
    ) {
      throw new Error("Only AI meals can use this edit path.");
    }

    if (!args.items.length) {
      throw new Error("At least one reviewed item is required before saving this meal.");
    }

    const totals = sumMealTotals(args.items);

    await ctx.db.patch(meal._id, {
      aiConfidence: meal.aiConfidence,
      b12: totals.b12,
      b6: totals.b6,
      calcium: totals.calcium,
      folate: totals.folate,
      iron: totals.iron,
      label: buildAiMealLabel({
        entryMethod: meal.entryMethod,
        items: args.items,
        label: args.label,
        mealType: args.mealType,
      }),
      magnesium: totals.magnesium,
      mealType: args.mealType,
      niacin: totals.niacin,
      phosphorus: totals.phosphorus,
      potassium: totals.potassium,
      riboflavin: totals.riboflavin,
      thiamin: totals.thiamin,
      timestamp: args.timestamp,
      totalCalories: totals.calories,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      totalProtein: totals.protein,
      totalSodium: totals.sodium,
      totalSugar: totals.sugar,
      vitaminA: totals.vitaminA,
      vitaminC: totals.vitaminC,
      vitaminD: totals.vitaminD,
      vitaminE: totals.vitaminE,
      vitaminK: totals.vitaminK,
      zinc: totals.zinc,
    });
    await replaceMealItems(ctx, {
      items: args.items,
      mealId: meal._id,
    });

    return { mealId: meal._id };
  },
});

export const deleteMeal = mutation({
  args: {
    mealId: v.id("meals"),
  },
  handler: async (ctx, args) => {
    const { meal } = await getOwnedMeal(ctx, args.mealId);
    const items = await loadMealItems(ctx, meal._id);

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(meal._id);

    return { deleted: true };
  },
});
