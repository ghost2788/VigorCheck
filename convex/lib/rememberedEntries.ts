import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import {
  buildRememberedEntryFingerprint,
  buildRememberedWaterLabel,
  getLegacyHydrationShortcutInitialFavoritedState,
  getRememberedEntrySummary,
  isSeededHydrationShortcutSignature,
  RememberedEntryReplayKind,
  RememberedEntrySnapshot,
  RememberedHydrationSnapshot,
  RememberedMealItemSnapshot,
  RememberedMealSnapshot,
  resolveHydrationDisplayLabel,
} from "../../lib/domain/rememberedEntries";
import { MealType } from "../../lib/domain/meals";
import { createEmptyNutrition, NutritionFields } from "../../lib/domain/scan";
import { requireCurrentUser } from "./devIdentity";

type RememberedEntryDoc = Doc<"rememberedEntries">;
type MealDoc = Doc<"meals">;
type HydrationLogDoc = Doc<"hydrationLogs">;
type HydrationShortcutDoc = Doc<"hydrationShortcuts">;
type MealItemDoc = Doc<"mealItems">;

export function createRememberedReplayId() {
  return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMealDisplayLabel(meal: MealDoc | null, mealSnapshot: RememberedMealSnapshot | null) {
  if (meal?.label?.trim()) {
    return meal.label.trim();
  }

  const firstItemName = mealSnapshot?.items[0]?.foodName?.trim();

  if (firstItemName) {
    return firstItemName;
  }

  return meal ? `${capitalize(meal.mealType)} meal` : "Meal";
}

function getHydrationDisplayLabel(hydration: HydrationLogDoc | null, hydrationSnapshot: RememberedHydrationSnapshot | null) {
  if (!hydration) {
    return hydrationSnapshot?.label?.trim() || "Water";
  }

  return resolveHydrationDisplayLabel({
    amountOz: hydration.amountOz,
    rememberedHydrationLabel: hydrationSnapshot?.label,
    shortcutLabel: hydration.shortcutLabel,
  });
}

function mapMealItemNutrition(item: MealItemDoc): NutritionFields {
  return {
    ...createEmptyNutrition(),
    b12: item.b12,
    b6: item.b6,
    calcium: item.calcium,
    calories: item.calories,
    carbs: item.carbs,
    choline: item.choline ?? 0,
    copper: item.copper ?? 0,
    fat: item.fat,
    fiber: item.fiber,
    folate: item.folate,
    iron: item.iron,
    magnesium: item.magnesium,
    manganese: item.manganese ?? 0,
    niacin: item.niacin,
    omega3: item.omega3 ?? 0,
    phosphorus: item.phosphorus,
    potassium: item.potassium,
    protein: item.protein,
    riboflavin: item.riboflavin,
    selenium: item.selenium ?? 0,
    sodium: item.sodium,
    sugar: item.sugar,
    thiamin: item.thiamin,
    vitaminA: item.vitaminA,
    vitaminC: item.vitaminC,
    vitaminD: item.vitaminD,
    vitaminE: item.vitaminE,
    vitaminK: item.vitaminK,
    zinc: item.zinc,
  };
}

function mapShortcutNutrition(shortcut: HydrationShortcutDoc): NutritionFields {
  return {
    ...createEmptyNutrition(),
    ...(shortcut.nutritionProfile ?? {}),
    calories: shortcut.calories,
    carbs: shortcut.carbs,
    fat: shortcut.fat,
    protein: shortcut.protein,
  };
}

function buildMealSnapshotFromMeal(args: { items: MealItemDoc[]; mealType: MealType }): RememberedMealSnapshot {
  return {
    items: args.items.map<RememberedMealItemSnapshot>((item) => ({
      barcodeValue: item.barcodeValue ?? undefined,
      foodName: item.foodName,
      nutrition: mapMealItemNutrition(item),
      portionAmount: item.portionSize,
      portionUnit: item.portionUnit as RememberedMealItemSnapshot["portionUnit"],
      prepMethod: item.prepMethod ?? undefined,
      source: item.source,
      usdaFoodId: item.usdaFoodId ?? undefined,
    })),
    mealType: args.mealType,
  };
}

function buildHydrationSnapshotFromLog(args: {
  log: HydrationLogDoc;
  rememberedHydrationLabel?: string;
}): RememberedHydrationSnapshot {
  const label = resolveHydrationDisplayLabel({
    amountOz: args.log.amountOz,
    rememberedHydrationLabel: args.rememberedHydrationLabel,
    shortcutLabel: args.log.shortcutLabel,
  });
  const normalized = label.toLowerCase();

  return {
    amountOz: args.log.amountOz,
    beverageKind: normalized.startsWith("water") ? "water" : "drink",
    label,
  };
}

function buildHydrationSnapshotFromShortcut(shortcut: HydrationShortcutDoc): RememberedHydrationSnapshot {
  return {
    amountOz: shortcut.defaultAmountOz,
    beverageKind: shortcut.category === "water" ? "water" : "drink",
    label: shortcut.label,
  };
}

function buildMealSnapshotFromShortcut(shortcut: HydrationShortcutDoc): RememberedMealSnapshot {
  const nutrition = mapShortcutNutrition(shortcut);

  return {
    items: [
      {
        barcodeValue: undefined,
        foodName: shortcut.label,
        nutrition,
        portionAmount: shortcut.defaultAmountOz,
        portionUnit: "oz",
        prepMethod: undefined,
        source: "manual",
        usdaFoodId: undefined,
      },
    ],
    mealType: shortcut.mealType ?? "drink",
  };
}

async function loadMealItems(ctx: MutationCtx, mealId: Id<"meals">) {
  return ctx.db
    .query("mealItems")
    .withIndex("by_meal", (queryBuilder) => queryBuilder.eq("mealId", mealId))
    .collect();
}

async function getRememberedEntryByFingerprint(
  ctx: MutationCtx,
  args: { fingerprint: string; userId: Id<"users"> }
) {
  return ctx.db
    .query("rememberedEntries")
    .withIndex("by_user_and_fingerprint", (queryBuilder) =>
      queryBuilder.eq("userId", args.userId).eq("fingerprint", args.fingerprint)
    )
    .unique();
}

async function getRememberedEntryById(ctx: MutationCtx, rememberedEntryId: Id<"rememberedEntries">) {
  return ctx.db.get(rememberedEntryId);
}

async function getMealByReplayId(ctx: MutationCtx, replayId: string) {
  return ctx.db
    .query("meals")
    .withIndex("by_remembered_replay_id", (queryBuilder) =>
      queryBuilder.eq("rememberedReplayId", replayId)
    )
    .unique();
}

async function getHydrationLogByReplayId(ctx: MutationCtx, replayId: string) {
  return ctx.db
    .query("hydrationLogs")
    .withIndex("by_remembered_replay_id", (queryBuilder) =>
      queryBuilder.eq("rememberedReplayId", replayId)
    )
    .unique();
}

async function patchSourcesForReplay(
  ctx: MutationCtx,
  args: {
    rememberedEntryId: Id<"rememberedEntries">;
    replayId: string;
  }
) {
  const meal = await getMealByReplayId(ctx, args.replayId);
  const hydrationLog = await getHydrationLogByReplayId(ctx, args.replayId);

  if (meal) {
    await ctx.db.patch(meal._id, {
      rememberedEntryId: args.rememberedEntryId,
      rememberedReplayId: args.replayId,
    });
  }

  if (hydrationLog) {
    await ctx.db.patch(hydrationLog._id, {
      rememberedEntryId: args.rememberedEntryId,
      rememberedReplayId: args.replayId,
    });
  }
}

async function getLatestLinkedTimestamp(ctx: MutationCtx, rememberedEntryId: Id<"rememberedEntries">) {
  const latestMeal = await ctx.db
    .query("meals")
    .withIndex("by_remembered_entry_id_and_timestamp", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", rememberedEntryId)
    )
    .order("desc")
    .take(1);
  const latestHydration = await ctx.db
    .query("hydrationLogs")
    .withIndex("by_remembered_entry_id_and_timestamp", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", rememberedEntryId)
    )
    .order("desc")
    .take(1);

  return Math.max(latestMeal[0]?.timestamp ?? 0, latestHydration[0]?.timestamp ?? 0);
}

async function hasOtherReplayOccurrences(
  ctx: MutationCtx,
  args: {
    rememberedEntryId: Id<"rememberedEntries">;
    replayId: string;
  }
) {
  for await (const meal of ctx.db
    .query("meals")
    .withIndex("by_remembered_entry_id", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", args.rememberedEntryId)
    )) {
    if (meal.rememberedReplayId && meal.rememberedReplayId !== args.replayId) {
      return true;
    }
  }

  for await (const hydrationLog of ctx.db
    .query("hydrationLogs")
    .withIndex("by_remembered_entry_id", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", args.rememberedEntryId)
    )) {
    if (hydrationLog.rememberedReplayId && hydrationLog.rememberedReplayId !== args.replayId) {
      return true;
    }
  }

  return false;
}

async function relinkAllSourcesForRememberedEntry(
  ctx: MutationCtx,
  args: {
    fromRememberedEntryId: Id<"rememberedEntries">;
    toRememberedEntryId: Id<"rememberedEntries">;
  }
) {
  for await (const meal of ctx.db
    .query("meals")
    .withIndex("by_remembered_entry_id", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", args.fromRememberedEntryId)
    )) {
    await ctx.db.patch(meal._id, {
      rememberedEntryId: args.toRememberedEntryId,
    });
  }

  for await (const hydrationLog of ctx.db
    .query("hydrationLogs")
    .withIndex("by_remembered_entry_id", (queryBuilder) =>
      queryBuilder.eq("rememberedEntryId", args.fromRememberedEntryId)
    )) {
    await ctx.db.patch(hydrationLog._id, {
      rememberedEntryId: args.toRememberedEntryId,
    });
  }
}

async function relinkReplayOccurrence(
  ctx: MutationCtx,
  args: {
    replayId: string;
    toRememberedEntryId: Id<"rememberedEntries">;
  }
) {
  const meal = await getMealByReplayId(ctx, args.replayId);
  const hydrationLog = await getHydrationLogByReplayId(ctx, args.replayId);

  if (meal) {
    await ctx.db.patch(meal._id, {
      rememberedEntryId: args.toRememberedEntryId,
    });
  }

  if (hydrationLog) {
    await ctx.db.patch(hydrationLog._id, {
      rememberedEntryId: args.toRememberedEntryId,
    });
  }
}

async function deleteRememberedEntryIfOrphaned(ctx: MutationCtx, rememberedEntryId: Id<"rememberedEntries">) {
  const latestTimestamp = await getLatestLinkedTimestamp(ctx, rememberedEntryId);

  if (!latestTimestamp) {
    await ctx.db.delete(rememberedEntryId);
  }
}

function toStoredSnapshot(
  snapshot: RememberedEntrySnapshot
): Pick<RememberedEntryDoc, "displayLabel" | "hydrationSnapshot" | "mealSnapshot" | "replayKind"> {
  return {
    displayLabel: snapshot.displayLabel,
    hydrationSnapshot: "hydration" in snapshot ? snapshot.hydration : undefined,
    mealSnapshot: "meal" in snapshot ? snapshot.meal : undefined,
    replayKind: snapshot.replayKind,
  };
}

async function buildSnapshotFromReplaySources(
  ctx: MutationCtx,
  args: {
    fallbackRememberedEntry?: RememberedEntryDoc | null;
    hydrationLog?: HydrationLogDoc | null;
    meal?: MealDoc | null;
  }
) {
  const meal = args.meal ?? null;
  const hydrationLog = args.hydrationLog ?? null;
  const fallback = args.fallbackRememberedEntry ?? null;

  const mealSnapshot =
    meal
      ? buildMealSnapshotFromMeal({
          items: await loadMealItems(ctx, meal._id),
          mealType: meal.mealType,
        })
      : fallback?.mealSnapshot
        ? {
            items: fallback.mealSnapshot.items as RememberedMealSnapshot["items"],
            mealType: fallback.mealSnapshot.mealType as MealType,
          }
        : null;
  const hydrationSnapshot =
    hydrationLog
      ? buildHydrationSnapshotFromLog({
          log: hydrationLog,
          rememberedHydrationLabel: fallback?.hydrationSnapshot?.label,
        })
      : fallback?.hydrationSnapshot
        ? {
            amountOz: fallback.hydrationSnapshot.amountOz,
            beverageKind: fallback.hydrationSnapshot.beverageKind,
            label: fallback.hydrationSnapshot.label,
          }
        : null;

  if (!mealSnapshot && !hydrationSnapshot) {
    throw new Error("Remembered entry snapshot could not be rebuilt.");
  }

  const displayLabel = mealSnapshot
    ? getMealDisplayLabel(meal, mealSnapshot)
    : getHydrationDisplayLabel(hydrationLog, hydrationSnapshot);
  const snapshot = mealSnapshot && hydrationSnapshot
    ? ({
        displayLabel,
        hydration: hydrationSnapshot,
        meal: mealSnapshot,
        replayKind: "meal_and_hydration",
      } satisfies RememberedEntrySnapshot)
    : mealSnapshot
      ? ({
          displayLabel,
          meal: mealSnapshot,
          replayKind: "meal_only",
        } satisfies RememberedEntrySnapshot)
      : ({
          displayLabel,
          hydration: hydrationSnapshot!,
          replayKind: "hydration_only",
        } satisfies RememberedEntrySnapshot);

  return {
    fingerprint: buildRememberedEntryFingerprint(snapshot),
    snapshot,
    timestamp: Math.max(meal?.timestamp ?? 0, hydrationLog?.timestamp ?? 0, fallback?.lastUsedAt ?? 0),
  };
}

function sumMealSnapshotTotals(items: RememberedMealItemSnapshot[]) {
  return items.reduce(
    (totals, item) => ({
      ...totals,
      b12: totals.b12 + item.nutrition.b12,
      b6: totals.b6 + item.nutrition.b6,
      calcium: totals.calcium + item.nutrition.calcium,
      calories: totals.calories + item.nutrition.calories,
      carbs: totals.carbs + item.nutrition.carbs,
      choline: totals.choline + item.nutrition.choline,
      copper: totals.copper + item.nutrition.copper,
      fat: totals.fat + item.nutrition.fat,
      fiber: totals.fiber + item.nutrition.fiber,
      folate: totals.folate + item.nutrition.folate,
      iron: totals.iron + item.nutrition.iron,
      magnesium: totals.magnesium + item.nutrition.magnesium,
      manganese: totals.manganese + item.nutrition.manganese,
      niacin: totals.niacin + item.nutrition.niacin,
      omega3: totals.omega3 + item.nutrition.omega3,
      phosphorus: totals.phosphorus + item.nutrition.phosphorus,
      potassium: totals.potassium + item.nutrition.potassium,
      protein: totals.protein + item.nutrition.protein,
      riboflavin: totals.riboflavin + item.nutrition.riboflavin,
      selenium: totals.selenium + item.nutrition.selenium,
      sodium: totals.sodium + item.nutrition.sodium,
      sugar: totals.sugar + item.nutrition.sugar,
      thiamin: totals.thiamin + item.nutrition.thiamin,
      vitaminA: totals.vitaminA + item.nutrition.vitaminA,
      vitaminC: totals.vitaminC + item.nutrition.vitaminC,
      vitaminD: totals.vitaminD + item.nutrition.vitaminD,
      vitaminE: totals.vitaminE + item.nutrition.vitaminE,
      vitaminK: totals.vitaminK + item.nutrition.vitaminK,
      zinc: totals.zinc + item.nutrition.zinc,
    }),
    createEmptyNutrition()
  );
}

async function createOrUpdateRememberedEntry(
  ctx: MutationCtx,
  args: {
    favorited: boolean;
    fingerprint: string;
    preserveExistingFavorited?: boolean;
    snapshot: RememberedEntrySnapshot;
    timestamp: number;
    userId: Id<"users">;
  }
) {
  const existing = await getRememberedEntryByFingerprint(ctx, {
    fingerprint: args.fingerprint,
    userId: args.userId,
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...toStoredSnapshot(args.snapshot),
      favorited: args.preserveExistingFavorited === false ? args.favorited : existing.favorited || args.favorited,
      lastUsedAt: Math.max(existing.lastUsedAt, args.timestamp),
    });

    return existing._id;
  }

  return ctx.db.insert("rememberedEntries", {
    ...toStoredSnapshot(args.snapshot),
    favorited: args.favorited,
    fingerprint: args.fingerprint,
    lastUsedAt: args.timestamp,
    userId: args.userId,
  });
}

