import { v } from "convex/values";
import { resolveEffectiveTargets, computeBaseTargets, resolveEditableTargets } from "../lib/domain/targets";
import { mutation, query } from "./_generated/server";
import { findCurrentUser, getCurrentAuthSubject } from "./lib/devIdentity";

const activityLevelValidator = v.union(
  v.literal("sedentary"),
  v.literal("light"),
  v.literal("moderate"),
  v.literal("active")
);

const goalTypeValidator = v.union(
  v.literal("general_health"),
  v.literal("fat_loss"),
  v.literal("muscle_gain"),
  v.literal("energy_balance")
);

const sexValidator = v.union(v.literal("male"), v.literal("female"));

const editableTargetsValidator = v.object({
  calories: v.number(),
  carbs: v.number(),
  fat: v.number(),
  protein: v.number(),
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      activityLevel: user.activityLevel,
      age: user.age,
      goalType: user.goalType,
      height: user.height,
      sex: user.sex,
      targets: resolveEffectiveTargets(user),
      themePalette: user.themePalette ?? "default",
      timeZone: user.timeZone,
      weight: user.weight,
    };
  },
});

export const upsertCurrent = mutation({
  args: {
    activityLevel: activityLevelValidator,
    age: v.number(),
    goalType: goalTypeValidator,
    height: v.number(),
    sex: sexValidator,
    targets: editableTargetsValidator,
    timeZone: v.string(),
    weight: v.number(),
  },
  handler: async (ctx, args) => {
    const existingUser = await findCurrentUser(ctx);
    const computedTargets = computeBaseTargets({
      activityLevel: args.activityLevel,
      age: args.age,
      goalType: args.goalType,
      height: args.height,
      sex: args.sex,
      weight: args.weight,
    });
    const overrides = resolveEditableTargets({
      computed: computedTargets,
      submitted: args.targets,
    });
    const patch = {
      activityLevel: args.activityLevel,
      age: args.age,
      goalType: args.goalType,
      height: args.height,
      overrideCalories: overrides.overrideCalories,
      overrideCarbs: overrides.overrideCarbs,
      overrideFat: overrides.overrideFat,
      overrideProtein: overrides.overrideProtein,
      sex: args.sex,
      targetCalories: computedTargets.calories,
      targetCarbs: computedTargets.carbs,
      targetFat: computedTargets.fat,
      targetFiber: computedTargets.fiber,
      targetHydration: computedTargets.hydration,
      targetProtein: computedTargets.protein,
      targetSodium: computedTargets.sodium,
      targetSugar: computedTargets.sugar,
      themePalette: existingUser?.themePalette ?? "default",
      timeZone: args.timeZone.trim() || "UTC",
      weight: args.weight,
    };

    if (existingUser) {
      await ctx.db.patch(existingUser._id, patch);
      return existingUser._id;
    }

    return ctx.db.insert("users", {
      authSubject: getCurrentAuthSubject(),
      notifyEndOfDay: false,
      notifyGoalCompletion: false,
      notifyHydration: false,
      notifyMealLogging: false,
      sleepTime: "22:00",
      subscriptionStatus: "trial",
      trialStartDate: Date.now(),
      wakeTime: "07:00",
      ...patch,
    });
  },
});
