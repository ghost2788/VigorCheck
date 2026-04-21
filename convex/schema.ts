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
  omega3: v.optional(v.number()),
  choline: v.optional(v.number()),
  selenium: v.optional(v.number()),
  copper: v.optional(v.number()),
  manganese: v.optional(v.number()),
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

const rememberedEntryPortionUnitValidator = v.union(
  v.literal("g"),
  v.literal("ml"),
  v.literal("oz"),
  v.literal("serving")
);

const rememberedMealItemSnapshotFields = {
  barcodeValue: v.optional(v.string()),
  foodName: v.string(),
  nutrition: v.object(fullNutritionFields),
  portionAmount: v.number(),
  portionUnit: rememberedEntryPortionUnitValidator,
  prepMethod: v.optional(v.string()),
  source: v.union(
    v.literal("usda"),
    v.literal("ai_estimated"),
    v.literal("manual"),
    v.literal("barcode_catalog")
  ),
  usdaFoodId: v.optional(v.string()),
};

const rememberedMealSnapshotFields = {
  items: v.array(v.object(rememberedMealItemSnapshotFields)),
  mealType: v.union(
    v.literal("breakfast"),
    v.literal("lunch"),
    v.literal("dinner"),
    v.literal("snack"),
    v.literal("drink")
  ),
};

const rememberedHydrationSnapshotFields = {
  amountOz: v.number(),
  beverageKind: v.union(v.literal("water"), v.literal("drink")),
  label: v.string(),
};

const goalsMetFields = {
  calories: v.boolean(),
  protein: v.boolean(),
  fiber: v.boolean(),
  hydration: v.boolean(),
  sodium: v.boolean(),
  sugar: v.boolean(),
};

const supplementNutritionFields = {
  calories: v.optional(v.number()),
  protein: v.optional(v.number()),
  carbs: v.optional(v.number()),
  fat: v.optional(v.number()),
  fiber: v.optional(v.number()),
  sodium: v.optional(v.number()),
  sugar: v.optional(v.number()),
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
  choline: v.optional(v.number()),
  selenium: v.optional(v.number()),
  copper: v.optional(v.number()),
  manganese: v.optional(v.number()),
};

const supplementActiveIngredientFields = {
  amount: v.optional(v.number()),
  name: v.string(),
  note: v.optional(v.string()),
  unit: v.optional(v.string()),
};

