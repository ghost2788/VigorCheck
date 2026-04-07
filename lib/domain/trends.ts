import { buildTodayDashboard, DashboardTargets, NutritionRow } from "./dashboard";
import { MealTimelineEntryMethod } from "./mealTimeline";
import {
  buildGroupedNutrientDetails,
  buildNutrientInsights,
  createEmptyDetailedNutrientTotals,
  DetailedNutrientTargets,
  type DetailedNutrientInput,
  type DetailedNutrientKey,
  type NutrientDetailGroup,
} from "./nutrients";
import { NutritionAmounts, NutritionKey, getNutritionKeys, ouncesToCups } from "./wellness";
import { MealType } from "./meals";
import { SupplementLogSnapshot } from "./supplements";

type TrendMealInput = {
  entryMethod: MealTimelineEntryMethod;
  id: string;
  label?: string;
  mealType: MealType;
  nutrients: NutritionAmounts & DetailedNutrientInput;
  timestamp: number;
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
};

type TrendHydrationLogInput = {
  amountOz: number;
  id: string;
  timestamp: number;
};

export type TrendDay = {
  calories: number;
  caloriesScore: number;
  dateKey: string;
  didLogAnything: boolean;
  hydrationCups: number;
  hydrationScore: number;
  isFuture: boolean;
  nutritionCoveragePercent: number;
  nutrientDetailGroups: NutrientDetailGroup[];
  nutrients: NutritionRow[];
  protein: number;
  proteinScore: number;
  shortLabel: string;
  wellnessScore: number;
};

export type WeeklyNutritionSummary = {
  averageCoveragePercent: number;
  detailGroups: NutrientDetailGroup[];
  nutrients: Array<{
    averagePercent: number;
    key: NutritionKey;
    target: number;
  }>;
  recurringGaps: DetailedNutrientKey[];
  recurringWins: DetailedNutrientKey[];
};

function formatShortLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
  });
}

