import { v } from "convex/values";
import {
  getDayWindowForOffset,
  getLocalDateKey,
  getTrailingDateKeys,
  getWeekDateKeysForOffset,
  getWeekWindowForOffset,
} from "../lib/domain/dayWindow";
import {
  buildCurrentStreak,
  buildTrendDay,
  buildWeeklyOverview,
  summarizeWeeklyNutrition,
} from "../lib/domain/trends";
import { resolveEffectiveTargets } from "../lib/domain/targets";
import { getNutritionTargets } from "../lib/domain/wellness";
import { query } from "./_generated/server";
import { findCurrentUser } from "./lib/devIdentity";

const STREAK_CAP_DAYS = 60;
const WEEK_STARTS_ON = 0 as const;

function groupByLocalDateKey<T extends { timestamp: number }>(entries: T[], timeZone: string) {
  const grouped = new Map<string, T[]>();

  for (const entry of entries) {
    const dateKey = getLocalDateKey(entry.timestamp, timeZone);
    const current = grouped.get(dateKey) ?? [];
    current.push(entry);
    grouped.set(dateKey, current);
  }

  return grouped;
}

function formatRangeLabel(startDateKey: string, endDateKey: string) {
  const format = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return `${format(startDateKey)} - ${format(endDateKey)}`;
}

function getWeekOffsetCap({
  currentWeekStartDateKey,
  earliestWeekStartDateKey,
}: {
  currentWeekStartDateKey: string;
  earliestWeekStartDateKey: string;
}) {
  const currentUtc = Date.parse(`${currentWeekStartDateKey}T00:00:00.000Z`);
  const earliestUtc = Date.parse(`${earliestWeekStartDateKey}T00:00:00.000Z`);

  return Math.max(0, Math.floor((currentUtc - earliestUtc) / (7 * 24 * 60 * 60 * 1000)));
}

export const weekly = query({
  args: {
    weekOffset: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const requestedOffset = Math.max(0, Math.floor(args.weekOffset));
    const now = Date.now();
    const currentWeekWindow = getWeekWindowForOffset({
      timeZone: user.timeZone,
      timestamp: now,
      weekOffset: 0,
      weekStartsOn: WEEK_STARTS_ON,
    });
    const earliestWeekWindow = getWeekWindowForOffset({
      timeZone: user.timeZone,
      timestamp: user._creationTime,
      weekOffset: 0,
      weekStartsOn: WEEK_STARTS_ON,
    });
    const maxWeekOffset = getWeekOffsetCap({
      currentWeekStartDateKey: currentWeekWindow.startDateKey,
      earliestWeekStartDateKey: earliestWeekWindow.startDateKey,
    });
    const weekOffset = Math.min(requestedOffset, maxWeekOffset);
    const weekDateKeys = getWeekDateKeysForOffset({
      timeZone: user.timeZone,
      timestamp: now,
      weekOffset,
      weekStartsOn: WEEK_STARTS_ON,
    });
    const selectedWeekWindow = getWeekWindowForOffset({
      timeZone: user.timeZone,
      timestamp: now,
      weekOffset,
      weekStartsOn: WEEK_STARTS_ON,
    });
    const selectedMeals = await ctx.db
      .query("meals")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", selectedWeekWindow.start).lt("timestamp", selectedWeekWindow.end)
      )
      .collect();
    const selectedHydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", selectedWeekWindow.start).lt("timestamp", selectedWeekWindow.end)
      )
      .collect();
    const mealsByDate = groupByLocalDateKey(selectedMeals, user.timeZone);
    const hydrationByDate = groupByLocalDateKey(selectedHydrationLogs, user.timeZone);
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
    const todayDateKey = getLocalDateKey(now, user.timeZone);
    const days = weekDateKeys.map((dateKey) =>
      buildTrendDay({
        dateKey,
        hydrationLogs: dateKey > todayDateKey ? [] : (hydrationByDate.get(dateKey) ?? []).map((entry) => ({
          amountOz: entry.amountOz,
          id: entry._id,
          timestamp: entry.timestamp,
        })),
        isFuture: weekOffset === 0 && dateKey > todayDateKey,
        meals: dateKey > todayDateKey ? [] : (mealsByDate.get(dateKey) ?? []).map((meal) => ({
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
      })
    );
    const nutrition = summarizeWeeklyNutrition({ days });
    const overview = buildWeeklyOverview({
      days,
      recurringGaps: nutrition.recurringGaps,
    });
    const streakWindow = getDayWindowForOffset({
      dayOffset: STREAK_CAP_DAYS - 1,
      timeZone: user.timeZone,
      timestamp: now,
    });
    const streakMeals = await ctx.db
      .query("meals")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", streakWindow.start).lt("timestamp", currentWeekWindow.end)
      )
      .collect();
    const streakHydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user_date", (query) =>
        query.eq("userId", user._id).gte("timestamp", streakWindow.start).lt("timestamp", currentWeekWindow.end)
      )
      .collect();
    const streakMealsByDate = groupByLocalDateKey(streakMeals, user.timeZone);
    const streakHydrationByDate = groupByLocalDateKey(streakHydrationLogs, user.timeZone);
    const streakDays = getTrailingDateKeys({
      count: STREAK_CAP_DAYS,
      timeZone: user.timeZone,
      timestamp: now,
    }).map((dateKey) =>
      buildTrendDay({
        dateKey,
        hydrationLogs: (streakHydrationByDate.get(dateKey) ?? []).map((entry) => ({
          amountOz: entry.amountOz,
          id: entry._id,
          timestamp: entry.timestamp,
        })),
        isFuture: false,
        meals: (streakMealsByDate.get(dateKey) ?? []).map((meal) => ({
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
      })
    );

    return {
      days,
      nutrition,
      overview,
      streaks: {
        calories: buildCurrentStreak({ days: streakDays, metric: "calories" }),
        hydration: buildCurrentStreak({ days: streakDays, metric: "hydration" }),
        logging: buildCurrentStreak({ days: streakDays, metric: "logging" }),
        protein: buildCurrentStreak({ days: streakDays, metric: "protein" }),
      },
      targets: {
        calories: macroTargets.calories,
        hydration: user.targetHydration,
        protein: macroTargets.protein,
      },
      week: {
        canGoNewer: weekOffset > 0,
        canGoOlder: weekOffset < maxWeekOffset,
        elapsedDays: days.filter((day) => !day.isFuture).length,
        endDateKey: weekDateKeys[6],
        isCurrentWeek: weekOffset === 0,
        label: formatRangeLabel(weekDateKeys[0], weekDateKeys[6]),
        startDateKey: weekDateKeys[0],
        weekOffset,
      },
    };
  },
});
