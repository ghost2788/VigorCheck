import { formatClockTime, parseClockTime, ReminderSettings } from "./reminders";
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  EditableMacroTargets,
  GOAL_OPTIONS,
  GOAL_PACE_OPTIONS,
  GoalPace,
  GoalType,
  inchesToCentimeters,
  kilogramsToPounds,
  poundsToKilograms,
  PRIMARY_TRACKING_CHALLENGE_OPTIONS,
  PreferredUnitSystem,
  PrimaryTrackingChallenge,
  requiresGoalPace,
  SEX_OPTIONS,
  Sex,
  UNIT_SYSTEM_OPTIONS,
} from "./targets";

export type PlanSettings = {
  activityLevel: ActivityLevel;
  age: number;
  goalPace?: GoalPace;
  goalType: GoalType;
  height: number;
  preferredUnitSystem: PreferredUnitSystem;
  primaryTrackingChallenge: PrimaryTrackingChallenge;
  sex: Sex;
  targets: EditableMacroTargets;
  timeZone: string;
  weight: number;
};

export type PlanSettingsPatch = Partial<Omit<PlanSettings, "targets">> & {
  targets?: EditableMacroTargets;
};

export type SummaryItem = {
  label: string;
  value: string;
};

function getLabel<T extends string>(
  options: ReadonlyArray<{ label: string; value: T }>,
  value: T | undefined,
  fallback: string
) {
  if (!value) {
    return fallback;
  }

  return options.find((option) => option.value === value)?.label ?? fallback;
}

function areTargetsEqual(left: EditableMacroTargets, right: EditableMacroTargets) {
  return (
    left.calories === right.calories &&
    left.carbs === right.carbs &&
    left.fat === right.fat &&
    left.protein === right.protein
  );
}

export function normalizePlanSettings(settings: PlanSettings): PlanSettings {
  return {
    ...settings,
    goalPace: requiresGoalPace(settings.goalType) ? settings.goalPace ?? "moderate" : undefined,
  };
}

export function mergePlanSettings(
  current: PlanSettings,
  patch: PlanSettingsPatch
): PlanSettings {
  const merged = {
    ...current,
    ...patch,
    targets: patch.targets ?? current.targets,
  };

  return normalizePlanSettings(merged);
}

export function diffPlanSettings(
  current: PlanSettings,
  next: PlanSettings
): PlanSettingsPatch {
  const normalizedCurrent = normalizePlanSettings(current);
  const normalizedNext = normalizePlanSettings(next);
  const patch: PlanSettingsPatch = {};

  if (normalizedCurrent.activityLevel !== normalizedNext.activityLevel) {
    patch.activityLevel = normalizedNext.activityLevel;
  }

  if (normalizedCurrent.age !== normalizedNext.age) {
    patch.age = normalizedNext.age;
  }

  if (normalizedCurrent.goalType !== normalizedNext.goalType) {
    patch.goalType = normalizedNext.goalType;
  }

  if (
    requiresGoalPace(normalizedNext.goalType) &&
    normalizedCurrent.goalPace !== normalizedNext.goalPace
  ) {
    patch.goalPace = normalizedNext.goalPace;
  }

  if (normalizedCurrent.height !== normalizedNext.height) {
    patch.height = normalizedNext.height;
  }

  if (normalizedCurrent.preferredUnitSystem !== normalizedNext.preferredUnitSystem) {
    patch.preferredUnitSystem = normalizedNext.preferredUnitSystem;
  }

  if (
    normalizedCurrent.primaryTrackingChallenge !== normalizedNext.primaryTrackingChallenge
  ) {
    patch.primaryTrackingChallenge = normalizedNext.primaryTrackingChallenge;
  }

  if (normalizedCurrent.sex !== normalizedNext.sex) {
    patch.sex = normalizedNext.sex;
  }

  if (!areTargetsEqual(normalizedCurrent.targets, normalizedNext.targets)) {
    patch.targets = normalizedNext.targets;
  }

  if (normalizedCurrent.timeZone !== normalizedNext.timeZone) {
    patch.timeZone = normalizedNext.timeZone;
  }

  if (normalizedCurrent.weight !== normalizedNext.weight) {
    patch.weight = normalizedNext.weight;
  }

  return patch;
}

export function toPlanSettings(user: {
  activityLevel: ActivityLevel;
  age: number;
  goalPace?: GoalPace;
  goalType: GoalType;
  height: number;
  preferredUnitSystem?: PreferredUnitSystem;
  primaryTrackingChallenge?: PrimaryTrackingChallenge;
  sex: Sex;
  targets: EditableMacroTargets;
  timeZone: string;
  weight: number;
}): PlanSettings {
  return normalizePlanSettings({
    activityLevel: user.activityLevel,
    age: user.age,
    goalPace: user.goalPace,
    goalType: user.goalType,
    height: user.height,
    preferredUnitSystem: user.preferredUnitSystem ?? "imperial",
    primaryTrackingChallenge: user.primaryTrackingChallenge ?? "consistency",
    sex: user.sex,
    targets: user.targets,
    timeZone: user.timeZone,
    weight: user.weight,
  });
}

