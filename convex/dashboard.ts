import { buildTodayDashboard } from "../lib/domain/dashboard";
import { getDayWindowForTimestamp, getLocalDateKey } from "../lib/domain/dayWindow";
import { getDetailedNutrientTargets } from "../lib/domain/nutrients";
import { getNutritionTargets } from "../lib/domain/wellness";
import { resolveEffectiveTargets } from "../lib/domain/targets";
import { query, QueryCtx } from "./_generated/server";
import { findCurrentUser } from "./lib/devIdentity";
import { buildSupplementLogSnapshot } from "./lib/supplements";

async function loadTodayEntries({
  ctx,
  user,
}: {
  ctx: QueryCtx;
  user: NonNullable<Awaited<ReturnType<typeof findCurrentUser>>>;
}) {
  const now = Date.now();
  const { end, start } = getDayWindowForTimestamp(now, user.timeZone);
  const meals = await ctx.db
    .query("meals")
    .withIndex("by_user_date", (query) =>
      query.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
    )
    .collect();
  const orderedMeals = [...meals].sort((left, right) => right.timestamp - left.timestamp);
  const hydrationLogs = await ctx.db
    .query("hydrationLogs")
    .withIndex("by_user_date", (query) =>
      query.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
    )
    .collect();
  const orderedHydrationLogs = [...hydrationLogs].sort((left, right) => right.timestamp - left.timestamp);
  const supplementLogs = await ctx.db
    .query("supplementLogs")
    .withIndex("by_user_date", (query) =>
      query.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
    )
    .collect();
  const orderedSupplementLogs = [...supplementLogs].sort((left, right) => right.timestamp - left.timestamp);
  const macroTargets = resolveEffectiveTargets(user);
  const targets = {
    calories: macroTargets.calories,
    carbs: macroTargets.carbs,
    detailedNutrition: getDetailedNutrientTargets({
      age: user.age,
      sex: user.sex,
      targetFiber: user.targetFiber,
    }),
    fat: macroTargets.fat,
    hydration: user.targetHydration,
    nutrition: getNutritionTargets({
      age: user.age,
      sex: user.sex,
      targetFiber: user.targetFiber,
    }),
    protein: macroTargets.protein,
  };

  return {
    macroTargets,
    now,
    orderedHydrationLogs,
    orderedMeals,
    orderedSupplementLogs,
    start,
    targets,
  };
}

function buildMealNutrients(meal: {
  b12: number;
  b6: number;
  calcium: number;
  folate: number;
  iron: number;
  magnesium: number;
  manganese?: number;
  niacin: number;
  omega3?: number;
  phosphorus: number;
  potassium: number;
  riboflavin: number;
  selenium?: number;
  totalSodium?: number;
  totalSugar?: number;
  thiamin: number;
  totalFiber: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  zinc: number;
  choline?: number;
  copper?: number;
}) {
  return {
    b12: meal.b12,
    b6: meal.b6,
    calcium: meal.calcium,
    choline: meal.choline ?? 0,
    copper: meal.copper ?? 0,
    fiber: meal.totalFiber,
    folate: meal.folate,
    iron: meal.iron,
    magnesium: meal.magnesium,
    manganese: meal.manganese ?? 0,
    niacin: meal.niacin,
    omega3: meal.omega3 ?? 0,
    phosphorus: meal.phosphorus,
    potassium: meal.potassium,
    riboflavin: meal.riboflavin,
    selenium: meal.selenium ?? 0,
    sodium: meal.totalSodium ?? 0,
    sugar: meal.totalSugar ?? 0,
    thiamin: meal.thiamin,
    vitaminA: meal.vitaminA,
    vitaminC: meal.vitaminC,
    vitaminD: meal.vitaminD,
    vitaminE: meal.vitaminE,
    vitaminK: meal.vitaminK,
    zinc: meal.zinc,
  };
}