export async function upsertRememberedEntryFromReplaySources(
  ctx: MutationCtx,
  args: {
    favorited?: boolean;
    hydrationLogId?: Id<"hydrationLogs">;
    mealId?: Id<"meals">;
    replayId: string;
  }
) {
  const user = await requireCurrentUser(ctx);
  const meal = args.mealId ? await ctx.db.get(args.mealId) : null;
  const hydrationLog = args.hydrationLogId ? await ctx.db.get(args.hydrationLogId) : null;
  const { fingerprint, snapshot, timestamp } = await buildSnapshotFromReplaySources(ctx, {
    hydrationLog,
    meal,
  });
  const rememberedEntryId = await createOrUpdateRememberedEntry(ctx, {
    favorited: Boolean(args.favorited),
    fingerprint,
    snapshot,
    timestamp,
    userId: user._id,
  });

  await patchSourcesForReplay(ctx, {
    rememberedEntryId,
    replayId: args.replayId,
  });

  return { rememberedEntryId };
}

async function createSplitEntryFromReplay(
  ctx: MutationCtx,
  args: {
    replayId: string;
    snapshot: RememberedEntrySnapshot;
    timestamp: number;
    userId: Id<"users">;
  }
) {
  const splitEntryId = await ctx.db.insert("rememberedEntries", {
    ...toStoredSnapshot(args.snapshot),
    favorited: false,
    fingerprint: buildRememberedEntryFingerprint(args.snapshot),
    lastUsedAt: args.timestamp,
    userId: args.userId,
  });

  await relinkReplayOccurrence(ctx, {
    replayId: args.replayId,
    toRememberedEntryId: splitEntryId,
  });

  return splitEntryId;
}

