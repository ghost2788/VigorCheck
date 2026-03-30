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

export type DashboardMeal = {
  id: string;
  label: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: number;
  totals: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  itemCount: number;
};

export type DashboardContributor = {
  id: string;
  label: string;
  mealType: DashboardMeal["mealType"];
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
      contributors: NutritionContributor[];
      coveragePercent: number;
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
  meals: DashboardMeal[];
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
  id: string;
  label?: string;
  mealType: DashboardMeal["mealType"];
  nutrients: NutritionAmounts;
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

export type DashboardTargets = {
  calories: number;
  hydration: number;
  nutrition: NutritionTargets;
  protein: number;
};

function deriveMealLabel(meal: MealInput, items: MealItemInput[]) {
  if (meal.label?.trim()) {
    return meal.label.trim();
  }

  if (items.length === 1) {
    return items[0].foodName;
  }

  return `${items.length} items`;
}

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

export function buildTodayDashboard({
  hydrationLogs,
  mealItems,
  meals,
  targets,
}: {
  hydrationLogs: HydrationLogInput[];
  mealItems: MealItemInput[];
  meals: MealInput[];
  targets: DashboardTargets;
}): DashboardPayload {
  const itemsByMeal = new Map<string, MealItemInput[]>();

  for (const item of mealItems) {
    const current = itemsByMeal.get(item.mealId) ?? [];
    current.push(item);
    itemsByMeal.set(item.mealId, current);
  }

  const dashboardMeals = [...meals]
    .sort((left, right) => right.timestamp - left.timestamp)
    .map((meal) => {
    const items = itemsByMeal.get(meal.id) ?? [];

    return {
      id: meal.id,
      itemCount: items.length,
      label: deriveMealLabel(meal, items),
      mealType: meal.mealType,
      timestamp: meal.timestamp,
      totals: meal.totals,
    };
  });

  const totals = dashboardMeals.reduce(
    (accumulator, meal) => ({
      calories: accumulator.calories + meal.totals.calories,
      carbs: accumulator.carbs + meal.totals.carbs,
      fat: accumulator.fat + meal.totals.fat,
      protein: accumulator.protein + meal.totals.protein,
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 }
  );
  const totalHydrationOz = hydrationLogs.reduce((sum, entry) => sum + entry.amountOz, 0);
  const totalHydrationCups = ouncesToCups(totalHydrationOz);

  const nutrientTotals = meals.reduce<NutritionAmounts>(
    (accumulator, meal) => ({
      calcium: accumulator.calcium + meal.nutrients.calcium,
      fiber: accumulator.fiber + meal.nutrients.fiber,
      iron: accumulator.iron + meal.nutrients.iron,
      potassium: accumulator.potassium + meal.nutrients.potassium,
      vitaminC: accumulator.vitaminC + meal.nutrients.vitaminC,
      vitaminD: accumulator.vitaminD + meal.nutrients.vitaminD,
    }),
    {
      calcium: 0,
      fiber: 0,
      iron: 0,
      potassium: 0,
      vitaminC: 0,
      vitaminD: 0,
    }
  );

  const caloriesRawProgressPercent = roundPercent(totals.calories, targets.calories);
  const proteinRawProgressPercent = roundPercent(totals.protein, targets.protein);
  const hydrationRawProgressPercent = roundPercent(totalHydrationCups, targets.hydration);
  const nutrientRows = getNutritionKeys().map((key) => ({
    consumed: nutrientTotals[key],
    key,
    percent: roundPercent(nutrientTotals[key], targets.nutrition[key]),
    target: targets.nutrition[key],
  }));
  const nutritionScore = Math.round(
    nutrientRows.reduce((total, nutrient) => total + Math.min(nutrient.percent, 100), 0) /
      nutrientRows.length
  );
  const caloriesScore = scoreCaloriesTargetCloseness(totals.calories, targets.calories);
  const proteinScore = scoreGoalProgress(totals.protein, targets.protein);
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
  const contributorBase = meals.map((meal) => {
    const label = deriveMealLabel(meal, itemsByMeal.get(meal.id) ?? []);

    return {
      id: meal.id,
      label,
      mealType: meal.mealType,
      timestamp: meal.timestamp,
      totals: meal.totals,
      nutrients: meal.nutrients,
    };
  });

  return {
    cards: {
      calories: {
        consumed: totals.calories,
        contributors: sortMealsByValue(
          contributorBase.map((meal) => ({
            id: meal.id,
            label: meal.label,
            mealType: meal.mealType,
            timestamp: meal.timestamp,
            value: meal.totals.calories,
          }))
        ),
        rawProgressPercent: caloriesRawProgressPercent,
        remaining: targets.calories - totals.calories,
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
        contributors: sortNutritionContributors(
          contributorBase.map((meal) => ({
            contributionScore: rankMealNutritionContribution({
              meal: meal.nutrients,
              targets: targets.nutrition,
            }),
            id: meal.id,
            label: meal.label,
            mealType: meal.mealType,
            timestamp: meal.timestamp,
            topNutrients: buildTopNutrients(meal.nutrients, targets.nutrition),
            value: rankMealNutritionContribution({
              meal: meal.nutrients,
              targets: targets.nutrition,
            }),
          }))
        ),
        coveragePercent: nutritionScore,
        nutrients: nutrientRows,
        score: nutritionScore,
      },
      protein: {
        consumed: totals.protein,
        contributors: sortMealsByValue(
          contributorBase.map((meal) => ({
            id: meal.id,
            label: meal.label,
            mealType: meal.mealType,
            timestamp: meal.timestamp,
            value: meal.totals.protein,
          }))
        ),
        rawProgressPercent: proteinRawProgressPercent,
        score: proteinScore,
        target: targets.protein,
      },
    },
    meals: dashboardMeals,
    totals,
    wellness: {
      biggestGapKey,
      rings,
      score: wellnessScore,
    },
  };
}
