import {
  getNutritionKeys,
  NutritionAmounts,
  NutritionKey,
  NutritionTargets,
  ouncesToCups,
  rankMealNutritionContribution,
  roundPercent,
  scoreCaloriesTargetCloseness,
  scoreGoalProgress,
  WellnessKey,
} from "./wellness";
import {
  buildGroupedNutrientDetails,
  buildNutrientInsights,
  DetailedNutrientTargets,
  NutrientDetailGroup,
  NutrientSourceTag,
  sumDetailedNutrients,
  type DetailedNutrientInput,
} from "./nutrients";
import {
  deriveMealTimelineLabel,
  MealTimelineEntryMethod,
} from "./mealTimeline";
import { buildEntryTimeline, type TimelineEntry } from "./entryTimeline";
import { MealType } from "./meals";
import { SupplementLogSnapshot } from "./supplements";

export type DashboardMeal = {
  id: string;
  label: string;
  mealType: MealType;
  timestamp: number;
  topNutrientSources: NutrientSourceTag[];
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  itemCount: number;
};

export type DashboardContributor =
  | {
      id: string;
      kind: "meal";
      label: string;
      mealType: MealType;
      timestamp: number;
      value: number;
    }
  | {
      id: string;
      kind: "supplement";
      label: string;
      servingLabel: string;
      timestamp: number;
      value: number;
    };

export type NutritionContributor = DashboardContributor & {
  contributionScore: number;
  topNutrients: NutritionKey[];
};

export type NutritionRow = {
  consumed: number;
  key: NutritionKey;
  percent: number;
  target: number;
};

export type HydrationEntry = {
  amountCups: number;
  amountOz: number;
  id: string;
  timestamp: number;
};

export type DashboardPayload = {
  activityCounts: {
    hydration: number;
    meals: number;
    supplements: number;
  };
  cards: {
    calories: {
      consumed: number;
      contributors: DashboardContributor[];
      rawProgressPercent: number;
      remaining: number;
      score: number;
      target: number;
    };
    hydration: {
      consumedCups: number;
      consumedOz: number;
      entries: HydrationEntry[];
      rawProgressPercent: number;
      score: number;
      targetCups: number;
    };
    nutrition: {
      coverageRatio: number;
      contributors: NutritionContributor[];
      coveragePercent: number;
      detailGroups: NutrientDetailGroup[];
      insights: {
        biggestGaps: ReturnType<typeof buildNutrientInsights>["biggestGaps"];
        topWins: ReturnType<typeof buildNutrientInsights>["topWins"];
      };
      nutrients: NutritionRow[];
      score: number;
    };
    protein: {
      consumed: number;
      contributors: DashboardContributor[];
      rawProgressPercent: number;
      score: number;
      target: number;
    };
  };
  entryTimeline: Array<Exclude<TimelineEntry, { kind: "hydration" }>>;
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  wellness: {
    biggestGapKey: WellnessKey;
    rings: Record<
      WellnessKey,
      {
        rawProgressPercent: number;
        score: number;
      }
    >;
    score: number;
  };
};

type MealInput = {
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

type MealItemInput = {
  foodName: string;
  mealId: string;
};

type HydrationLogInput = {
  amountOz: number;
  id: string;
  timestamp: number;
};

type ContributorBase =
  | {
      id: string;
      kind: "meal";
      label: string;
      mealType: MealType;
      nutrients: NutritionAmounts & DetailedNutrientInput;
      timestamp: number;
      totals: {
        calories: number;
        carbs: number;
        fat: number;
        protein: number;
      };
    }
  | {
      id: string;
      kind: "supplement";
      label: string;
      nutrients: DetailedNutrientInput;
      servingLabel: string;
      timestamp: number;
      totals: {
        calories: number;
        carbs: number;
        fat: number;
        protein: number;
      };
    };

export type DashboardTargets = {
  calories: number;
  carbs: number;
  detailedNutrition: DetailedNutrientTargets;
  fat: number;
  hydration: number;
  nutrition: NutritionTargets;
  protein: number;
};

function sortMealsByValue<T extends { timestamp: number; value: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (right.value !== left.value) {
      return right.value - left.value;
    }

    return right.timestamp - left.timestamp;
  });
}

function sortNutritionContributors(contributors: NutritionContributor[]) {
  return [...contributors].sort((left, right) => {
    if (right.contributionScore !== left.contributionScore) {
      return right.contributionScore - left.contributionScore;
    }

    return right.timestamp - left.timestamp;
  });
}

function buildTopNutrients(meal: NutritionAmounts, targets: NutritionTargets) {
  return getNutritionKeys()
    .map((key) => ({
      key,
      score: targets[key] ? meal[key] / targets[key] : 0,
    }))
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 2)
    .map((entry) => entry.key);
}

