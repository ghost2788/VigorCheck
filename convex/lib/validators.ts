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
  v.literal("snack"),
  v.literal("drink")
);

export const aiEntryMethodValidator = v.union(
  v.literal("photo_scan"),
  v.literal("ai_text"),
  v.literal("barcode")
);

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
  choline: v.number(),
  copper: v.number(),
  fat: v.number(),
  fiber: v.number(),
  folate: v.number(),
  iron: v.number(),
  magnesium: v.number(),
  manganese: v.number(),
  niacin: v.number(),
  omega3: v.number(),
  phosphorus: v.number(),
  potassium: v.number(),
  protein: v.number(),
  riboflavin: v.number(),
  selenium: v.number(),
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

export const supplementNutritionValidator = v.object({
  b12: v.optional(v.number()),
  b6: v.optional(v.number()),
  calcium: v.optional(v.number()),
  calories: v.optional(v.number()),
  carbs: v.optional(v.number()),
  choline: v.optional(v.number()),
  copper: v.optional(v.number()),
  fat: v.optional(v.number()),
  fiber: v.optional(v.number()),
  folate: v.optional(v.number()),
  iron: v.optional(v.number()),
  magnesium: v.optional(v.number()),
  manganese: v.optional(v.number()),
  niacin: v.optional(v.number()),
  omega3: v.optional(v.number()),
  phosphorus: v.optional(v.number()),
  potassium: v.optional(v.number()),
  protein: v.optional(v.number()),
  riboflavin: v.optional(v.number()),
  selenium: v.optional(v.number()),
  sodium: v.optional(v.number()),
  sugar: v.optional(v.number()),
  thiamin: v.optional(v.number()),
  vitaminA: v.optional(v.number()),
  vitaminC: v.optional(v.number()),
  vitaminD: v.optional(v.number()),
  vitaminE: v.optional(v.number()),
  vitaminK: v.optional(v.number()),
  zinc: v.optional(v.number()),
});

export const supplementActiveIngredientValidator = v.object({
  amount: v.optional(v.number()),
  name: v.string(),
  note: v.optional(v.string()),
  unit: v.optional(v.string()),
});

export const savedScanItemValidator = v.object({
  barcodeValue: v.optional(v.string()),
  confidence: confidenceValidator,
  name: v.string(),
  nutrition: nutritionValidator,
  portionAmount: v.number(),
  portionLabel: v.string(),
  portionUnit: v.union(v.literal("g"), v.literal("ml"), v.literal("oz"), v.literal("serving")),
  prepMethod: v.optional(v.string()),
  source: v.union(
    v.literal("usda"),
    v.literal("ai_estimated"),
    v.literal("manual"),
    v.literal("barcode_catalog")
  ),
  usdaFoodId: v.optional(v.string()),
});
