export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type GoalType = "general_health" | "fat_loss" | "muscle_gain" | "energy_balance";
export type GoalPace = "slow" | "moderate" | "aggressive";
export type PreferredUnitSystem = "imperial" | "metric";
export type PrimaryTrackingChallenge =
  | "consistency"
  | "knowing_what_to_eat"
  | "portion_sizes"
  | "motivation";
export type Sex = "male" | "female";

export type ProfileBasics = {
  activityLevel: ActivityLevel;
  age: number;
  goalType: GoalType;
  height: number;
  sex: Sex;
  weight: number;
};

export type TargetComputationProfile = ProfileBasics & {
  goalPace?: GoalPace;
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

const GOAL_PACE_CALORIE_MODIFIERS: Record<
  Extract<GoalType, "fat_loss" | "muscle_gain">,
  Record<GoalPace, number>
> = {
  fat_loss: {
    aggressive: -750,
    moderate: -500,
    slow: -250,
  },
  muscle_gain: {
    aggressive: 450,
    moderate: 300,
    slow: 150,
  },
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

export const GOAL_PACE_OPTIONS: Array<{
  caption: string;
  icon: "turtle" | "rabbit" | "run-fast";
  label: string;
  value: GoalPace;
}> = [
  {
    caption: "Slow and steady",
    icon: "turtle",
    label: "Slow",
    value: "slow",
  },
  {
    caption: "Recommended",
    icon: "rabbit",
    label: "Moderate",
    value: "moderate",
  },
  {
    caption: "Harder to sustain",
    icon: "run-fast",
    label: "Aggressive",
    value: "aggressive",
  },
];

export const PRIMARY_TRACKING_CHALLENGE_OPTIONS: Array<{
  description: string;
  label: string;
  value: PrimaryTrackingChallenge;
}> = [
  {
    description: "You want logging to be easier to keep up with every day.",
    label: "Consistency",
    value: "consistency",
  },
  {
    description: "You want clearer direction on what actually supports your goal.",
    label: "Knowing what to eat",
    value: "knowing_what_to_eat",
  },
  {
    description: "You want less guesswork when portions or servings are unclear.",
    label: "Portion sizes",
    value: "portion_sizes",
  },
  {
    description: "You want feedback that keeps you engaged when progress feels slow.",
    label: "Motivation",
    value: "motivation",
  },
];

export const UNIT_SYSTEM_OPTIONS: Array<{ label: string; value: PreferredUnitSystem }> = [
  { label: "Imperial", value: "imperial" },
  { label: "Metric", value: "metric" },
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

export function requiresGoalPace(goalType?: GoalType) {
  return goalType === "fat_loss" || goalType === "muscle_gain";
}

export function poundsToKilograms(weight: number) {
  return weight * 0.45359237;
}

export function kilogramsToPounds(weightKg: number) {
  return weightKg / 0.45359237;
}

export function inchesToCentimeters(height: number) {
  return height * 2.54;
}

export function centimetersToInches(heightCm: number) {
  return heightCm / 2.54;
}

function computeBmr({ age, height, sex, weight }: Pick<ProfileBasics, "age" | "height" | "sex" | "weight">) {
  const weightKg = poundsToKilograms(weight);
  const heightCm = inchesToCentimeters(height);
  const sexModifier = sex === "male" ? 5 : -161;

  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexModifier;
}

function getCalorieModifier(profile: TargetComputationProfile) {
  if (requiresGoalPace(profile.goalType) && profile.goalPace) {
    return GOAL_PACE_CALORIE_MODIFIERS[profile.goalType][profile.goalPace];
  }

  return GOAL_CALORIE_MODIFIERS[profile.goalType];
}

export function computeBaseTargets(profile: TargetComputationProfile): BaseTargets {
  const bmr = computeBmr(profile);
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const calories = Math.round(maintenanceCalories + getCalorieModifier(profile));
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
