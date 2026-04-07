import {
  MealMacroTargets,
  MealMacroTotals,
  buildMealNutritionRows,
} from "./mealNutritionRows";
import { MealType } from "./meals";
import { DetailedNutrientInput, DetailedNutrientTargets } from "./nutrients";
import { NutrientProgressRow } from "./nutrientProgress";

export type MealTimelineEntryMethod =
  | "manual"
  | "photo_scan"
  | "ai_text"
  | "search"
  | "barcode"
  | "saved_meal";

export type MealTimelineMealEntry = {
  calories: number;
  carbs: number;
  entryMethod: MealTimelineEntryMethod;
  entryMethodLabel: string;
  fat: number;
  id: string;
  itemCount: number;
  kind: "meal";
  label: string;
  mealType: MealType;
  nutritionRows: NutrientProgressRow[];
  protein: number;
  timestamp: number;
};

type MealTimelineMealInput = {
  entryMethod: MealTimelineEntryMethod;
  id: string;
  label?: string;
  mealType: MealType;
  nutrients: DetailedNutrientInput;
  timestamp: number;
  totals: MealMacroTotals;
};

type MealTimelineMealItemInput = {
  foodName: string;
};

export function deriveMealTimelineLabel(
  meal: Pick<MealTimelineMealInput, "label">,
  items: MealTimelineMealItemInput[]
) {
  if (meal.label?.trim()) {
    return meal.label.trim();
  }

  if (items.length === 1) {
    return items[0].foodName;
  }

  return `${items.length} items`;
}

export function getMealEntryMethodLabel(entryMethod: MealTimelineEntryMethod) {
  if (entryMethod === "photo_scan") {
    return "FoodScan";
  }

  if (entryMethod === "ai_text") {
    return "Text entry";
  }

  if (entryMethod === "saved_meal") {
    return "Saved";
  }

  if (entryMethod === "barcode") {
    return "Barcode";
  }

  if (entryMethod === "search") {
    return "Search";
  }

  return "Manual";
}

export function buildMealTimelineEntries({
  detailedNutritionTargets,
  macroTargets,
  mealItemsByMealId,
  meals,
}: {
  detailedNutritionTargets: DetailedNutrientTargets;
  macroTargets: MealMacroTargets;
  mealItemsByMealId: Map<string, MealTimelineMealItemInput[]>;
  meals: MealTimelineMealInput[];
}): MealTimelineMealEntry[] {
  return meals.map((meal) => {
    const items = mealItemsByMealId.get(meal.id) ?? [];

    return {
      calories: meal.totals.calories,
      carbs: meal.totals.carbs,
      entryMethod: meal.entryMethod,
      entryMethodLabel: getMealEntryMethodLabel(meal.entryMethod),
      fat: meal.totals.fat,
      id: meal.id,
      itemCount: items.length,
      kind: "meal",
      label: deriveMealTimelineLabel(meal, items),
      mealType: meal.mealType,
      nutritionRows: buildMealNutritionRows({
        detailedNutritionTargets,
        macroTargets,
        nutrients: meal.nutrients,
        totals: meal.totals,
      }),
      protein: meal.totals.protein,
      timestamp: meal.timestamp,
    };
  });
}