export default defineSchema({
  users: defineTable({
    authSubject: v.optional(v.string()),
    displayName: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    themePalette: v.optional(v.string()),
    timeZone: v.string(),
    aiQuotaTimeZone: v.optional(v.string()),
    rememberedEntriesMigrationVersion: v.optional(v.number()),
    age: v.number(),
    weight: v.number(),
    height: v.number(),
    preferredUnitSystem: v.optional(v.union(v.literal("imperial"), v.literal("metric"))),
    primaryTrackingChallenge: v.optional(v.union(
      v.literal("consistency"),
      v.literal("knowing_what_to_eat"),
      v.literal("portion_sizes"),
      v.literal("motivation")
    )),
    goalPace: v.optional(v.union(v.literal("slow"), v.literal("moderate"), v.literal("aggressive"))),
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
    trialEndsAt: v.optional(v.number()),
    subscriptionExpiresAt: v.optional(v.number()),
    subscriptionProductId: v.optional(v.string()),
    subscriptionPlatform: v.optional(
      v.union(v.literal("android"), v.literal("ios"), v.literal("web"), v.literal("unknown"))
    ),
    revenueCatAppUserId: v.optional(v.string()),
    lastBillingSyncAt: v.optional(v.number()),
    internalToolsUnlockTokenHash: v.optional(v.string()),
    internalToolsUnlockExpiresAt: v.optional(v.number()),
    notifyHydration: v.boolean(),
    notifyMealLogging: v.boolean(),
    notifyGoalCompletion: v.boolean(),
    notifyEndOfDay: v.boolean(),
    wakeTime: v.string(),
    sleepTime: v.string(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_revenuecat_app_user_id", ["revenueCatAppUserId"]),

  revenueCatWebhookEvents: defineTable({
    eventId: v.string(),
    receivedAt: v.number(),
    type: v.string(),
  }).index("by_event_id", ["eventId"]),

  meals: defineTable({
    userId: v.id("users"),
    timestamp: v.number(),
    label: v.optional(v.string()),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack"),
      v.literal("drink")
    ),
    entryMethod: v.union(
      v.literal("manual"),
      v.literal("photo_scan"),
      v.literal("ai_text"),
      v.literal("search"),
      v.literal("barcode"),
      v.literal("saved_meal")
    ),
    rememberedEntryId: v.optional(v.id("rememberedEntries")),
    rememberedReplayId: v.optional(v.string()),
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
    })
      .index("by_user_date", ["userId", "timestamp"])
      .index("by_remembered_entry_id", ["rememberedEntryId"])
      .index("by_remembered_replay_id", ["rememberedReplayId"])
      .index("by_remembered_entry_id_and_timestamp", ["rememberedEntryId", "timestamp"]),

  mealItems: defineTable({
    mealId: v.id("meals"),
    barcodeValue: v.optional(v.string()),
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
    source: v.union(
      v.literal("usda"),
      v.literal("ai_estimated"),
      v.literal("manual"),
      v.literal("barcode_catalog")
    ),
  }).index("by_meal", ["mealId"]),

  hydrationLogs: defineTable({
    userId: v.id("users"),
    timestamp: v.number(),
    amountOz: v.number(),
    rememberedEntryId: v.optional(v.id("rememberedEntries")),
    rememberedReplayId: v.optional(v.string()),
    shortcutId: v.optional(v.id("hydrationShortcuts")),
    shortcutLabel: v.optional(v.string()),
  })
    .index("by_user_date", ["userId", "timestamp"])
    .index("by_shortcut_id", ["shortcutId"])
    .index("by_remembered_entry_id", ["rememberedEntryId"])
    .index("by_remembered_replay_id", ["rememberedReplayId"])
    .index("by_remembered_entry_id_and_timestamp", ["rememberedEntryId", "timestamp"]),

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
        v.literal("snack"),
        v.literal("drink")
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

  rememberedEntries: defineTable({
    displayLabel: v.string(),
    favorited: v.boolean(),
    favoritedAt: v.optional(v.number()),
    fingerprint: v.string(),
    hydrationSnapshot: v.optional(v.object(rememberedHydrationSnapshotFields)),
    lastUsedAt: v.number(),
    mealSnapshot: v.optional(v.object(rememberedMealSnapshotFields)),
    replayKind: v.union(
      v.literal("meal_only"),
      v.literal("hydration_only"),
      v.literal("meal_and_hydration")
    ),
    userId: v.id("users"),
  })
    .index("by_user_and_fingerprint", ["userId", "fingerprint"])
    .index("by_user_and_favorited_and_favorited_at", ["userId", "favorited", "favoritedAt"])
    .index("by_user_and_favorited_and_last_used_at", ["userId", "favorited", "lastUsedAt"]),

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
    nutritionProfile: v.optional(v.object(supplementNutritionFields)),
    nutrients: v.optional(v.object(supplementNutritionFields)),
    searchText: v.optional(v.string()),
    servingLabel: v.optional(v.string()),
  })
    .searchIndex("by_name", {
      searchField: "name",
    })
    .searchIndex("by_search_text", {
      searchField: "searchText",
    }),

  userSupplements: defineTable({
    userId: v.id("users"),
    supplementId: v.optional(v.id("supplements")),
    brand: v.optional(v.string()),
    productFingerprint: v.optional(v.string()),
    fingerprintKind: v.optional(v.union(v.literal("strong"), v.literal("provisional"))),
    sourceKind: v.optional(v.union(v.literal("scanned"), v.literal("custom"), v.literal("legacy"))),
    activeIngredients: v.optional(v.array(v.object(supplementActiveIngredientFields))),
    lastScannedAt: v.optional(v.number()),
    scanPhotoCount: v.optional(v.number()),
    displayName: v.optional(v.string()),
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    servingLabel: v.optional(v.string()),
    nutritionProfile: v.optional(v.object(supplementNutritionFields)),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    archivedAt: v.optional(v.number()),
    customName: v.optional(v.string()),
    customNutrients: v.optional(v.object(supplementNutritionFields)),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status_and_frequency", ["userId", "status", "frequency"])
    .index("by_user_and_product_fingerprint", ["userId", "productFingerprint"]),

  supplementLogs: defineTable({
    userId: v.id("users"),
    userSupplementId: v.id("userSupplements"),
    loggedDisplayName: v.optional(v.string()),
    loggedServingLabel: v.optional(v.string()),
    loggedActiveIngredients: v.optional(v.array(v.object(supplementActiveIngredientFields))),
    loggedNutritionProfile: v.optional(v.object(supplementNutritionFields)),
    timestamp: v.number(),
  })
    .index("by_user_date", ["userId", "timestamp"])
    .index("by_user_supplement_id_and_timestamp", ["userSupplementId", "timestamp"]),

  aiUsageCounters: defineTable({
    photoScanCount: v.number(),
    textEntryCount: v.number(),
    updatedAt: v.number(),
    userId: v.id("users"),
    windowKey: v.string(),
    windowKind: v.union(
      v.literal("trial_lifetime"),
      v.literal("calendar_month"),
      v.literal("daily_scan")
    ),
  }).index("by_user_id_and_window_kind_and_window_key", ["userId", "windowKind", "windowKey"]),

  aiRequestEvents: defineTable({
    blockedLimitKind: v.optional(
      v.union(
        v.literal("trial_lifetime"),
        v.literal("calendar_month"),
        v.literal("daily_scan")
      )
    ),
    cachedInputTokens: v.optional(v.number()),
    callKind: v.union(
      v.literal("photo_scan"),
      v.literal("supplement_scan"),
      v.literal("text_entry"),
      v.literal("drink_estimate")
    ),
    completedAt: v.number(),
    createdAt: v.number(),
    estimatedCostUsdMicros: v.optional(v.number()),
    featureKind: v.union(v.literal("photo_scan"), v.literal("text_ai")),
    inputTokens: v.optional(v.number()),
    model: v.string(),
    outputTokens: v.optional(v.number()),
    pricingVersion: v.string(),
    reasoningTokens: v.optional(v.number()),
    resultStatus: v.union(
      v.literal("completed"),
      v.literal("blocked_quota"),
      v.literal("provider_error"),
      v.literal("postprocess_error")
    ),
    totalTokens: v.optional(v.number()),
    usageState: v.union(v.literal("present"), v.literal("missing"), v.literal("not_applicable")),
    userId: v.id("users"),
  }).index("by_user_and_created_at", ["userId", "createdAt"]),

  aiDailyDiagnosticsRollups: defineTable({
    blockedCount: v.number(),
    cachedInputTokens: v.number(),
    callKind: v.union(
      v.literal("photo_scan"),
      v.literal("supplement_scan"),
      v.literal("text_entry"),
      v.literal("drink_estimate")
    ),
    completedCount: v.number(),
    estimatedCostUsdMicros: v.number(),
    inputTokens: v.number(),
    localDateKey: v.string(),
    outputTokens: v.number(),
    postprocessErrorCount: v.number(),
    pricingVersion: v.string(),
    providerErrorCount: v.number(),
    reasoningTokens: v.number(),
    requestCount: v.number(),
    totalTokens: v.number(),
    updatedAt: v.number(),
    usageMissingCount: v.number(),
    userId: v.id("users"),
  })
    .index("by_user_and_local_date_key", ["userId", "localDateKey"])
    .index("by_user_and_local_date_key_and_call_kind_and_pricing_version", [
      "userId",
      "localDateKey",
      "callKind",
      "pricingVersion",
    ]),

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
    omega3Per100g: v.optional(v.number()),
    cholinePer100g: v.optional(v.number()),
    seleniumPer100g: v.optional(v.number()),
    copperPer100g: v.optional(v.number()),
    manganesePer100g: v.optional(v.number()),
  })
    .index("by_fdc_id", ["fdcId"])
    .searchIndex("by_name", {
      searchField: "name",
    }),
});
