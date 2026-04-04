import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { buildHistoryDaySummary, buildHistoryTimeline } from "../lib/domain/history";
import { getDayWindowForDateKey, getLocalDateKey } from "../lib/domain/dayWindow";
import { buildTodayDashboard } from "../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../lib/domain/nutrients";
import { resolveEffectiveTargets } from "../lib/domain/targets";
import { getNutritionTargets } from "../lib/domain/wellness";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";
import { findCurrentUser } from "./lib/devIdentity";

const HISTORY_BATCH_SIZE = 60;

function buildTargets(user: Doc<"users">) {
  const macroTargets = resolveEffectiveTargets(user);

  return {
    calories: macroTargets.calories,
    detailedNutrition: getDetailedNutrientTargets({
      age: user.age,
      sex: user.sex,
      targetFiber: user.targetFiber,
    }),
    hydration: user.targetHydration,
    nutrition: getNutritionTargets({
      age: user.age,
      sex: user.sex,
      targetFiber: user.targetFiber,
    }),
    protein: macroTargets.protein,
  };
}

function buildMealNutrients(meal: Doc<"meals">) {
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
    sodium: meal.totalSodium,
    sugar: meal.totalSugar,
    thiamin: meal.thiamin,
    vitaminA: meal.vitaminA,
    vitaminC: meal.vitaminC,
    vitaminD: meal.vitaminD,
    vitaminE: meal.vitaminE,
    vitaminK: meal.vitaminK,
    zinc: meal.zinc,
  };
}

async function loadMealsForWindow(
  ctx: QueryCtx,
  {
    end,
    start,
    userId,
  }: {
    end: number;
    start: number;
    userId: Id<"users">;
  }
) {
  return ctx.db
    .query("meals")
    .withIndex("by_user_date", (queryBuilder) =>
      queryBuilder.eq("userId", userId).gte("timestamp", start).lt("timestamp", end)
    )
    .collect();
}

async function loadHydrationLogsForWindow(
  ctx: QueryCtx,
  {
    end,
    start,
    userId,
  }: {
    end: number;
    start: number;
    userId: Id<"users">;
  }
) {
  return ctx.db
    .query("hydrationLogs")
    .withIndex("by_user_date", (queryBuilder) =>
      queryBuilder.eq("userId", userId).gte("timestamp", start).lt("timestamp", end)
    )
    .collect();
}

async function loadMealItemsByMealId(
  ctx: QueryCtx,
  meals: Array<{ _id: Id<"meals"> }>
) {
  const entries: Array<
    [
      Id<"meals">,
      Doc<"mealItems">[]
    ]
  > = await Promise.all(
    meals.map(async (meal) => [
      meal._id,
      await ctx.db
        .query("mealItems")
        .withIndex("by_meal", (queryBuilder) => queryBuilder.eq("mealId", meal._id))
        .collect(),
    ])
  );

  return new Map(entries);
}

async function fetchActivityBatch(
  ctx: QueryCtx,
  {
    cutoffTimestamp,
    userId,
  }: {
    cutoffTimestamp: number | null;
    userId: Id<"users">;
  }
) {
  const meals = await ctx.db
    .query("meals")
    .withIndex("by_user_date", (queryBuilder) =>
      cutoffTimestamp === null
        ? queryBuilder.eq("userId", userId)
        : queryBuilder.eq("userId", userId).lt("timestamp", cutoffTimestamp)
    )
    .order("desc")
    .take(HISTORY_BATCH_SIZE);
  const hydrationLogs = await ctx.db
    .query("hydrationLogs")
    .withIndex("by_user_date", (queryBuilder) =>
      cutoffTimestamp === null
        ? queryBuilder.eq("userId", userId)
        : queryBuilder.eq("userId", userId).lt("timestamp", cutoffTimestamp)
    )
    .order("desc")
    .take(HISTORY_BATCH_SIZE);

  return { hydrationLogs, meals };
}