export const today = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const { macroTargets, now, orderedHydrationLogs, orderedMeals, orderedSupplementLogs, targets } =
      await loadTodayEntries({
      ctx,
      user,
    });
    const mealItems = (
      await Promise.all(
        orderedMeals.map((meal) =>
          ctx.db
            .query("mealItems")
            .withIndex("by_meal", (query) => query.eq("mealId", meal._id))
            .collect()
        )
      )
    ).flat();
    const dashboard = buildTodayDashboard({
      goalType: user.goalType,
      hydrationLogs: orderedHydrationLogs.map((entry) => ({
        amountOz: entry.amountOz,
        id: entry._id,
        timestamp: entry.timestamp,
      })),
      mealItems: mealItems.map((item) => ({
        foodName: item.foodName,
        mealId: item.mealId,
      })),
      meals: orderedMeals.map((meal) => ({
        entryMethod: meal.entryMethod,
        id: meal._id,
        label: meal.label,
        mealType: meal.mealType,
        nutrients: buildMealNutrients(meal),
        timestamp: meal.timestamp,
        totals: {
          calories: meal.totalCalories,
          carbs: meal.totalCarbs,
          fat: meal.totalFat,
          protein: meal.totalProtein,
        },
      })),
      supplementLogs: orderedSupplementLogs.map((log) => buildSupplementLogSnapshot(log)),
      targets,
    });

    return {
      dateKey: getLocalDateKey(now, user.timeZone),
      displayName: user.displayName,
      targets: {
        calories: macroTargets.calories,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
        hydration: user.targetHydration,
        protein: macroTargets.protein,
      },
      timeZone: user.timeZone,
      ...dashboard,
    };
  },
});

export const reminderSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const { macroTargets, now, orderedHydrationLogs, orderedMeals, orderedSupplementLogs, targets } =
      await loadTodayEntries({
      ctx,
      user,
    });
    const dashboard = buildTodayDashboard({
      goalType: user.goalType,
      hydrationLogs: orderedHydrationLogs.map((entry) => ({
        amountOz: entry.amountOz,
        id: entry._id,
        timestamp: entry.timestamp,
      })),
      mealItems: [],
      meals: orderedMeals.map((meal) => ({
        entryMethod: meal.entryMethod,
        id: meal._id,
        label: meal.label,
        mealType: meal.mealType,
        nutrients: buildMealNutrients(meal),
        timestamp: meal.timestamp,
        totals: {
          calories: meal.totalCalories,
          carbs: meal.totalCarbs,
          fat: meal.totalFat,
          protein: meal.totalProtein,
        },
      })),
      supplementLogs: orderedSupplementLogs.map((log) => buildSupplementLogSnapshot(log)),
      targets,
    });

    return {
      biggestGapKey: dashboard.wellness.biggestGapKey,
      dateKey: getLocalDateKey(now, user.timeZone),
      lastHydrationTimestamp: orderedHydrationLogs[0]?.timestamp ?? null,
      lastMealTimestamp: orderedMeals[0]?.timestamp ?? null,
      mealCount: orderedMeals.length,
      progress: {
        caloriesPercent: dashboard.cards.calories.rawProgressPercent,
        caloriesScore: dashboard.cards.calories.score,
        caloriesOnTarget: dashboard.cards.calories.score >= 100,
        carbsPercent: dashboard.cards.carbs.rawProgressPercent,
        carbsScore: dashboard.cards.carbs.score,
        carbsOnTarget: dashboard.cards.carbs.score >= 100,
        fatPercent: dashboard.cards.fat.rawProgressPercent,
        fatScore: dashboard.cards.fat.score,
        fatOnTarget: dashboard.cards.fat.score >= 100,
        hydrationPercent: dashboard.cards.hydration.rawProgressPercent,
        nutritionPercent: dashboard.cards.nutrition.coveragePercent,
        proteinPercent: dashboard.cards.protein.rawProgressPercent,
        proteinOnTarget: dashboard.cards.protein.rawProgressPercent >= 100,
      },
      timeZone: user.timeZone,
    };
  },
});