export async function refreshRememberedEntryFromReplaySources(
  ctx: MutationCtx,
  args: {
    hydrationLogId?: Id<"hydrationLogs">;
    mealId?: Id<"meals">;
  }
) {
  const meal = args.mealId ? await ctx.db.get(args.mealId) : null;
  const hydrationLog = args.hydrationLogId ? await ctx.db.get(args.hydrationLogId) : null;
  const currentRememberedEntryId = meal?.rememberedEntryId ?? hydrationLog?.rememberedEntryId;
  const replayId = meal?.rememberedReplayId ?? hydrationLog?.rememberedReplayId ?? createRememberedReplayId();
  const userId = meal?.userId ?? hydrationLog?.userId;

  if (!userId) {
    throw new Error("Remembered replay refresh requires a linked source.");
  }

  const currentRememberedEntry = currentRememberedEntryId
    ? await getRememberedEntryById(ctx, currentRememberedEntryId)
    : null;
  const rebuilt = await buildSnapshotFromReplaySources(ctx, {
    fallbackRememberedEntry: currentRememberedEntry,
    hydrationLog,
    meal,
  });

  if (!currentRememberedEntry) {
    const rememberedEntryId = await createOrUpdateRememberedEntry(ctx, {
      favorited: false,
      fingerprint: rebuilt.fingerprint,
      snapshot: rebuilt.snapshot,
      timestamp: rebuilt.timestamp,
      userId,
    });
    await patchSourcesForReplay(ctx, {
      rememberedEntryId,
      replayId,
    });
    return;
  }

  if (currentRememberedEntry.fingerprint === rebuilt.fingerprint) {
    await ctx.db.patch(currentRememberedEntry._id, {
      ...toStoredSnapshot(rebuilt.snapshot),
      lastUsedAt: await getLatestLinkedTimestamp(ctx, currentRememberedEntry._id),
    });
    return;
  }

  let workingEntryId = currentRememberedEntry._id;
  const shouldSplit = await hasOtherReplayOccurrences(ctx, {
    rememberedEntryId: currentRememberedEntry._id,
    replayId,
  });

  if (shouldSplit) {
    workingEntryId = await createSplitEntryFromReplay(ctx, {
      replayId,
      snapshot: rebuilt.snapshot,
      timestamp: rebuilt.timestamp,
      userId,
    });
    await ctx.db.patch(currentRememberedEntry._id, {
      lastUsedAt: await getLatestLinkedTimestamp(ctx, currentRememberedEntry._id),
    });
  }

  const collision = await getRememberedEntryByFingerprint(ctx, {
    fingerprint: rebuilt.fingerprint,
    userId,
  });

  if (collision && collision._id !== workingEntryId) {
    const workingEntry = await getRememberedEntryById(ctx, workingEntryId);

    if (workingEntry) {
      await ctx.db.patch(collision._id, {
        favorited: collision.favorited || workingEntry.favorited,
        lastUsedAt: Math.max(collision.lastUsedAt, rebuilt.timestamp),
      });
      await relinkAllSourcesForRememberedEntry(ctx, {
        fromRememberedEntryId: workingEntryId,
        toRememberedEntryId: collision._id,
      });
      await deleteRememberedEntryIfOrphaned(ctx, workingEntryId);
    }

    return;
  }

  await ctx.db.patch(workingEntryId, {
    ...toStoredSnapshot(rebuilt.snapshot),
    fingerprint: rebuilt.fingerprint,
    lastUsedAt: shouldSplit
      ? rebuilt.timestamp
      : await getLatestLinkedTimestamp(ctx, workingEntryId),
  });
}

