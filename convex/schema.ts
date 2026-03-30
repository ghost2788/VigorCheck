import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const micronutrientFields = {
  vitaminA: v.number(),
  vitaminC: v.number(),
  vitaminD: v.number(),
  vitaminE: v.number(),
  vitaminK: v.number(),
  b6: v.number(),
  b12: v.number(),
  folate: v.number(),
  thiamin: v.number(),
  niacin: v.number(),
  riboflavin: v.number(),
  calcium: v.number(),
  iron: v.number(),
  potassium: v.number(),
  magnesium: v.number(),
  zinc: v.number(),
  phosphorus: v.number(),
};

const fullNutritionFields = {
  calories: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
  fiber: v.number(),
  sodium: v.number(),
  sugar: v.number(),
  ...micronutrientFields,
};

const goalsMetFields = {
  calories: v.boolean(),
  protein: v.boolean(),
  fiber: v.boolean(),
  hydration: v.boolean(),
  sodium: v.boolean(),
  sugar: v.boolean(),
};

const supplementNutrients = {
  vitaminA: v.optional(v.number()),
  vitaminC: v.optional(v.number()),
  vitaminD: v.optional(v.number()),
  vitaminE: v.optional(v.number()),
  vitaminK: v.optional(v.number()),
  b6: v.optional(v.number()),
  b12: v.optional(v.number()),
  folate: v.optional(v.number()),
  thiamin: v.optional(v.number()),
  niacin: v.optional(v.number()),
  riboflavin: v.optional(v.number()),
  calcium: v.optional(v.number()),
  iron: v.optional(v.number()),
  potassium: v.optional(v.number()),
  magnesium: v.optional(v.number()),
  zinc: v.optional(v.number()),
  phosphorus: v.optional(v.number()),
  omega3: v.optional(v.number()),
};

