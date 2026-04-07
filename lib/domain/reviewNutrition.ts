import {
  DetailedNutrientTargets,
  buildGroupedNutrientDetails,
  sumDetailedNutrients,
} from "./nutrients";
import { NutrientProgressRow, buildExpandedNutrientProgressRows } from "./nutrientProgress";
import { NutritionFields } from "./scan";

const HIDDEN_REVIEW_KEYS = new Set(["calories", "protein", "carbs", "fat", "fiber"]);

type ReviewMacroKey = "calories" | "protein" | "carbs" | "fat";

export type ReviewMacroTargets = {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export type ReviewMacroRow = {
  amountLabel: string;
  barPercent: number;
  key: ReviewMacroKey;
  label: string;
  percent: number;
};

const REVIEW_MACRO_CONFIG: Array<{
  key: ReviewMacroKey;
  label: string;
  unit: "g" | "kcal";
}> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatMacroAmount(value: number, unit: "g" | "kcal") {
  return `${value} ${unit}`;
}

function resolveMacroPercent(value: number, target?: number | null) {
  if (typeof target !== "number" || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((value / target) * 100));
}

export function buildReviewMacroRows({
  nutrition,
  targets,
}: {
  nutrition: NutritionFields;
  targets?: ReviewMacroTargets | null;
}): ReviewMacroRow[] {
  return REVIEW_MACRO_CONFIG.flatMap((config) => {
    const value = nutrition[config.key];

    if (value <= 0) {
      return [];
    }

    const percent = resolveMacroPercent(value, targets?.[config.key]);

    return [
      {
        amountLabel: formatMacroAmount(value, config.unit),
        barPercent: clampPercent(percent),
        key: config.key,
        label: config.label,
        percent,
      },
    ];
  });
}

export function buildReviewNutrientRows({
  nutrition,
  targets,
}: {
  nutrition: NutritionFields;
  targets?: DetailedNutrientTargets | null;
}): NutrientProgressRow[] {
  if (!targets) {
    return [];
  }

  const totals = sumDetailedNutrients([{ nutrients: nutrition }]);
  return buildExpandedNutrientProgressRows({
    detailGroups: buildGroupedNutrientDetails({
      targets,
      totals,
    }),
  }).filter((row) => !HIDDEN_REVIEW_KEYS.has(row.key) && row.value > 0);
}
