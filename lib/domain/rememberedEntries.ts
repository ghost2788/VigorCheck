import { MealType } from "./meals";
import { NutritionFields } from "./scan";

export type RememberedEntryReplayKind = "meal_only" | "hydration_only" | "meal_and_hydration";
export type RememberedEntryPortionUnit = "g" | "ml" | "oz" | "serving";

export type RememberedMealItemSnapshot = {
  barcodeValue?: string;
  foodName: string;
  nutrition: NutritionFields;
  portionAmount: number;
  portionUnit: RememberedEntryPortionUnit;
  prepMethod?: string;
  source: "ai_estimated" | "manual" | "usda" | "barcode_catalog";
  usdaFoodId?: string;
};

export type RememberedMealSnapshot = {
  items: RememberedMealItemSnapshot[];
  mealType: MealType;
};

export type RememberedHydrationSnapshot = {
  amountOz: number;
  beverageKind: "drink" | "water";
  label: string;
};

export type RememberedEntrySnapshot =
  | {
      displayLabel: string;
      meal: RememberedMealSnapshot;
      replayKind: "meal_only";
    }
  | {
      displayLabel: string;
      hydration: RememberedHydrationSnapshot;
      replayKind: "hydration_only";
    }
  | {
      displayLabel: string;
      hydration: RememberedHydrationSnapshot;
      meal: RememberedMealSnapshot;
      replayKind: "meal_and_hydration";
    };

type LegacyHydrationShortcutSignature = {
  calories: number;
  carbs: number;
  category: "energy_drink" | "other" | "protein_shake" | "water";
  defaultAmountOz: number;
  fat: number;
  label: string;
  logMode: "hydration_and_nutrition" | "hydration_only";
  mealType?: MealType;
  pinned: boolean;
  protein: number;
};

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") || undefined;
}

function roundNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

function normalizeNutrition(nutrition: NutritionFields) {
  return {
    b12: roundNumber(nutrition.b12),
    b6: roundNumber(nutrition.b6),
    calcium: roundNumber(nutrition.calcium),
    calories: roundNumber(nutrition.calories),
    carbs: roundNumber(nutrition.carbs),
    choline: roundNumber(nutrition.choline),
    copper: roundNumber(nutrition.copper),
    fat: roundNumber(nutrition.fat),
    fiber: roundNumber(nutrition.fiber),
    folate: roundNumber(nutrition.folate),
    iron: roundNumber(nutrition.iron),
    magnesium: roundNumber(nutrition.magnesium),
    manganese: roundNumber(nutrition.manganese),
    niacin: roundNumber(nutrition.niacin),
    omega3: roundNumber(nutrition.omega3),
    phosphorus: roundNumber(nutrition.phosphorus),
    potassium: roundNumber(nutrition.potassium),
    protein: roundNumber(nutrition.protein),
    riboflavin: roundNumber(nutrition.riboflavin),
    selenium: roundNumber(nutrition.selenium),
    sodium: roundNumber(nutrition.sodium),
    sugar: roundNumber(nutrition.sugar),
    thiamin: roundNumber(nutrition.thiamin),
    vitaminA: roundNumber(nutrition.vitaminA),
    vitaminC: roundNumber(nutrition.vitaminC),
    vitaminD: roundNumber(nutrition.vitaminD),
    vitaminE: roundNumber(nutrition.vitaminE),
    vitaminK: roundNumber(nutrition.vitaminK),
    zinc: roundNumber(nutrition.zinc),
  };
}

function normalizeMeal(meal: RememberedMealSnapshot) {
  const items = meal.items
    .map((item) => ({
      barcodeValue: item.barcodeValue,
      foodName: normalizeLabel(item.foodName),
      nutrition: normalizeNutrition(item.nutrition),
      portionAmount: roundNumber(item.portionAmount),
      portionUnit: item.portionUnit,
      prepMethod: normalizeText(item.prepMethod),
      usdaFoodId: item.usdaFoodId,
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));

  return {
    items,
    mealType: meal.mealType,
  };
}

function normalizeHydration(hydration: RememberedHydrationSnapshot) {
  return {
    amountOz: roundNumber(hydration.amountOz),
    beverageKind: hydration.beverageKind,
    label: normalizeLabel(hydration.label),
  };
}

export function buildRememberedEntryFingerprint(snapshot: RememberedEntrySnapshot) {
  const normalized =
    snapshot.replayKind === "meal_only"
      ? {
          meal: normalizeMeal(snapshot.meal),
          replayKind: snapshot.replayKind,
        }
      : snapshot.replayKind === "hydration_only"
        ? {
            hydration: normalizeHydration(snapshot.hydration),
            replayKind: snapshot.replayKind,
          }
        : {
            hydration: normalizeHydration(snapshot.hydration),
            meal: normalizeMeal(snapshot.meal),
            replayKind: snapshot.replayKind,
          };

  return JSON.stringify(normalized);
}

export function buildRememberedWaterLabel(amountOz: number) {
  return `Water ${Math.max(1, Math.round(amountOz))} oz`;
}

export function resolveHydrationDisplayLabel(args: {
  amountOz: number;
  rememberedHydrationLabel?: string;
  shortcutLabel?: string;
}) {
  const rememberedHydrationLabel = args.rememberedHydrationLabel?.trim();

  if (rememberedHydrationLabel) {
    return rememberedHydrationLabel;
  }

  const shortcutLabel = args.shortcutLabel?.trim();

  if (shortcutLabel) {
    return shortcutLabel;
  }

  return buildRememberedWaterLabel(args.amountOz);
}

export function isSeededHydrationShortcutSignature(shortcut: LegacyHydrationShortcutSignature) {
  const normalizedLabel = normalizeLabel(shortcut.label);
  const isKnownSeedLabel = normalizedLabel === "water 8 oz" || normalizedLabel === "water 16 oz";

  return (
    shortcut.category === "water" &&
    (shortcut.defaultAmountOz === 8 || shortcut.defaultAmountOz === 16) &&
    shortcut.pinned &&
    shortcut.logMode === "hydration_only" &&
    shortcut.mealType === "drink" &&
    shortcut.calories === 0 &&
    shortcut.protein === 0 &&
    shortcut.carbs === 0 &&
    shortcut.fat === 0 &&
    isKnownSeedLabel
  );
}

export function getLegacyHydrationShortcutInitialFavoritedState() {
  return false;
}

export function getRememberedEntrySummary(args: {
  amountOz?: number;
  mealType?: MealType;
  replayKind: RememberedEntryReplayKind;
}) {
  if (args.replayKind === "hydration_only") {
    return `Hydration${args.amountOz ? ` • ${Math.round(args.amountOz)} oz` : ""}`;
  }

  if (args.replayKind === "meal_and_hydration") {
    const mealLabel = args.mealType ? `${args.mealType[0].toUpperCase()}${args.mealType.slice(1)}` : "Meal";
    return `${mealLabel} + hydration${args.amountOz ? ` • ${Math.round(args.amountOz)} oz` : ""}`;
  }

  if (!args.mealType) {
    return "Meal";
  }

  return `${args.mealType[0].toUpperCase()}${args.mealType.slice(1)}`;
}
