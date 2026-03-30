import { buildTodayDashboard } from "../lib/domain/dashboard";
import { getDayWindowForTimestamp, getLocalDateKey } from "../lib/domain/dayWindow";
import { getNutritionTargets } from "../lib/domain/wellness";
import { resolveEffectiveTargets } from "../lib/domain/targets";
import { query } from "./_generated/server";
import { findCurrentUser } from "./lib/devIdentity";

export const today = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const now = Date.now();
    const { end, start } = getDayWindowForTimestamp(now, user.timeZone);
    const meals = await ctx.db
      .query("meals")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
      )
      .collect();
    const orderedMeals = [...meals].sort((left, right) => right.timestamp - left.timestamp);
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
    const hydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
      )
      .collect();
    const macroTargets = resolveEffectiveTargets(user);
    const targets = {
      calories: macroTargets.calories,
      hydration: user.targetHydration,
      nutrition: getNutritionTargets({
        age: user.age,
        sex: user.sex,
        targetFiber: user.targetFiber,
      }),
      protein: macroTargets.protein,
    };
    const dashboard = buildTodayDashboard({
      hydrationLogs: hydrationLogs.map((entry) => ({
        amountOz: entry.amountOz,
        id: entry._id,
        timestamp: entry.timestamp,
      })),
      mealItems: mealItems.map((item) => ({
        foodName: item.foodName,
        mealId: item.mealId,
      })),
      meals: orderedMeals.map((meal) => ({
        id: meal._id,
        label: meal.label,
        mealType: meal.mealType,
        nutrients: {
          calcium: meal.calcium,
          fiber: meal.totalFiber,
          iron: meal.iron,
          potassium: meal.potassium,
          vitaminC: meal.vitaminC,
          vitaminD: meal.vitaminD,
        },
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

    return {
      dateKey: getLocalDateKey(now, user.timeZone),
      targets: {
        calories: macroTargets.calories,
        hydration: user.targetHydration,
        protein: macroTargets.protein,
      },
      timeZone: user.timeZone,
      ...dashboard,
    };
  },
});
