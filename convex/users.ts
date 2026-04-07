import { v } from "convex/values";
import { formatClockTime, parseClockTime, validateReminderWindow } from "../lib/domain/reminders";
import {
  buildRevenueCatAppUserId,
  getTrialEndsAt,
  normalizeSubscriptionSnapshot,
} from "../lib/domain/subscription";
import {
  GoalPace,
  PreferredUnitSystem,
  PrimaryTrackingChallenge,
  requiresGoalPace,
  computeBaseTargets,
  resolveEditableTargets,
  resolveEffectiveTargets,
} from "../lib/domain/targets";
import { mergePlanSettings, toPlanSettings } from "../lib/domain/profileSettings";
import { mutation, query } from "./_generated/server";
import { findCurrentUser, getCurrentTokenIdentifier, requireCurrentUser, resetCurrentDevUser } from "./lib/devIdentity";

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

const goalPaceValidator = v.union(
  v.literal("slow"),
  v.literal("moderate"),
  v.literal("aggressive")
);

const sexValidator = v.union(v.literal("male"), v.literal("female"));

const preferredUnitSystemValidator = v.union(v.literal("imperial"), v.literal("metric"));

const primaryTrackingChallengeValidator = v.union(
  v.literal("consistency"),
  v.literal("knowing_what_to_eat"),
  v.literal("portion_sizes"),
  v.literal("motivation")
);

const editableTargetsValidator = v.object({
  calories: v.number(),
  carbs: v.number(),
  fat: v.number(),
  protein: v.number(),
});

function getDefaultDisplayName(displayName?: string) {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "";
}

function buildUserPatch(args: {
  activityLevel: "sedentary" | "light" | "moderate" | "active";
  age: number;
  displayName?: string;
  goalPace?: GoalPace;
  goalType: "general_health" | "fat_loss" | "muscle_gain" | "energy_balance";
  height: number;
  preferredUnitSystem: PreferredUnitSystem;
  primaryTrackingChallenge: PrimaryTrackingChallenge;
  sex: "male" | "female";
  targets: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  timeZone: string;
  weight: number;
}) {
  const computedTargets = computeBaseTargets({
    activityLevel: args.activityLevel,
    age: args.age,
    goalPace: args.goalPace,
    goalType: args.goalType,
    height: args.height,
    sex: args.sex,
    weight: args.weight,
  });
  const overrides = resolveEditableTargets({
    computed: computedTargets,
    submitted: args.targets,
  });

  return {
    activityLevel: args.activityLevel,
    age: args.age,
    displayName: getDefaultDisplayName(args.displayName),
    goalPace: args.goalPace,
    goalType: args.goalType,
    height: args.height,
    overrideCalories: overrides.overrideCalories,
    overrideCarbs: overrides.overrideCarbs,
    overrideFat: overrides.overrideFat,
    overrideProtein: overrides.overrideProtein,
    preferredUnitSystem: args.preferredUnitSystem,
    primaryTrackingChallenge: args.primaryTrackingChallenge,
    sex: args.sex,
    targetCalories: computedTargets.calories,
    targetCarbs: computedTargets.carbs,
    targetFat: computedTargets.fat,
    targetFiber: computedTargets.fiber,
    targetHydration: computedTargets.hydration,
    targetProtein: computedTargets.protein,
    targetSodium: computedTargets.sodium,
    targetSugar: computedTargets.sugar,
    timeZone: args.timeZone.trim() || "UTC",
    weight: args.weight,
  };
}

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
      displayName: user.displayName,
      goalPace: user.goalPace,
      goalType: user.goalType,
      height: user.height,
      preferredUnitSystem: user.preferredUnitSystem,
      primaryTrackingChallenge: user.primaryTrackingChallenge,
      reminders: {
        notifyEndOfDay: user.notifyEndOfDay,
        notifyGoalCompletion: user.notifyGoalCompletion,
        notifyHydration: user.notifyHydration,
        notifyMealLogging: user.notifyMealLogging,
        sleepTime: user.sleepTime,
        wakeTime: user.wakeTime,
      },
      sex: user.sex,
      subscription: {
        ...normalizeSubscriptionSnapshot({
          lastBillingSyncAt: user.lastBillingSyncAt,
          revenueCatAppUserId: user.revenueCatAppUserId ?? buildRevenueCatAppUserId(user._id),
          status: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          subscriptionPlatform: user.subscriptionPlatform,
          subscriptionProductId: user.subscriptionProductId,
          trialEndsAt: user.trialEndsAt,
          trialStartDate: user.trialStartDate,
        }),
      },
      targets: resolveEffectiveTargets(user),
      themePalette: user.themePalette ?? "default",
      timeZone: user.timeZone,
      weight: user.weight,
    };
  },
});

