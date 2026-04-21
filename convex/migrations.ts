import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel, Doc } from "./_generated/dataModel";
import { buildHydrationShortcutDrinkMigrationPatch } from "../lib/domain/hydrationShortcuts";
import {
  buildProvisionalSupplementFingerprint,
  normalizeSupplementActiveIngredients,
  normalizeSupplementNutritionProfile,
} from "../lib/domain/supplements";

const ADDED_NUTRIENT_PATCH = {
  choline: 0,
  copper: 0,
  manganese: 0,
  omega3: 0,
  selenium: 0,
} as const;

const migrations = new Migrations<DataModel>(components.migrations);

function hasMissingExpandedNutrients(
  record: Partial<Record<keyof typeof ADDED_NUTRIENT_PATCH, number | undefined>>
) {
  return Object.keys(ADDED_NUTRIENT_PATCH).some(
    (key) => record[key as keyof typeof ADDED_NUTRIENT_PATCH] === undefined
  );
}

function patchExpandedNutrients<
  TValue extends Partial<Record<keyof typeof ADDED_NUTRIENT_PATCH, number | undefined>>,
>(record: TValue) {
  return {
    ...record,
    ...ADDED_NUTRIENT_PATCH,
  };
}

function patchMealLikeRecord<TDocument extends Doc<"meals"> | Doc<"mealItems"> | Doc<"dailySummaries">>(
  document: TDocument
) {
  if (!hasMissingExpandedNutrients(document)) {
    return;
  }

  return ADDED_NUTRIENT_PATCH;
}

export const backfillMealsExpandedNutrients = migrations.define({
  table: "meals",
  migrateOne: async (_ctx, meal) => patchMealLikeRecord(meal),
});

export const backfillMealItemsExpandedNutrients = migrations.define({
  table: "mealItems",
  migrateOne: async (_ctx, mealItem) => patchMealLikeRecord(mealItem),
});

export const backfillDailySummariesExpandedNutrients = migrations.define({
  table: "dailySummaries",
  migrateOne: async (_ctx, summary) => patchMealLikeRecord(summary),
});

export const backfillHydrationShortcutNutritionProfiles = migrations.define({
  table: "hydrationShortcuts",
  migrateOne: async (_ctx, shortcut) => {
    if (!shortcut.nutritionProfile || !hasMissingExpandedNutrients(shortcut.nutritionProfile)) {
      return;
    }

    return {
      nutritionProfile: patchExpandedNutrients(shortcut.nutritionProfile),
    };
  },
});

export const backfillHydrationShortcutDrinkMealType = migrations.define({
  table: "hydrationShortcuts",
  migrateOne: async (_ctx, shortcut) => {
    return buildHydrationShortcutDrinkMigrationPatch({
      logMode: shortcut.logMode,
      mealType: shortcut.mealType,
    });
  },
});

export const backfillSavedMealItemsExpandedNutrients = migrations.define({
  table: "savedMeals",
  migrateOne: async (_ctx, savedMeal) => {
    let changed = false;

    const items = savedMeal.items.map((item) => {
      if (!hasMissingExpandedNutrients(item)) {
        return item;
      }

      changed = true;
      return patchExpandedNutrients(item);
    });

    if (!changed) {
      return;
    }

    return { items };
  },
});

export const backfillUsdaFoodsExpandedNutrients = migrations.define({
  table: "usdaFoods",
  migrateOne: async (_ctx, food) => {
    if (
      food.cholinePer100g !== undefined &&
      food.copperPer100g !== undefined &&
      food.manganesePer100g !== undefined &&
      food.omega3Per100g !== undefined &&
      food.seleniumPer100g !== undefined
    ) {
      return;
    }

    return {
      cholinePer100g: food.cholinePer100g ?? 0,
      copperPer100g: food.copperPer100g ?? 0,
      manganesePer100g: food.manganesePer100g ?? 0,
      omega3Per100g: food.omega3Per100g ?? 0,
      seleniumPer100g: food.seleniumPer100g ?? 0,
    };
  },
});

export const backfillUserSupplementFingerprintFields = migrations.define({
  table: "userSupplements",
  migrateOne: async (_ctx, userSupplement) => {
    const displayName =
      userSupplement.displayName?.trim() ||
      userSupplement.customName?.trim() ||
      "Supplement";
    const servingLabel = userSupplement.servingLabel?.trim() || "1 serving";
    const nutritionProfile = normalizeSupplementNutritionProfile(
      userSupplement.nutritionProfile ?? userSupplement.customNutrients
    );
    const activeIngredients = normalizeSupplementActiveIngredients(userSupplement.activeIngredients);
    const productFingerprint =
      userSupplement.productFingerprint ??
      buildProvisionalSupplementFingerprint({
        nutritionProfile,
        productName: displayName,
        servingLabel,
      });

    return {
      activeIngredients,
      displayName,
      fingerprintKind: userSupplement.fingerprintKind ?? "provisional",
      nutritionProfile,
      productFingerprint,
      servingLabel,
      sourceKind: userSupplement.sourceKind ?? "legacy",
      status: userSupplement.status ?? "active",
    };
  },
});

export const backfillSupplementLogActiveIngredients = migrations.define({
  table: "supplementLogs",
  migrateOne: async (_ctx, supplementLog) => {
    if (supplementLog.loggedActiveIngredients) {
      return;
    }

    return {
      loggedActiveIngredients: [],
    };
  },
});

export const runExpandedNutrientBackfill = migrations.runner([
  internal.migrations.backfillMealsExpandedNutrients,
  internal.migrations.backfillMealItemsExpandedNutrients,
  internal.migrations.backfillDailySummariesExpandedNutrients,
  internal.migrations.backfillHydrationShortcutNutritionProfiles,
  internal.migrations.backfillSavedMealItemsExpandedNutrients,
  internal.migrations.backfillUsdaFoodsExpandedNutrients,
]);

export const runHydrationShortcutDrinkMealTypeBackfill = migrations.runner([
  internal.migrations.backfillHydrationShortcutDrinkMealType,
]);

export const runSupplementFingerprintBackfill = migrations.runner([
  internal.migrations.backfillUserSupplementFingerprintFields,
  internal.migrations.backfillSupplementLogActiveIngredients,
]);

export const run = migrations.runner();
