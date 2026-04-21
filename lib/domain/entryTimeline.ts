import { buildMealNutritionRows, MealMacroTargets, MealMacroTotals } from "./mealNutritionRows";
import {
  buildMealTimelineEntries,
  MealTimelineEntryMethod,
  MealTimelineMealEntry,
} from "./mealTimeline";
import { MealType } from "./meals";
import { DetailedNutrientInput, DetailedNutrientTargets } from "./nutrients";
import { resolveHydrationDisplayLabel } from "./rememberedEntries";
import { SupplementLogSnapshot } from "./supplements";
import { ouncesToCups } from "./wellness";

export type TimelineHydrationEntry = {
  amountCups: number;
  amountOz: number;
  id: string;
  kind: "hydration";
  label: string;
  timestamp: number;
};

export type TimelineSupplementEntry = {
  calories: number;
  carbs: number;
  fat: number;
  id: string;
  kind: "supplement";
  label: string;
  nutritionRows: MealTimelineMealEntry["nutritionRows"];
  protein: number;
  servingLabel: string;
  timestamp: number;
};

export type TimelineEntry = MealTimelineMealEntry | TimelineHydrationEntry | TimelineSupplementEntry;

type TimelineMealInput = {
  entryMethod: MealTimelineEntryMethod;
  id: string;
  label?: string;
  mealType: MealType;
  nutrients: DetailedNutrientInput;
  timestamp: number;
  totals: MealMacroTotals;
};

type TimelineMealItemInput = {
  foodName: string;
};

type TimelineHydrationInput = {
  amountOz: number;
  id: string;
  rememberedHydrationLabel?: string;
  shortcutLabel?: string;
  timestamp: number;
};

export function buildEntryTimeline({
  detailedNutritionTargets,
  hydrationLogs,
  includeHydration = true,
  macroTargets,
  mealItemsByMealId,
  meals,
  supplementLogs = [],
}: {
  detailedNutritionTargets: DetailedNutrientTargets;
  hydrationLogs: TimelineHydrationInput[];
  includeHydration?: boolean;
  macroTargets: MealMacroTargets;
  mealItemsByMealId: Map<string, TimelineMealItemInput[]>;
  meals: TimelineMealInput[];
  supplementLogs?: SupplementLogSnapshot[];
}): TimelineEntry[] {
  const mealEntries = buildMealTimelineEntries({
    detailedNutritionTargets,
    macroTargets,
    mealItemsByMealId,
    meals,
  });
  const supplementEntries: TimelineSupplementEntry[] = supplementLogs.map((entry) => ({
    calories: entry.totals.calories,
    carbs: entry.totals.carbs,
    fat: entry.totals.fat,
    id: entry.id,
    kind: "supplement",
    label: entry.label,
    nutritionRows: buildMealNutritionRows({
      detailedNutritionTargets,
      macroTargets,
      nutrients: entry.nutrients,
      totals: entry.totals,
    }),
    protein: entry.totals.protein,
    servingLabel: entry.servingLabel,
    timestamp: entry.timestamp,
  }));
  const hydrationEntries: TimelineHydrationEntry[] = includeHydration
    ? hydrationLogs.map((entry) => ({
        amountCups: ouncesToCups(entry.amountOz),
        amountOz: entry.amountOz,
        id: entry.id,
        kind: "hydration",
        label: resolveHydrationDisplayLabel({
          amountOz: entry.amountOz,
          rememberedHydrationLabel: entry.rememberedHydrationLabel,
          shortcutLabel: entry.shortcutLabel,
        }),
        timestamp: entry.timestamp,
      }))
    : [];

  return [...mealEntries, ...supplementEntries, ...hydrationEntries].sort(
    (left, right) => right.timestamp - left.timestamp
  );
}