export const completeOnboarding = mutation({
  args: {
    activityLevel: activityLevelValidator,
    age: v.number(),
    displayName: v.optional(v.string()),
    goalPace: v.optional(goalPaceValidator),
    goalType: goalTypeValidator,
    height: v.number(),
    preferredUnitSystem: preferredUnitSystemValidator,
    primaryTrackingChallenge: primaryTrackingChallengeValidator,
    sex: sexValidator,
    targets: editableTargetsValidator,
    timeZone: v.string(),
    weight: v.number(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getCurrentTokenIdentifier(ctx);

    if (!tokenIdentifier) {
      throw new Error("Sign in before saving your plan.");
    }

    const existingUser = await findCurrentUser(ctx);
    const patch = buildUserPatch(args);

    if (existingUser) {
      await ctx.db.patch(existingUser._id, patch);
      return existingUser._id;
    }

    const trialStartDate = Date.now();
    const userId = await ctx.db.insert("users", {
      notifyEndOfDay: false,
      notifyGoalCompletion: false,
      notifyHydration: false,
      notifyMealLogging: false,
      sleepTime: "22:00",
      subscriptionStatus: "trial",
      themePalette: "default",
      tokenIdentifier,
      trialEndsAt: getTrialEndsAt(trialStartDate),
      trialStartDate,
      wakeTime: "07:00",
      ...patch,
    });

    await ctx.db.patch(userId, {
      revenueCatAppUserId: buildRevenueCatAppUserId(userId),
    });

    return userId;
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
    const existingUser = await requireCurrentUser(ctx);
    const patch = buildUserPatch({
      ...args,
      displayName: existingUser.displayName,
      goalPace: existingUser.goalPace,
      preferredUnitSystem: existingUser.preferredUnitSystem ?? "imperial",
      primaryTrackingChallenge: existingUser.primaryTrackingChallenge ?? "consistency",
    });

    await ctx.db.patch(existingUser._id, {
      ...patch,
      themePalette: existingUser.themePalette ?? "default",
    });

    return existingUser._id;
  },
});

export const updateCurrentPlanSettings = mutation({
  args: {
    activityLevel: v.optional(activityLevelValidator),
    age: v.optional(v.number()),
    goalPace: v.optional(goalPaceValidator),
    goalType: v.optional(goalTypeValidator),
    height: v.optional(v.number()),
    preferredUnitSystem: v.optional(preferredUnitSystemValidator),
    primaryTrackingChallenge: v.optional(primaryTrackingChallengeValidator),
    sex: v.optional(sexValidator),
    targets: v.optional(editableTargetsValidator),
    timeZone: v.optional(v.string()),
    weight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingUser = await requireCurrentUser(ctx);
    const mergedSettings = mergePlanSettings(toPlanSettings({
      activityLevel: existingUser.activityLevel,
      age: existingUser.age,
      goalPace: existingUser.goalPace,
      goalType: existingUser.goalType,
      height: existingUser.height,
      preferredUnitSystem: existingUser.preferredUnitSystem,
      primaryTrackingChallenge: existingUser.primaryTrackingChallenge,
      sex: existingUser.sex,
      targets: resolveEffectiveTargets(existingUser),
      timeZone: existingUser.timeZone,
      weight: existingUser.weight,
    }), args);
    const patch = buildUserPatch({
      activityLevel: mergedSettings.activityLevel,
      age: mergedSettings.age,
      displayName: existingUser.displayName,
      goalPace: requiresGoalPace(mergedSettings.goalType) ? mergedSettings.goalPace : undefined,
      goalType: mergedSettings.goalType,
      height: mergedSettings.height,
      preferredUnitSystem: mergedSettings.preferredUnitSystem,
      primaryTrackingChallenge: mergedSettings.primaryTrackingChallenge,
      sex: mergedSettings.sex,
      targets: mergedSettings.targets,
      timeZone: mergedSettings.timeZone,
      weight: mergedSettings.weight,
    });

    await ctx.db.patch(existingUser._id, {
      ...patch,
      themePalette: existingUser.themePalette ?? "default",
    });

    return existingUser._id;
  },
});

export const updateReminderSettings = mutation({
  args: {
    notifyEndOfDay: v.boolean(),
    notifyGoalCompletion: v.boolean(),
    notifyHydration: v.boolean(),
    notifyMealLogging: v.boolean(),
    sleepTime: v.string(),
    wakeTime: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await requireCurrentUser(ctx);
    const parsedWake = parseClockTime(args.wakeTime);
    const parsedSleep = parseClockTime(args.sleepTime);
    const validationError = validateReminderWindow({
      sleepTime: args.sleepTime,
      wakeTime: args.wakeTime,
    });

    if (!parsedWake || !parsedSleep || validationError) {
      throw new Error(validationError ?? "Enter a valid wake and sleep time.");
    }

    await ctx.db.patch(existingUser._id, {
      notifyEndOfDay: args.notifyEndOfDay,
      notifyGoalCompletion: args.notifyGoalCompletion,
      notifyHydration: args.notifyHydration,
      notifyMealLogging: args.notifyMealLogging,
      sleepTime: formatClockTime(parsedSleep),
      wakeTime: formatClockTime(parsedWake),
    });

    return existingUser._id;
  },
});

export const resetCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    return resetCurrentDevUser(ctx);
  },
});