function toNutritionAmounts(nutrients: DetailedNutrientInput): NutritionAmounts {
  return {
    calcium: nutrients.calcium ?? 0,
    fiber: nutrients.fiber ?? 0,
    iron: nutrients.iron ?? 0,
    potassium: nutrients.potassium ?? 0,
    vitaminC: nutrients.vitaminC ?? 0,
    vitaminD: nutrients.vitaminD ?? 0,
  };
}

export function buildTodayDashboard({
  hydrationLogs,
  mealItems,
  meals,
  supplementLogs = [],
  targets,
}: {
  hydrationLogs: HydrationLogInput[];
  mealItems: MealItemInput[];
  meals: MealInput[];
  supplementLogs?: SupplementLogSnapshot[];
  targets: DashboardTargets;
}): DashboardPayload {
  const itemsByMeal = new Map<string, MealItemInput[]>();
  const macroTargets = {
    calories: targets.calories,
    carbs: targets.carbs,
    fat: targets.fat,
    protein: targets.protein,
  };

  for (const item of mealItems) {
    const current = itemsByMeal.get(item.mealId) ?? [];
    current.push(item);
    itemsByMeal.set(item.mealId, current);
  }

  const orderedMeals = [...meals].sort((left, right) => right.timestamp - left.timestamp);
  const entryTimeline = buildEntryTimeline({
    detailedNutritionTargets: targets.detailedNutrition,
    hydrationLogs,
    includeHydration: false,
    macroTargets,
    mealItemsByMealId: itemsByMeal,
    meals: orderedMeals,
    supplementLogs,
  });

  const totals = orderedMeals.reduce(
    (accumulator, meal) => ({
      calories: accumulator.calories + meal.totals.calories,
      carbs: accumulator.carbs + meal.totals.carbs,
      fat: accumulator.fat + meal.totals.fat,
      protein: accumulator.protein + meal.totals.protein,
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 }
  );
  const supplementTotals = supplementLogs.reduce(
    (accumulator, supplement) => ({
      calories: accumulator.calories + supplement.totals.calories,
      carbs: accumulator.carbs + supplement.totals.carbs,
      fat: accumulator.fat + supplement.totals.fat,
      protein: accumulator.protein + supplement.totals.protein,
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 }
  );
  const aggregateTotals = {
    calories: totals.calories + supplementTotals.calories,
    carbs: totals.carbs + supplementTotals.carbs,
    fat: totals.fat + supplementTotals.fat,
    protein: totals.protein + supplementTotals.protein,
  };
  const totalHydrationOz = hydrationLogs.reduce((sum, entry) => sum + entry.amountOz, 0);
  const totalHydrationCups = ouncesToCups(totalHydrationOz);

  const detailedNutrientTotals = sumDetailedNutrients(
    [...meals, ...supplementLogs].map((meal) => ({
      nutrients: meal.nutrients,
    }))
  );
  const nutrientTotals = toNutritionAmounts(detailedNutrientTotals);
  const nutrientInsights = buildNutrientInsights({
    targets: targets.detailedNutrition,
    totals: detailedNutrientTotals,
  });

  const caloriesRawProgressPercent = roundPercent(aggregateTotals.calories, targets.calories);
  const proteinRawProgressPercent = roundPercent(aggregateTotals.protein, targets.protein);
  const hydrationRawProgressPercent = roundPercent(totalHydrationCups, targets.hydration);
  const nutrientRows = getNutritionKeys().map((key) => ({
    consumed: nutrientTotals[key],
    key,
    percent: roundPercent(nutrientTotals[key], targets.nutrition[key]),
    target: targets.nutrition[key],
  }));
  const nutritionCoverageRatio =
    nutrientRows.reduce((total, nutrient) => {
      if (!nutrient.target) {
        return total;
      }

      return total + Math.min(nutrient.consumed / nutrient.target, 1);
    }, 0) / nutrientRows.length;
  const nutritionScore = Math.round(
    nutrientRows.reduce((total, nutrient) => total + Math.min(nutrient.percent, 100), 0) /
      nutrientRows.length
  );
  const caloriesScore = scoreCaloriesTargetCloseness(aggregateTotals.calories, targets.calories);
  const proteinScore = scoreGoalProgress(aggregateTotals.protein, targets.protein);
  const hydrationScore = scoreGoalProgress(totalHydrationCups, targets.hydration);
  const rings: DashboardPayload["wellness"]["rings"] = {
    calories: {
      rawProgressPercent: caloriesRawProgressPercent,
      score: caloriesScore,
    },
    hydration: {
      rawProgressPercent: hydrationRawProgressPercent,
      score: hydrationScore,
    },
    nutrition: {
      rawProgressPercent: nutritionScore,
      score: nutritionScore,
    },
    protein: {
      rawProgressPercent: proteinRawProgressPercent,
      score: proteinScore,
    },
  };
  const biggestGapKey = (["calories", "protein", "hydration", "nutrition"] as WellnessKey[]).reduce(
    (lowest, current) => (rings[current].score < rings[lowest].score ? current : lowest),
    "calories"
  );
  const wellnessScore = Math.round(
    (caloriesScore + proteinScore + hydrationScore + nutritionScore) / 4
  );
  const contributorBase: ContributorBase[] = [
    ...orderedMeals.map((meal) => {
      const label = deriveMealTimelineLabel(meal, itemsByMeal.get(meal.id) ?? []);

      return {
        id: meal.id,
        kind: "meal" as const,
        label,
        nutrients: meal.nutrients,
        mealType: meal.mealType,
        timestamp: meal.timestamp,
        totals: meal.totals,
      };
    }),
    ...supplementLogs.map((supplement) => ({
      id: supplement.id,
      kind: "supplement" as const,
      label: supplement.label,
      nutrients: supplement.nutrients,
      servingLabel: supplement.servingLabel,
      timestamp: supplement.timestamp,
      totals: supplement.totals,
    })),
  ];

  return {
    activityCounts: {
      hydration: hydrationLogs.length,
      meals: orderedMeals.length,
      supplements: supplementLogs.length,
    },
    cards: {
      calories: {
        consumed: aggregateTotals.calories,
        contributors: sortMealsByValue(
          contributorBase.map((entry): DashboardContributor =>
            entry.kind === "meal"
              ? {
                  id: entry.id,
                  kind: "meal",
                  label: entry.label,
                  mealType: entry.mealType,
                  timestamp: entry.timestamp,
                  value: entry.totals.calories,
                }
              : {
                  id: entry.id,
                  kind: "supplement",
                  label: entry.label,
                  servingLabel: entry.servingLabel,
                  timestamp: entry.timestamp,
                  value: entry.totals.calories,
                }
          )
        ),
        rawProgressPercent: caloriesRawProgressPercent,
        remaining: targets.calories - aggregateTotals.calories,
        score: caloriesScore,
        target: targets.calories,
      },
      hydration: {
        consumedCups: totalHydrationCups,
        consumedOz: totalHydrationOz,
        entries: [...hydrationLogs]
          .sort((left, right) => right.timestamp - left.timestamp)
          .map((entry) => ({
            amountCups: ouncesToCups(entry.amountOz),
            amountOz: entry.amountOz,
            id: entry.id,
            timestamp: entry.timestamp,
          })),
        rawProgressPercent: hydrationRawProgressPercent,
        score: hydrationScore,
        targetCups: targets.hydration,
      },
      nutrition: {
        coverageRatio: nutritionCoverageRatio,
        contributors: sortNutritionContributors(
          contributorBase.map((entry): NutritionContributor => {
            const mealNutrition = toNutritionAmounts(entry.nutrients);
            const contributionScore = rankMealNutritionContribution({
              meal: mealNutrition,
              targets: targets.nutrition,
            });
            const shared = {
              contributionScore,
              id: entry.id,
              label: entry.label,
              timestamp: entry.timestamp,
              topNutrients: buildTopNutrients(mealNutrition, targets.nutrition),
              value: contributionScore,
            };

            return entry.kind === "meal"
              ? {
                  ...shared,
                  kind: "meal",
                  mealType: entry.mealType,
                }
              : {
                  ...shared,
                  kind: "supplement",
                  servingLabel: entry.servingLabel,
                };
          })
        ),
        coveragePercent: nutritionScore,
        detailGroups: buildGroupedNutrientDetails({
          targets: targets.detailedNutrition,
          totals: detailedNutrientTotals,
        }),
        insights: nutrientInsights,
        nutrients: nutrientRows,
        score: nutritionScore,
      },
      protein: {
        consumed: aggregateTotals.protein,
        contributors: sortMealsByValue(
          contributorBase.map((entry): DashboardContributor =>
            entry.kind === "meal"
              ? {
                  id: entry.id,
                  kind: "meal",
                  label: entry.label,
                  mealType: entry.mealType,
                  timestamp: entry.timestamp,
                  value: entry.totals.protein,
                }
              : {
                  id: entry.id,
                  kind: "supplement",
                  label: entry.label,
                  servingLabel: entry.servingLabel,
                  timestamp: entry.timestamp,
                  value: entry.totals.protein,
                }
          )
        ),
        rawProgressPercent: proteinRawProgressPercent,
        score: proteinScore,
        target: targets.protein,
      },
    },
    entryTimeline: entryTimeline as DashboardPayload["entryTimeline"],
    totals: aggregateTotals,
    wellness: {
      biggestGapKey,
      rings,
      score: wellnessScore,
    },
  };
}
