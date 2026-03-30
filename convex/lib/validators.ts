import { v } from "convex/values";

export const confidenceValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const mealTypeValidator = v.union(
  v.literal("breakfast"),
  v.literal("lunch"),
  v.literal("dinner"),
  v.literal("snack")
);

export const aiEntryMethodValidator = v.union(v.literal("photo_scan"), v.literal("ai_text"));

export const rememberedShortcutCategoryValidator = v.union(
  v.literal("water"),
  v.literal("energy_drink"),
  v.literal("protein_shake"),
  v.literal("other")
);

export const rememberedShortcutLogModeValidator = v.union(
  v.literal("hydration_only"),
  v.literal("hydration_and_nutrition")
);

export const nutritionValidator = v.object({
  b12: v.number(),
  b6: v.number(),
  calcium: v.number(),
  calories: v.number(),
  carbs: v.number(),
  fat: v.number(),
  fiber: v.number(),
  folate: v.number(),
  iron: v.number(),
  magnesium: v.number(),
  niacin: v.number(),
  phosphorus: v.number(),
  potassium: v.number(),
  protein: v.number(),
  riboflavin: v.number(),
  sodium: v.number(),
  sugar: v.number(),
  thiamin: v.number(),
  vitaminA: v.number(),
  vitaminC: v.number(),
  vitaminD: v.number(),
  vitaminE: v.number(),
  vitaminK: v.number(),
  zinc: v.number(),
});

export const savedScanItemValidator = v.object({
  confidence: confidenceValidator,
  estimatedGrams: v.number(),
  name: v.string(),
  nutrition: nutritionValidator,
  portionLabel: v.string(),
  prepMethod: v.optional(v.string()),
  source: v.union(v.literal("usda"), v.literal("ai_estimated"), v.literal("manual")),
  usdaFoodId: v.optional(v.string()),
});