export function formatGoalTypeLabel(goalType: GoalType) {
  return getLabel(GOAL_OPTIONS, goalType, "Goal");
}

export function formatGoalPaceLabel(goalPace?: GoalPace) {
  return getLabel(
    GOAL_PACE_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    goalPace,
    "Not set"
  );
}

export function formatPrimaryTrackingChallengeLabel(challenge?: PrimaryTrackingChallenge) {
  return getLabel(PRIMARY_TRACKING_CHALLENGE_OPTIONS, challenge, "Not set");
}

export function formatActivityLevelLabel(activityLevel: ActivityLevel) {
  return getLabel(ACTIVITY_OPTIONS, activityLevel, "Activity");
}

export function formatSexLabel(sex: Sex) {
  return getLabel(SEX_OPTIONS, sex, "Sex");
}

export function formatUnitSystemLabel(unitSystem: PreferredUnitSystem) {
  return getLabel(UNIT_SYSTEM_OPTIONS, unitSystem, "Units");
}

export function formatHeightSummary(heightInches: number, unitSystem: PreferredUnitSystem) {
  if (unitSystem === "metric") {
    return `${Math.round(inchesToCentimeters(heightInches))} cm`;
  }

  const totalInches = Math.round(heightInches);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}'${inches}"`;
}

export function formatWeightSummary(weightPounds: number, unitSystem: PreferredUnitSystem) {
  if (unitSystem === "metric") {
    return `${Math.round(poundsToKilograms(weightPounds))} kg`;
  }

  return `${Math.round(weightPounds)} lb`;
}

export function formatClockTimeDisplay(timeValue: string) {
  const parsed = parseClockTime(timeValue);

  if (!parsed) {
    return "--:--";
  }

  return new Date(2026, 0, 1, parsed.hour, parsed.minute, 0, 0).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getReminderEnabledCount(settings: ReminderSettings) {
  return [
    settings.notifyHydration,
    settings.notifyMealLogging,
    settings.notifyGoalCompletion,
    settings.notifyEndOfDay,
  ].filter(Boolean).length;
}

export function formatReminderSummary(settings: ReminderSettings) {
  const enabledCount = getReminderEnabledCount(settings);
  const wakeTime = formatClockTimeDisplay(formatClockTime(parseClockTime(settings.wakeTime) ?? { hour: 7, minute: 0 }));
  const sleepTime = formatClockTimeDisplay(formatClockTime(parseClockTime(settings.sleepTime) ?? { hour: 22, minute: 0 }));

  if (enabledCount === 0) {
    return `Off · ${wakeTime} - ${sleepTime}`;
  }

  return `${enabledCount} on · ${wakeTime} - ${sleepTime}`;
}

export function buildGoalsAndTargetsSummary(settings: PlanSettings): SummaryItem[] {
  return [
    {
      label: "Goal",
      value: formatGoalTypeLabel(settings.goalType),
    },
    {
      label: "Pace",
      value: requiresGoalPace(settings.goalType)
        ? formatGoalPaceLabel(settings.goalPace)
        : "Not used",
    },
    {
      label: "Calories",
      value: `${settings.targets.calories} kcal`,
    },
    {
      label: "Protein",
      value: `${settings.targets.protein} g`,
    },
    {
      label: "Carbs",
      value: `${settings.targets.carbs} g`,
    },
    {
      label: "Fat",
      value: `${settings.targets.fat} g`,
    },
  ];
}

export function buildBodyAndPreferencesSummary(settings: PlanSettings): SummaryItem[] {
  return [
    {
      label: "Sex",
      value: formatSexLabel(settings.sex),
    },
    {
      label: "Age",
      value: `${settings.age}`,
    },
    {
      label: "Height",
      value: formatHeightSummary(settings.height, settings.preferredUnitSystem),
    },
    {
      label: "Weight",
      value: formatWeightSummary(settings.weight, settings.preferredUnitSystem),
    },
    {
      label: "Activity",
      value: formatActivityLevelLabel(settings.activityLevel),
    },
    {
      label: "Units",
      value: formatUnitSystemLabel(settings.preferredUnitSystem),
    },
  ];
}

export type ReminderSummaryItem = {
  label: string;
  enabled: boolean;
};

export function buildReminderSummaryItems(settings: ReminderSettings): ReminderSummaryItem[] {
  return [
    { label: "Hydration", enabled: settings.notifyHydration },
    { label: "Meal logging", enabled: settings.notifyMealLogging },
    { label: "Goal completion", enabled: settings.notifyGoalCompletion },
    { label: "End-of-day", enabled: settings.notifyEndOfDay },
  ];
}

