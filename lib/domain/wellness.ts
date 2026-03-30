import type { Sex } from "./targets";

export type NutritionKey =
  | "fiber"
  | "potassium"
  | "calcium"
  | "iron"
  | "vitaminD"
  | "vitaminC";

export type NutritionTargets = Record<NutritionKey, number>;
export type NutritionAmounts = Record<NutritionKey, number>;
export type WellnessKey = "calories" | "protein" | "hydration" | "nutrition";

const NUTRITION_KEYS: NutritionKey[] = [
  "fiber",
  "potassium",
  "calcium",
  "iron",
  "vitaminD",
  "vitaminC",
];

export function getNutritionKeys() {
  return [...NUTRITION_KEYS];
}

export function roundPercent(value: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.round((value / target) * 100);
}

export function scoreGoalProgress(value: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.round(Math.min(value / target, 1) * 100);
}

export function scoreCaloriesTargetCloseness(consumed: number, target: number) {
  if (!target) {
    return 0;
  }

  const deviation = Math.abs(consumed - target) / target;

  if (deviation <= 0.1) {
    return 100;
  }

  if (deviation >= 0.5) {
    return 0;
  }

  return Math.round((1 - (deviation - 0.1) / 0.4) * 100);
}

export function ouncesToCups(amountOz: number) {
  return Math.round((amountOz / 8) * 100) / 100;
}

export function rankMealNutritionContribution({
  meal,
  targets,
}: {
  meal: NutritionAmounts;
  targets: NutritionTargets;
}) {
  return getNutritionKeys().reduce((total, key) => {
    const target = targets[key];

    if (!target) {
      return total;
    }

    return total + meal[key] / target;
  }, 0);
}

export function getNutritionTargets({
  age,
  sex,
  targetFiber,
}: {
  age: number;
  sex: Sex;
  targetFiber: number;
}): NutritionTargets {
  const normalizedAge = Math.max(age, 19);

  if (sex === "male") {
    return {
      calcium: normalizedAge >= 71 ? 1200 : 1000,
      fiber: targetFiber,
      iron: 8,
      potassium: 3400,
      vitaminC: 90,
      vitaminD: normalizedAge >= 71 ? 20 : 15,
    };
  }

  return {
    calcium: normalizedAge >= 51 ? 1200 : 1000,
    fiber: targetFiber,
    iron: normalizedAge >= 51 ? 8 : 18,
    potassium: 2600,
    vitaminC: 75,
    vitaminD: normalizedAge >= 71 ? 20 : 15,
  };
}

