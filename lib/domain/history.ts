import { DashboardTargets, buildTodayDashboard } from "./dashboard";
import {
  DetailedNutrientInput,
  DetailedNutrientTargets,
} from "./nutrients";
import { buildEntryTimeline, TimelineEntry } from "./entryTimeline";
import { getMealEntryMethodLabel, MealTimelineEntryMethod } from "./mealTimeline";
import { SupplementLogSnapshot } from "./supplements";
import { getNutritionKeys, NutritionAmounts } from "./wellness";
import { MealType } from "./meals";

type HistoryMealInput = {
  id: string;
  label?: string;
  mealType: MealType;
  timestamp: number;
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
};

type HistorySummaryMealInput = HistoryMealInput & {
  entryMethod: MealTimelineEntryMethod;
  nutrients: NutritionAmounts & DetailedNutrientInput;
};

type HistoryMealItemInput = {
  foodName: string;
};

type HistoryHydrationInput = {
  amountOz: number;
  displayLabel?: string;
  id: string;
  shortcutLabel?: string;
  timestamp: number;
};

export type HistoryDaySummary = {
  calories: number;
  dateKey: string;
  entryCount: number;
  footerLabel: string;
  hydrationCups: number;
  mealCount: number;
  nutritionCoveragePercent: number;
  protein: number;
  supplementCount: number;
  wellnessScore: number;
};

export type HistoryTimelineEntry = TimelineEntry;

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildHistoryFooterLabel({
  hydrationCount,
  mealCount,
  supplementCount,
}: {
  hydrationCount: number;
  mealCount: number;
  supplementCount: number;
}) {
  const entryCount = hydrationCount + mealCount + supplementCount;

  if (entryCount === 0) {
    return "No entries";
  }

  if (entryCount === supplementCount) {
    return formatCountLabel(supplementCount, "supplement");
  }

  if (supplementCount > 0) {
    return `${formatCountLabel(entryCount, "logged item")} • ${formatCountLabel(
      supplementCount,
      "supplement"
    )}`;
  }

  return formatCountLabel(entryCount, "logged item");
}

export function formatHistoryDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
}

export function formatHistoryTimeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export { getMealEntryMethodLabel };

export function buildHistoryDaySummary({
  dateKey,
  hydrationLogs,
  meals,
  supplementLogs = [],
  targets,
}: {
  dateKey: string;
  hydrationLogs: Array<Pick<HistoryHydrationInput, "amountOz" | "id" | "timestamp">>;
  meals: HistorySummaryMealInput[];
  supplementLogs?: SupplementLogSnapshot[];
  targets: DashboardTargets;
}): HistoryDaySummary {
  const dashboard = buildTodayDashboard({
    hydrationLogs,
    mealItems: [],
    meals,
    supplementLogs,
    targets,
  });
  const hydrationCount = hydrationLogs.length;
  const mealCount = meals.length;
  const supplementCount = supplementLogs.length;

  return {
    calories: dashboard.totals.calories,
    dateKey,
    entryCount: hydrationCount + mealCount + supplementCount,
    footerLabel: buildHistoryFooterLabel({
      hydrationCount,
      mealCount,
      supplementCount,
    }),
    hydrationCups: dashboard.cards.hydration.consumedCups,
    mealCount,
    nutritionCoveragePercent: dashboard.cards.nutrition.coveragePercent,
    protein: dashboard.totals.protein,
    supplementCount,
    wellnessScore: dashboard.wellness.score,
  };
}

export function buildHistoryTimeline({
  macroTargets,
  detailedNutritionTargets,
  hydrationLogs,
  mealItemsByMealId,
  meals,
  supplementLogs = [],
}: {
  macroTargets: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  detailedNutritionTargets: DetailedNutrientTargets;
  hydrationLogs: HistoryHydrationInput[];
  mealItemsByMealId: Map<string, HistoryMealItemInput[]>;
  meals: Array<
    HistoryMealInput & {
      entryMethod: MealTimelineEntryMethod;
      nutrients: DetailedNutrientInput;
    }
  >;
  supplementLogs?: SupplementLogSnapshot[];
}): HistoryTimelineEntry[] {
  return buildEntryTimeline({
    detailedNutritionTargets,
    hydrationLogs: hydrationLogs.map((entry) => ({
      amountOz: entry.amountOz,
      id: entry.id,
      rememberedHydrationLabel: entry.displayLabel,
      shortcutLabel: entry.shortcutLabel,
      timestamp: entry.timestamp,
    })),
    macroTargets,
    mealItemsByMealId,
    meals,
    supplementLogs,
  });
}

export function buildHistoryNutritionHighlights(percent: number) {
  return `${Math.max(0, Math.round(percent))}% nutrition`;
}

export function getTrackedHistoryNutrientKeys() {
  return [...getNutritionKeys()];
}
