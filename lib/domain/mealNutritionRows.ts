import {
  buildGroupedNutrientDetails,
  DetailedNutrientInput,
  DetailedNutrientTargets,
  sumDetailedNutrients,
} from "./nutrients";
import {
  NutrientProgressRow,
  buildExpandedNutrientProgressRows,
  resolveProgressRatio,
} from "./nutrientProgress";

export type MealMacroTargets = {
  calories?: number | null;
  carbs?: number | null;
  fat?: number | null;
  protein?: number | null;
};

export type MealMacroTotals = {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
};

const MACRO_ROW_CONFIG: Array<{
  key: keyof MealMacroTotals;
  label: string;
  unit: "g" | "kcal";
}> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

const HIDDEN_DETAIL_KEYS = new Set(["calories", "protein", "carbs", "fat"]);

function roundMacroPercent(value: number, target?: number | null) {
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.round((value / target) * 100);
}

function buildMacroNutritionRows({
  macroTargets,
  totals,
}: {
  macroTargets?: MealMacroTargets | null;
  totals: MealMacroTotals;
}): NutrientProgressRow[] {
  return MACRO_ROW_CONFIG.flatMap((config) => {
    const value = totals[config.key];

    if (value <= 0) {
      return [];
    }

    return [
      {
        goalKind: config.key === "calories" ? "soft_maximum" : "goal",
        key: config.key,
        label: config.label,
        percent: roundMacroPercent(value, macroTargets?.[config.key]),
        progressRatio: resolveProgressRatio(value, macroTargets?.[config.key]),
        rowKind: "macro",
        target: macroTargets?.[config.key] ?? 0,
        unit: config.unit,
        value,
      },
    ];
  });
}

function buildDetailedNutritionRows({
  detailedNutritionTargets,
  nutrients,
}: {
  detailedNutritionTargets?: DetailedNutrientTargets | null;
  nutrients: DetailedNutrientInput;
}): NutrientProgressRow[] {
  if (!detailedNutritionTargets) {
    return [];
  }

  return buildExpandedNutrientProgressRows({
    detailGroups: buildGroupedNutrientDetails({
      targets: detailedNutritionTargets,
      totals: sumDetailedNutrients([{ nutrients }]),
    }),
  }).filter((row) => !HIDDEN_DETAIL_KEYS.has(row.key) && row.value > 0);
}

export function buildMealNutritionRows({
  detailedNutritionTargets,
  macroTargets,
  nutrients,
  totals,
}: {
  detailedNutritionTargets?: DetailedNutrientTargets | null;
  macroTargets?: MealMacroTargets | null;
  nutrients: DetailedNutrientInput;
  totals: MealMacroTotals;
}): NutrientProgressRow[] {
  return [
    ...buildMacroNutritionRows({
      macroTargets,
      totals,
    }),
    ...buildDetailedNutritionRows({
      detailedNutritionTargets,
      nutrients,
    }),
  ];
}