export default defineSchema({
  users: defineTable({
    authSubject: v.string(),
    themePalette: v.optional(v.string()),
    timeZone: v.string(),
    age: v.number(),
    weight: v.number(),
    height: v.number(),
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active")
    ),
    sex: v.union(v.literal("male"), v.literal("female")),
    goalType: v.union(
      v.literal("general_health"),
      v.literal("fat_loss"),
      v.literal("muscle_gain"),
      v.literal("energy_balance")
    ),
    targetCalories: v.number(),
    targetProtein: v.number(),
    targetCarbs: v.number(),
    targetFat: v.number(),
    targetFiber: v.number(),
    targetSodium: v.number(),
    targetSugar: v.number(),
    targetHydration: v.number(),
    overrideCalories: v.optional(v.number()),
    overrideProtein: v.optional(v.number()),
    overrideCarbs: v.optional(v.number()),
    overrideFat: v.optional(v.number()),
    overrideFiber: v.optional(v.number()),
    overrideSodium: v.optional(v.number()),
    overrideSugar: v.optional(v.number()),
    overrideHydration: v.optional(v.number()),
    subscriptionStatus: v.union(v.literal("trial"), v.literal("active"), v.literal("expired")),
    trialStartDate: v.number(),
    notifyHydration: v.boolean(),
    notifyMealLogging: v.boolean(),
    notifyGoalCompletion: v.boolean(),
    notifyEndOfDay: v.boolean(),
    wakeTime: v.string(),
    sleepTime: v.string(),
  }).index("by_auth_subject", ["authSubject"]),

  meals: defineTable({
    userId: v.id("users"),
    timestamp: v.number(),
    label: v.optional(v.string()),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    entryMethod: v.union(
      v.literal("manual"),
      v.literal("photo_scan"),
      v.literal("ai_text"),
      v.literal("search"),
      v.literal("barcode"),
      v.literal("saved_meal")
    ),
    photoStorageId: v.optional(v.id("_storage")),
    aiConfidence: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    totalCalories: v.number(),
    totalProtein: v.number(),
    totalCarbs: v.number(),
    totalFat: v.number(),
    totalFiber: v.number(),
    totalSodium: v.number(),
    totalSugar: v.number(),
    ...micronutrientFields,
  }).index("by_user_date", ["userId", "timestamp"]),

  mealItems: defineTable({
    mealId: v.id("meals"),
    foodName: v.string(),
    usdaFoodId: v.optional(v.string()),
    portionSize: v.number(),
    portionUnit: v.string(),
    prepMethod: v.optional(v.string()),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.number(),
    sodium: v.number(),
    sugar: v.number(),
    ...micronutrientFields,
    confidence: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    source: v.union(v.literal("usda"), v.literal("ai_estimated"), v.literal("manual")),
  }).index("by_meal", ["mealId"]),

  hydrationLogs: defineTable({
    userId: v.id("users"),
    timestamp: v.number(),
    amountOz: v.number(),
    shortcutId: v.optional(v.id("hydrationShortcuts")),
    shortcutLabel: v.optional(v.string()),
  }).index("by_user_date", ["userId", "timestamp"]),

  hydrationShortcuts: defineTable({
    userId: v.id("users"),
    label: v.string(),
    category: v.union(
      v.literal("water"),
      v.literal("energy_drink"),
      v.literal("protein_shake"),
      v.literal("other")
    ),
    defaultAmountOz: v.number(),
    pinned: v.boolean(),
    lastUsedAt: v.number(),
    logMode: v.union(v.literal("hydration_only"), v.literal("hydration_and_nutrition")),
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner"),
        v.literal("snack")
      )
    ),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    nutritionProfile: v.optional(v.object(fullNutritionFields)),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "lastUsedAt"]),

  dailySummaries: defineTable({
    userId: v.id("users"),
    date: v.string(),
    totalCalories: v.number(),
    totalProtein: v.number(),
    totalCarbs: v.number(),
    totalFat: v.number(),
    totalFiber: v.number(),
    totalSodium: v.number(),
    totalSugar: v.number(),
    ...micronutrientFields,
    totalHydrationOz: v.number(),
    supplementCalcium: v.number(),
    supplementIron: v.number(),
    supplementVitaminD: v.number(),
    supplementB12: v.number(),
    supplementMagnesium: v.number(),
    supplementZinc: v.number(),
    supplementVitaminC: v.number(),
    supplementFolate: v.number(),
    supplementOmega3: v.number(),
    goalsMet: v.object(goalsMetFields),
    dayScore: v.number(),
    mealsLoggedCount: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_recent", ["userId"]),

  savedMeals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    items: v.array(
      v.object({
        foodName: v.string(),
        portionSize: v.number(),
        portionUnit: v.string(),
        prepMethod: v.optional(v.string()),
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
        fiber: v.number(),
        sodium: v.number(),
        sugar: v.number(),
        ...micronutrientFields,
      })
    ),
    lastUsed: v.number(),
  }).index("by_user", ["userId"]),

  supplements: defineTable({
    name: v.string(),
    brand: v.optional(v.string()),
    category: v.string(),
    nutrients: v.object(supplementNutrients),
  }).searchIndex("by_name", {
    searchField: "name",
  }),

  userSupplements: defineTable({
    userId: v.id("users"),
    supplementId: v.optional(v.id("supplements")),
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    customName: v.optional(v.string()),
    customNutrients: v.optional(v.object(supplementNutrients)),
  }).index("by_user", ["userId"]),

  supplementLogs: defineTable({
    userId: v.id("users"),
    userSupplementId: v.id("userSupplements"),
    timestamp: v.number(),
  }).index("by_user_date", ["userId", "timestamp"]),

  usdaFoods: defineTable({
    fdcId: v.string(),
    name: v.string(),
    category: v.string(),
    caloriesPer100g: v.number(),
    proteinPer100g: v.number(),
    carbsPer100g: v.number(),
    fatPer100g: v.number(),
    fiberPer100g: v.number(),
    sodiumPer100g: v.number(),
    sugarPer100g: v.number(),
    vitaminAPer100g: v.number(),
    vitaminCPer100g: v.number(),
    vitaminDPer100g: v.number(),
    vitaminEPer100g: v.number(),
    vitaminKPer100g: v.number(),
    b6Per100g: v.number(),
    b12Per100g: v.number(),
    folatePer100g: v.number(),
    thiaminPer100g: v.number(),
    niacinPer100g: v.number(),
    riboflavinPer100g: v.number(),
    calciumPer100g: v.number(),
    ironPer100g: v.number(),
    potassiumPer100g: v.number(),
    magnesiumPer100g: v.number(),
    zincPer100g: v.number(),
    phosphorusPer100g: v.number(),
  })
    .index("by_fdc_id", ["fdcId"])
    .searchIndex("by_name", {
      searchField: "name",
    }),
});
