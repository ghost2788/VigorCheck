export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type GoalType = "general_health" | "fat_loss" | "muscle_gain" | "energy_balance";
export type Sex = "male" | "female";

export type ProfileBasics = {
  activityLevel: ActivityLevel;
  age: number;
  goalType: GoalType;
  height: number;
  sex: Sex;
  weight: number;
};

export type BaseTargets = {
  calories: number;
  carbs: number;
  fat: number;
  fiber: number;
  hydration: number;
  protein: number;
  sodium: number;
  sugar: number;
};

export type EditableMacroTargets = Pick<BaseTargets, "calories" | "carbs" | "fat" | "protein">;

export type ProfileFormSubmission = ProfileBasics & {
  targets: EditableMacroTargets;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  active: 1.725,
  light: 1.375,
  moderate: 1.55,
  sedentary: 1.2,
};

const GOAL_CALORIE_MODIFIERS: Record<GoalType, number> = {
  energy_balance: 0,
  fat_loss: -500,
  general_health: 0,
  muscle_gain: 300,
};

const PROTEIN_PER_POUND: Record<GoalType, number> = {
  energy_balance: 0.7,
  fat_loss: 0.9,
  general_health: 0.7,
  muscle_gain: 0.8,
};

const FAT_RATIOS: Record<GoalType, number> = {
  energy_balance: 0.3,
  fat_loss: 0.25,
  general_health: 0.3,
  muscle_gain: 0.25,
};

export const GOAL_OPTIONS: Array<{ label: string; value: GoalType }> = [
  { label: "General Health", value: "general_health" },
  { label: "Fat Loss", value: "fat_loss" },
  { label: "Muscle Gain", value: "muscle_gain" },
  { label: "Energy & Balance", value: "energy_balance" },
];

export const SEX_OPTIONS: Array<{ label: string; value: Sex }> = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export const ACTIVITY_OPTIONS: Array<{ label: string; value: ActivityLevel }> = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Active", value: "active" },
];

function poundsToKilograms(weight: number) {
  return weight * 0.45359237;
}

function inchesToCentimeters(height: number) {
  return height * 2.54;
}

function computeBmr({ age, height, sex, weight }: Pick<ProfileBasics, "age" | "height" | "sex" | "weight">) {
  const weightKg = poundsToKilograms(weight);
  const heightCm = inchesToCentimeters(height);
  const sexModifier = sex === "male" ? 5 : -161;

  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexModifier;
}

export function computeBaseTargets(profile: ProfileBasics): BaseTargets {
  const bmr = computeBmr(profile);
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const calories = Math.round(maintenanceCalories + GOAL_CALORIE_MODIFIERS[profile.goalType]);
  const protein = Math.round(profile.weight * PROTEIN_PER_POUND[profile.goalType]);
  const fat = Math.round((calories * FAT_RATIOS[profile.goalType]) / 9);
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0);
  const fiber = Math.round((calories / 1000) * 14);
  const hydration = Math.max(1, Math.round((profile.weight * 0.5) / 8));

  return {
    calories,
    carbs,
    fat,
    fiber,
    hydration,
    protein,
    sodium: 2300,
    sugar: profile.sex === "male" ? 36 : 25,
  };
}

export function resolveEditableTargets({
  computed,
  submitted,
}: {
  computed: BaseTargets;
  submitted: EditableMacroTargets;
}) {
  return {
    overrideCalories: submitted.calories === computed.calories ? undefined : submitted.calories,
    overrideCarbs: submitted.carbs === computed.carbs ? undefined : submitted.carbs,
    overrideFat: submitted.fat === computed.fat ? undefined : submitted.fat,
    overrideProtein: submitted.protein === computed.protein ? undefined : submitted.protein,
  };
}

export function resolveEffectiveTargets(user: {
  overrideCalories?: number;
  overrideCarbs?: number;
  overrideFat?: number;
  overrideProtein?: number;
  targetCalories: number;
  targetCarbs: number;
  targetFat: number;
  targetProtein: number;
}): EditableMacroTargets {
  return {
    calories: user.overrideCalories ?? user.targetCalories,
    carbs: user.overrideCarbs ?? user.targetCarbs,
    fat: user.overrideFat ?? user.targetFat,
    protein: user.overrideProtein ?? user.targetProtein,
  };
}
