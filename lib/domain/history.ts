import { DashboardTargets, buildTodayDashboard } from "./dashboard";
import { getNutritionKeys, ouncesToCups, NutritionAmounts } from "./wellness";

type HistoryMealInput = {
  id: string;
  label?: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: number;
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
};

type HistoryMealEntryMethod =
  | "manual"
  | "photo_scan"
  | "ai_text"
  | "search"
  | "barcode"
  | "saved_meal";

type HistorySummaryMealInput = HistoryMealInput & {
  nutrients: NutritionAmounts;
};

type HistoryMealItemInput = {
  foodName: string;
};

type HistoryHydrationInput = {
  amountOz: number;
  id: string;
  shortcutLabel?: string;
  timestamp: number;
};

export type HistoryDaySummary = {
  calories: number;
  dateKey: string;
  hydrationCups: number;
  mealCount: number;
  nutritionCoveragePercent: number;
  protein: number;
  wellnessScore: number;
};

export type HistoryTimelineEntry =
  | {
      amountCups: number;
      amountOz: number;
      id: string;
      kind: "hydration";
      label: string;
      timestamp: number;
    }
  | {
      calories: number;
      carbs: number;
      entryMethod: HistoryMealEntryMethod;
      entryMethodLabel: string;
      fat: number;
      id: string;
      itemCount: number;
      kind: "meal";
      label: string;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      protein: number;
      timestamp: number;
    };

function deriveMealLabel(meal: HistoryMealInput, items: HistoryMealItemInput[]) {
  if (meal.label?.trim()) {
    return meal.label.trim();
  }

  if (items.length === 1) {
    return items[0].foodName;
  }

  return `${items.length} items`;
}

export function getMealEntryMethodLabel(
  entryMethod: HistoryMealEntryMethod
) {
  if (entryMethod === "photo_scan") {
    return "FoodScan";
  }

  if (entryMethod === "ai_text") {
    return "Text entry";
  }

  if (entryMethod === "saved_meal") {
    return "Saved";
  }

  if (entryMethod === "barcode") {
    return "Barcode";
  }

  if (entryMethod === "search") {
    return "Search";
  }

  return "Manual";
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

export function buildHistoryDaySummary({
  dateKey,
  hydrationLogs,
  meals,
  targets,
}: {
  dateKey: string;
  hydrationLogs: Array<Pick<HistoryHydrationInput, "amountOz" | "id" | "timestamp">>;
  meals: HistorySummaryMealInput[];
  targets: DashboardTargets;
}): HistoryDaySummary {
  const dashboard = buildTodayDashboard({
    hydrationLogs,
    mealItems: [],
    meals,
    targets,
  });

  return {
    calories: dashboard.totals.calories,
    dateKey,
    hydrationCups: dashboard.cards.hydration.consumedCups,
    mealCount: meals.length,
    nutritionCoveragePercent: dashboard.cards.nutrition.coveragePercent,
    protein: dashboard.totals.protein,
    wellnessScore: dashboard.wellness.score,
  };
}

export function buildHistoryTimeline({
  hydrationLogs,
  mealItemsByMealId,
  meals,
}: {
  hydrationLogs: HistoryHydrationInput[];
  mealItemsByMealId: Map<string, HistoryMealItemInput[]>;
      meals: Array<
    HistoryMealInput & {
      entryMethod: HistoryMealEntryMethod;
    }
  >;
}): HistoryTimelineEntry[] {
  const mealEntries: HistoryTimelineEntry[] = meals.map((meal) => {
    const items = mealItemsByMealId.get(meal.id) ?? [];

    return {
      calories: meal.totals.calories,
      carbs: meal.totals.carbs,
      entryMethod: meal.entryMethod,
      entryMethodLabel: getMealEntryMethodLabel(meal.entryMethod),
      fat: meal.totals.fat,
      id: meal.id,
      itemCount: items.length,
      kind: "meal",
      label: deriveMealLabel(meal, items),
      mealType: meal.mealType,
      protein: meal.totals.protein,
      timestamp: meal.timestamp,
    };
  });
  const hydrationEntries: HistoryTimelineEntry[] = hydrationLogs.map((entry) => ({
    amountCups: ouncesToCups(entry.amountOz),
    amountOz: entry.amountOz,
    id: entry.id,
    kind: "hydration",
    label: entry.shortcutLabel?.trim() || "Hydration",
    timestamp: entry.timestamp,
  }));

  return [...mealEntries, ...hydrationEntries].sort((left, right) => right.timestamp - left.timestamp);
}

export function buildHistoryNutritionHighlights(percent: number) {
  return `${Math.max(0, Math.round(percent))}% nutrition`;
}

export function getTrackedHistoryNutrientKeys() {
  return [...getNutritionKeys()];
}