export async function migrateLegacyHydrationShortcuts(ctx: MutationCtx) {
  const user = await requireCurrentUser(ctx);

  if (user.rememberedEntriesMigrationVersion === 1) {
    return { migrated: 0, normalizedFavorites: 0, skipped: true };
  }

  const shortcuts = await ctx.db
    .query("hydrationShortcuts")
    .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", user._id))
    .take(100);
  let migrated = 0;
  let normalizedFavorites = 0;

  for (const shortcut of shortcuts) {
    const hydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_shortcut_id", (queryBuilder) => queryBuilder.eq("shortcutId", shortcut._id))
      .take(100);
    const hasUsage = hydrationLogs.length > 0;

    if (!hasUsage && isSeededHydrationShortcutSignature({
      calories: shortcut.calories,
      carbs: shortcut.carbs,
      category: shortcut.category,
      defaultAmountOz: shortcut.defaultAmountOz,
      fat: shortcut.fat,
      label: shortcut.label,
      logMode: shortcut.logMode,
      mealType: shortcut.mealType,
      pinned: shortcut.pinned,
      protein: shortcut.protein,
    })) {
      continue;
    }

    const snapshot: RememberedEntrySnapshot =
      shortcut.logMode === "hydration_and_nutrition"
        ? {
            displayLabel: shortcut.label,
            hydration: buildHydrationSnapshotFromShortcut(shortcut),
            meal: buildMealSnapshotFromShortcut(shortcut),
            replayKind: "meal_and_hydration",
          }
        : {
            displayLabel: shortcut.label,
            hydration: buildHydrationSnapshotFromShortcut(shortcut),
            replayKind: "hydration_only",
          };

      const rememberedEntryId = await createOrUpdateRememberedEntry(ctx, {
      favorited: getLegacyHydrationShortcutInitialFavoritedState(),
        fingerprint: buildRememberedEntryFingerprint(snapshot),
        preserveExistingFavorited: false,
        snapshot,
        timestamp: shortcut.lastUsedAt,
        userId: user._id,
      });

    const rememberedEntry = await ctx.db.get(rememberedEntryId);

    if (rememberedEntry?.favorited) {
      normalizedFavorites += 1;
    }

    for (const hydrationLog of hydrationLogs) {
      const replayId = hydrationLog.rememberedReplayId ?? `legacy_${hydrationLog._id}`;

      await ctx.db.patch(hydrationLog._id, {
        rememberedEntryId,
        rememberedReplayId: replayId,
      });

      if (shortcut.logMode !== "hydration_and_nutrition") {
        continue;
      }

      const matchingMeals = await ctx.db
        .query("meals")
        .withIndex("by_user_date", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).eq("timestamp", hydrationLog.timestamp)
        )
        .take(10);
      const pairedMeal = matchingMeals.filter(
        (meal) =>
          meal.entryMethod === "saved_meal" &&
          meal.label === shortcut.label &&
          meal.timestamp === hydrationLog.timestamp
      );

      if (pairedMeal.length === 1) {
        await ctx.db.patch(pairedMeal[0]._id, {
          rememberedEntryId,
          rememberedReplayId: replayId,
        });
      }
    }

    migrated += 1;
  }

  await ctx.db.patch(user._id, {
    rememberedEntriesMigrationVersion: 1,
  });

  return { migrated, normalizedFavorites, skipped: false };
}