export const listDays = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return {
        continueCursor: "",
        isDone: true,
        page: [],
      };
    }

    const targets = buildTargets(user);
    const pageDateKeys: string[] = [];
    let cursorDateKey = args.paginationOpts.cursor;
    let isDone = false;

    for (let attempt = 0; attempt < 8 && pageDateKeys.length < args.paginationOpts.numItems; attempt += 1) {
      const cutoffTimestamp = cursorDateKey
        ? getDayWindowForDateKey({
            dateKey: cursorDateKey,
            timeZone: user.timeZone,
          }).start
        : null;
      const { hydrationLogs, meals } = await fetchActivityBatch(ctx, {
        cutoffTimestamp,
        userId: user._id,
      });
      const merged = [...meals, ...hydrationLogs].sort((left, right) => right.timestamp - left.timestamp);

      if (!merged.length) {
        isDone = true;
        break;
      }

      for (const entry of merged) {
        const dateKey = getLocalDateKey(entry.timestamp, user.timeZone);

        if (!pageDateKeys.includes(dateKey)) {
          pageDateKeys.push(dateKey);
        }

        if (pageDateKeys.length >= args.paginationOpts.numItems) {
          break;
        }
      }

      const oldestFetchedDateKey = getLocalDateKey(merged[merged.length - 1].timestamp, user.timeZone);
      const hitBatchCap =
        meals.length === HISTORY_BATCH_SIZE || hydrationLogs.length === HISTORY_BATCH_SIZE;

      if (pageDateKeys.length >= args.paginationOpts.numItems) {
        isDone = !hitBatchCap;
        break;
      }

      if (!hitBatchCap) {
        isDone = true;
        break;
      }

      cursorDateKey = oldestFetchedDateKey;
    }

    const page = await Promise.all(
      pageDateKeys.slice(0, args.paginationOpts.numItems).map(async (dateKey) => {
        const { end, start } = getDayWindowForDateKey({
          dateKey,
          timeZone: user.timeZone,
        });
        const [meals, hydrationLogs] = await Promise.all([
          loadMealsForWindow(ctx, {
            end,
            start,
            userId: user._id,
          }),
          loadHydrationLogsForWindow(ctx, {
            end,
            start,
            userId: user._id,
          }),
        ]);

        return buildHistoryDaySummary({
          dateKey,
          hydrationLogs: hydrationLogs.map((entry) => ({
            amountOz: entry.amountOz,
            id: entry._id,
            timestamp: entry.timestamp,
          })),
          meals: meals.map((meal) => ({
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
          targets,
        });
      })
    );

    return {
      continueCursor: isDone || page.length === 0 ? "" : page[page.length - 1].dateKey,
      isDone,
      page,
    };
  },
});

export const dayDetail = query({
  args: {
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const { end, start } = getDayWindowForDateKey({
      dateKey: args.dateKey,
      timeZone: user.timeZone,
    });
    const [meals, hydrationLogs] = await Promise.all([
      loadMealsForWindow(ctx, {
        end,
        start,
        userId: user._id,
      }),
      loadHydrationLogsForWindow(ctx, {
        end,
        start,
        userId: user._id,
      }),
    ]);

    if (!meals.length && !hydrationLogs.length) {
      return null;
    }

    const mealItemsByMealId = await loadMealItemsByMealId(ctx, meals);
    const targets = buildTargets(user);
    const summaryDashboard = buildTodayDashboard({
      hydrationLogs: hydrationLogs.map((entry) => ({
        amountOz: entry.amountOz,
        id: entry._id,
        timestamp: entry.timestamp,
      })),
      mealItems: Array.from(mealItemsByMealId.entries()).flatMap(([mealId, items]) =>
        items.map((item) => ({
          foodName: item.foodName,
          mealId,
        }))
      ),
      meals: meals.map((meal) => ({
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
      targets,
    });

    const macroTargets = resolveEffectiveTargets(user);

    return {
      dateKey: args.dateKey,
      summary: {
        calories: summaryDashboard.totals.calories,
        hydrationCups: summaryDashboard.cards.hydration.consumedCups,
        insights: summaryDashboard.cards.nutrition.insights,
        mealCount: meals.length,
        nutritionCoveragePercent: summaryDashboard.cards.nutrition.coveragePercent,
        nutrientGroups: summaryDashboard.cards.nutrition.detailGroups,
        protein: summaryDashboard.totals.protein,
        wellnessScore: summaryDashboard.wellness.score,
      },
      timeZone: user.timeZone,
      targets: {
        calories: macroTargets.calories,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
        protein: macroTargets.protein,
      },
      timeline: buildHistoryTimeline({
        detailedNutritionTargets: targets.detailedNutrition,
        hydrationLogs: hydrationLogs.map((entry) => ({
          amountOz: entry.amountOz,
          id: entry._id,
          shortcutLabel: entry.shortcutLabel,
          timestamp: entry.timestamp,
        })),
        mealItemsByMealId: new Map(
          Array.from(mealItemsByMealId.entries()).map(([mealId, items]) => [
            mealId,
            items.map((item) => ({
              foodName: item.foodName,
            })),
          ])
        ),
        meals: meals.map((meal) => ({
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
      }),
    };
  },
});
