import type { WellnessKey } from "./wellness";

export function getAtAGlanceMessage({
  biggestGapKey,
  calorieProgressPercent,
}: {
  biggestGapKey: WellnessKey;
  calorieProgressPercent: number;
}) {
  if (calorieProgressPercent >= 100) {
    return "You've reached your calorie target for the day.";
  }

  if (biggestGapKey === "hydration") {
    return "Hydration could use a little more attention.";
  }

  if (biggestGapKey === "protein") {
    return "Protein is still building today.";
  }

  if (biggestGapKey === "nutrition") {
    return "Nutrition coverage is still building today.";
  }

  if (calorieProgressPercent >= 80) {
    return "You're getting close to your calorie target.";
  }

  return "Calories are still building toward your target.";
}

export function getDisplayedRingProgress({
  rawProgressPercent,
  score,
}: {
  rawProgressPercent: number;
  score: number;
}) {
  return Math.max(0, Math.min(100, Math.max(rawProgressPercent, score)));
}

export function getClampedProgressPercent(percent: number) {
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getNutritionCoverageDescriptor(coveragePercent: number) {
  const percent = getClampedProgressPercent(coveragePercent);

  if (percent >= 100) {
    return "Complete";
  }

  if (percent >= 75) {
    return "Strong coverage";
  }

  if (percent >= 50) {
    return "Solid coverage";
  }

  if (percent >= 25) {
    return "Building coverage";
  }

  return "Getting started";
}

export function getNutritionCoverageDetailCopy() {
  return "Coverage reflects foods with tracked nutrients across the expanded vitamin, mineral, and nutrient set.";
}

export function getTargetRelativeBarPercent({
  target,
  value,
}: {
  target: number;
  value: number;
}) {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}
