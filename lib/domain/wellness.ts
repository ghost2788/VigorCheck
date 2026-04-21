import type { GoalType, Sex } from "./targets";

export type NutritionKey =
  | "fiber"
  | "potassium"
  | "calcium"
  | "iron"
  | "vitaminD"
  | "vitaminC";

export type NutritionTargets = Record<NutritionKey, number>;
export type NutritionAmounts = Record<NutritionKey, number>;
export type WellnessKey =
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "hydration"
  | "nutrition";
export type WellnessWeights = Record<WellnessKey, number>;

const NUTRITION_KEYS: NutritionKey[] = [
  "fiber",
  "potassium",
  "calcium",
  "iron",
  "vitaminD",
  "vitaminC",
];

const WELLNESS_WEIGHT_BY_GOAL: Record<GoalType, WellnessWeights> = {
  energy_balance: {
    calories: 0.24,
    carbs: 0.17,
    fat: 0.16,
    hydration: 0.13,
    nutrition: 0.12,
    protein: 0.18,
  },
  fat_loss: {
    calories: 0.3,
    carbs: 0.18,
    fat: 0.12,
    hydration: 0.1,
    nutrition: 0.1,
    protein: 0.2,
  },
  general_health: {
    calories: 0.18,
    carbs: 0.14,
    fat: 0.12,
    hydration: 0.18,
    nutrition: 0.22,
    protein: 0.16,
  },
  muscle_gain: {
    calories: 0.25,
    carbs: 0.2,
    fat: 0.12,
    hydration: 0.1,
    nutrition: 0.1,
    protein: 0.23,
  },
};

export function getNutritionKeys() {
  return [...NUTRITION_KEYS];
}

export function getWellnessWeights(goalType: GoalType): WellnessWeights {
  return { ...WELLNESS_WEIGHT_BY_GOAL[goalType] };
}

export function scoreWeightedWellness(
  goalType: GoalType,
  scores: Record<WellnessKey, number>
) {
  const weights = getWellnessWeights(goalType);

  return Math.round(
    (Object.keys(weights) as WellnessKey[]).reduce(
      (total, key) => total + scores[key] * weights[key],
      0
    )
  );
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