function formatNutritionLabel(key: DetailedNutrientKey) {
  if (key === "vitaminC") {
    return "vitamin C";
  }

  if (key === "vitaminD") {
    return "vitamin D";
  }

  if (key === "omega3") {
    return "omega-3";
  }

  return key;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildTrendDay({
  dateKey,
  hydrationLogs,
  isFuture,
  meals,
  supplementLogs = [],
  targets,
}: {
  dateKey: string;
  hydrationLogs: TrendHydrationLogInput[];
  isFuture: boolean;
  meals: TrendMealInput[];
  supplementLogs?: SupplementLogSnapshot[];
  targets: DashboardTargets;
}): TrendDay {
  const dashboard = buildTodayDashboard({
    hydrationLogs,
    mealItems: [],
    meals,
    supplementLogs,
    targets,
  });

  return {
    calories: dashboard.totals.calories,
    caloriesScore: dashboard.cards.calories.score,
    dateKey,
    didLogAnything: meals.length > 0 || hydrationLogs.length > 0 || supplementLogs.length > 0,
    hydrationCups: dashboard.cards.hydration.consumedCups,
    hydrationScore: dashboard.cards.hydration.score,
    isFuture,
    nutritionCoveragePercent: dashboard.cards.nutrition.coveragePercent,
    nutrientDetailGroups: dashboard.cards.nutrition.detailGroups,
    nutrients: dashboard.cards.nutrition.nutrients,
    protein: dashboard.totals.protein,
    proteinScore: dashboard.cards.protein.score,
    shortLabel: formatShortLabel(dateKey),
    wellnessScore: dashboard.wellness.score,
  };
}

export function summarizeWeeklyNutrition({
  days,
}: {
  days: Array<Pick<TrendDay, "isFuture" | "nutrientDetailGroups" | "nutrients">>;
}): WeeklyNutritionSummary {
  const elapsedDays = days.filter((day) => !day.isFuture);
  const nutrientSummaries = getNutritionKeys().map((key) => {
    const nutrientDays = elapsedDays.map((day) => day.nutrients.find((entry) => entry.key === key));
    const target = nutrientDays.find(Boolean)?.target ?? 0;
    const averageRatio = average(
      nutrientDays.map((entry) => {
        if (!entry?.target) {
          return 0;
        }

        return entry.consumed / entry.target;
      })
    );

    return {
      averagePercent: Math.round(Math.min(averageRatio, 1) * 100),
      averageRatio,
      key,
      target,
    };
  });

  const weeklyDetailTotals = elapsedDays.reduce((totals, day) => {
    for (const group of day.nutrientDetailGroups ?? []) {
      for (const nutrient of group.nutrients) {
        totals[nutrient.key as DetailedNutrientKey] += nutrient.value;
      }
    }

    return totals;
  }, createEmptyDetailedNutrientTotals());

  for (const key of Object.keys(weeklyDetailTotals) as DetailedNutrientKey[]) {
    weeklyDetailTotals[key] = Math.round(weeklyDetailTotals[key] * 10) / 10;
  }
  const detailTargets = elapsedDays.reduce<DetailedNutrientTargets | null>((targets, day) => {
    if (targets) {
      return targets;
    }

    const nextTargets = {} as DetailedNutrientTargets;

    for (const group of day.nutrientDetailGroups ?? []) {
      for (const nutrient of group.nutrients) {
        nextTargets[nutrient.key] = nutrient.target;
      }
    }

    return Object.keys(nextTargets).length > 0 ? nextTargets : null;
  }, null);
  const weeklyDetailTargets =
    detailTargets === null
      ? null
      : (Object.fromEntries(
          Object.entries(detailTargets).map(([key, value]) => [
            key,
            Math.round(value * elapsedDays.length * 10) / 10,
          ])
        ) as DetailedNutrientTargets);
  const detailInsights =
    weeklyDetailTargets === null
      ? { biggestGaps: [], topWins: [] }
      : buildNutrientInsights({
          targets: weeklyDetailTargets,
          totals: weeklyDetailTotals,
        });

  return {
    averageCoveragePercent: Math.round(
      average(nutrientSummaries.map((nutrient) => nutrient.averagePercent))
    ),
    detailGroups:
      weeklyDetailTargets === null
        ? []
        : buildGroupedNutrientDetails({
            targets: weeklyDetailTargets,
            totals: weeklyDetailTotals,
          }),
    nutrients: nutrientSummaries.map(({ averagePercent, key, target }) => ({
      averagePercent,
      key,
      target,
    })),
    recurringGaps: detailInsights.biggestGaps.map((entry) => entry.key),
    recurringWins: detailInsights.topWins.map((entry) => entry.key),
  };
}

export function buildWeeklyOverview({
  days,
  recurringGaps,
}: {
  days: TrendDay[];
  recurringGaps: DetailedNutrientKey[];
}) {
  const elapsedDays = days.filter((day) => !day.isFuture);
  const averageCalories = Math.round(average(elapsedDays.map((day) => day.calories)));
  const proteinGoalDays = elapsedDays.filter((day) => day.proteinScore >= 100).length;
  const onTrackDays = elapsedDays.filter((day) => day.wellnessScore >= 70).length;
  const gapCopy = recurringGaps.map(formatNutritionLabel).join(" and ");

  return {
    onTrackDays,
    summaryText:
      elapsedDays.length === 0
        ? "No data logged yet this week."
        : `This week you're averaging ${averageCalories.toLocaleString()} kcal/day. Protein was on track ${proteinGoalDays} of ${elapsedDays.length} days. Lowest coverage: ${gapCopy}.`,
    weeklyWellnessScore: Math.round(average(elapsedDays.map((day) => day.wellnessScore))),
  };
}

export function getHydrationCupsFromOz(amountOz: number) {
  return ouncesToCups(amountOz);
}