export async function replayRememberedEntry(
  ctx: MutationCtx,
  rememberedEntry: RememberedEntryDoc
) {
  const replayId = createRememberedReplayId();
  const timestamp = Date.now();
  const totals = rememberedEntry.mealSnapshot
    ? sumMealSnapshotTotals(rememberedEntry.mealSnapshot.items as RememberedMealSnapshot["items"])
    : null;
  let mealId: Id<"meals"> | undefined;
  let hydrationLogId: Id<"hydrationLogs"> | undefined;

  if (rememberedEntry.mealSnapshot && totals) {
    mealId = await ctx.db.insert("meals", {
      aiConfidence: undefined,
      b12: totals.b12,
      b6: totals.b6,
      calcium: totals.calcium,
      choline: totals.choline,
      copper: totals.copper,
      entryMethod: "saved_meal",
      folate: totals.folate,
      iron: totals.iron,
      label: rememberedEntry.displayLabel,
      magnesium: totals.magnesium,
      manganese: totals.manganese,
      mealType: rememberedEntry.mealSnapshot.mealType,
      niacin: totals.niacin,
      omega3: totals.omega3,
      phosphorus: totals.phosphorus,
      photoStorageId: undefined,
      potassium: totals.potassium,
      rememberedEntryId: rememberedEntry._id,
      rememberedReplayId: replayId,
      riboflavin: totals.riboflavin,
      selenium: totals.selenium,
      thiamin: totals.thiamin,
      timestamp,
      totalCalories: totals.calories,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      totalProtein: totals.protein,
      totalSodium: totals.sodium,
      totalSugar: totals.sugar,
      userId: rememberedEntry.userId,
      vitaminA: totals.vitaminA,
      vitaminC: totals.vitaminC,
      vitaminD: totals.vitaminD,
      vitaminE: totals.vitaminE,
      vitaminK: totals.vitaminK,
      zinc: totals.zinc,
    });

    for (const item of rememberedEntry.mealSnapshot.items as RememberedMealSnapshot["items"]) {
      await ctx.db.insert("mealItems", {
        b12: item.nutrition.b12,
        b6: item.nutrition.b6,
        barcodeValue: item.barcodeValue,
        calcium: item.nutrition.calcium,
        calories: item.nutrition.calories,
        carbs: item.nutrition.carbs,
        choline: item.nutrition.choline,
        confidence: undefined,
        copper: item.nutrition.copper,
        fat: item.nutrition.fat,
        fiber: item.nutrition.fiber,
        folate: item.nutrition.folate,
        foodName: item.foodName,
        iron: item.nutrition.iron,
        magnesium: item.nutrition.magnesium,
        mealId,
        manganese: item.nutrition.manganese,
        niacin: item.nutrition.niacin,
        omega3: item.nutrition.omega3,
        phosphorus: item.nutrition.phosphorus,
        portionSize: item.portionAmount,
        portionUnit: item.portionUnit,
        potassium: item.nutrition.potassium,
        prepMethod: item.prepMethod,
        protein: item.nutrition.protein,
        riboflavin: item.nutrition.riboflavin,
        selenium: item.nutrition.selenium,
        sodium: item.nutrition.sodium,
        source: item.source,
        sugar: item.nutrition.sugar,
        thiamin: item.nutrition.thiamin,
        usdaFoodId: item.usdaFoodId,
        vitaminA: item.nutrition.vitaminA,
        vitaminC: item.nutrition.vitaminC,
        vitaminD: item.nutrition.vitaminD,
        vitaminE: item.nutrition.vitaminE,
        vitaminK: item.nutrition.vitaminK,
        zinc: item.nutrition.zinc,
      });
    }
  }

  if (rememberedEntry.hydrationSnapshot) {
    hydrationLogId = await ctx.db.insert("hydrationLogs", {
      amountOz: rememberedEntry.hydrationSnapshot.amountOz,
      rememberedEntryId: rememberedEntry._id,
      rememberedReplayId: replayId,
      shortcutId: undefined,
      shortcutLabel: rememberedEntry.hydrationSnapshot.label,
      timestamp,
      userId: rememberedEntry.userId,
    });
  }

  await ctx.db.patch(rememberedEntry._id, {
    lastUsedAt: timestamp,
  });

  return { hydrationLogId, mealId };
}

export function buildRememberedEntryListItem(rememberedEntry: RememberedEntryDoc) {
  return {
    id: rememberedEntry._id,
    label: rememberedEntry.displayLabel,
    replayKind: rememberedEntry.replayKind,
    summary: getRememberedEntrySummary({
      amountOz: rememberedEntry.hydrationSnapshot?.amountOz,
      mealType: rememberedEntry.mealSnapshot?.mealType as MealType | undefined,
      replayKind: rememberedEntry.replayKind as RememberedEntryReplayKind,
    }),
  };
}
