import { buildTodayDashboard, DashboardTargets, NutritionRow } from "./dashboard";
import {
  buildGroupedNutrientDetails,
  createEmptyDetailedNutrientTotals,
  type DetailedNutrientInput,
  type DetailedNutrientKey,
  type NutrientDetailGroup,
} from "./nutrients";
import { NutritionAmounts, NutritionKey, getNutritionKeys, ouncesToCups } from "./wellness";

type TrendMealInput = {
  id: string;
  label?: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
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
  recurringGaps: NutritionKey[];
};

function formatShortLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
  });
}

function formatNutritionLabel(key: NutritionKey) {
  if (key === "vitaminC") {
    return "vitamin C";
  }

  if (key === "vitaminD") {
    return "vitamin D";
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
  targets,
}: {
  dateKey: string;
  hydrationLogs: TrendHydrationLogInput[];
  isFuture: boolean;
  meals: TrendMealInput[];
  targets: DashboardTargets;
}): TrendDay {
  const dashboard = buildTodayDashboard({
    hydrationLogs,
    mealItems: [],
    meals,
    targets,
  });

  return {
    calories: dashboard.totals.calories,
    caloriesScore: dashboard.cards.calories.score,
    dateKey,
    didLogAnything: meals.length > 0 || hydrationLogs.length > 0,
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

  const recurringGaps = [...nutrientSummaries]
    .sort((left, right) => {
      if (left.averageRatio !== right.averageRatio) {
        return left.averageRatio - right.averageRatio;
      }

      return getNutritionKeys().indexOf(left.key) - getNutritionKeys().indexOf(right.key);
    })
    .slice(0, 2)
    .map((entry) => entry.key);
  const averageDetailTotals = elapsedDays.reduce((totals, day) => {
    for (const group of day.nutrientDetailGroups ?? []) {
      for (const nutrient of group.nutrients) {
        totals[nutrient.key as DetailedNutrientKey] += nutrient.value;
      }
    }

    return totals;
  }, createEmptyDetailedNutrientTotals());

  for (const key of Object.keys(averageDetailTotals) as DetailedNutrientKey[]) {
    averageDetailTotals[key] =
      elapsedDays.length === 0 ? 0 : Math.round((averageDetailTotals[key] / elapsedDays.length) * 10) / 10;
  }

  return {
    averageCoveragePercent: Math.round(
      average(nutrientSummaries.map((nutrient) => nutrient.averagePercent))
    ),
    detailGroups: buildGroupedNutrientDetails(averageDetailTotals),
    nutrients: nutrientSummaries.map(({ averagePercent, key, target }) => ({
      averagePercent,
      key,
      target,
    })),
    recurringGaps,
  };
}

export function buildWeeklyOverview({
  days,
  recurringGaps,
}: {
  days: TrendDay[];
  recurringGaps: NutritionKey[];
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
