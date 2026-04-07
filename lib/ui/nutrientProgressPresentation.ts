import { NutrientProgressRow } from "../domain/nutrientProgress";

const MACRO_KEYS = new Set(["calories", "protein", "carbs", "fat"]);
const MAXIMUM_KEYS = new Set(["sodium", "sugar"]);

export function getClampedProgressFillPercent(progressRatio: number) {
  if (!Number.isFinite(progressRatio) || progressRatio <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(progressRatio * 100)));
}

export function getRenderableProgressRatio(row: NutrientProgressRow) {
  if (Number.isFinite(row.progressRatio) && row.progressRatio > 0) {
    return row.progressRatio;
  }

  if (!Number.isFinite(row.target) || row.target <= 0) {
    return 0;
  }

  return row.value / row.target;
}

export function getRenderableRowKind(row: NutrientProgressRow): NutrientProgressRow["rowKind"] {
  if (row.rowKind === "macro" || row.rowKind === "nutrient") {
    return row.rowKind;
  }

  return MACRO_KEYS.has(row.key) ? "macro" : "nutrient";
}

export function getRenderableGoalKind(row: NutrientProgressRow): NutrientProgressRow["goalKind"] {
  if (
    row.goalKind === "goal" ||
    row.goalKind === "maximum" ||
    row.goalKind === "soft_maximum"
  ) {
    return row.goalKind;
  }

  if (row.key === "calories") {
    return "soft_maximum";
  }

  if (MAXIMUM_KEYS.has(row.key)) {
    return "maximum";
  }

  return "goal";
}

export function shouldShowStaticReward(row: NutrientProgressRow) {
  const progressRatio = getRenderableProgressRatio(row);
  const goalKind = getRenderableGoalKind(row);

  if (!Number.isFinite(progressRatio) || progressRatio <= 0 || row.target <= 0) {
    return false;
  }

  return goalKind === "goal" && progressRatio >= 1;
}
