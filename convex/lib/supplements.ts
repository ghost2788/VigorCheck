import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import {
  buildProvisionalSupplementFingerprint,
  buildStrongSupplementFingerprint,
  hasSupplementActiveIngredients,
  normalizeSupplementActiveIngredients,
  normalizeSupplementNutritionProfile,
  pickSupplementMergeSurvivor,
  SupplementActiveIngredient,
  SupplementFingerprintKind,
  SupplementNutritionProfile,
  SupplementSourceKind,
} from "../../lib/domain/supplements";
import { getLocalDateKey } from "../../lib/domain/dayWindow";
import { starterSupplements } from "../../lib/data/starterSupplements";

type Ctx = QueryCtx | MutationCtx;

export type ResolvedUserSupplement = {
  activeIngredients: SupplementActiveIngredient[];
  brand?: string;
  displayName: string;
  frequency: "daily" | "as_needed";
  nutritionProfile: ReturnType<typeof normalizeSupplementNutritionProfile>;
  servingLabel: string;
  sourceKind: SupplementSourceKind;
  status: "active" | "archived";
};

export type SupplementWritePayload = {
  activeIngredients: SupplementActiveIngredient[];
  brand?: string;
  displayName: string;
  fingerprintKind: SupplementFingerprintKind;
  frequency: "daily" | "as_needed";
  nutritionProfile?: SupplementNutritionProfile | null;
  productFingerprint: string;
  scanPhotoCount?: number;
  servingLabel?: string | null;
  sourceKind: SupplementSourceKind;
};

function trimToOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeDisplayName(value?: string | null) {
  return trimToOptional(value) ?? "Supplement";
}

function normalizeServingLabel(value?: string | null) {
  return trimToOptional(value) ?? "1 serving";
}

function normalizeStatus(value?: string | null) {
  return value === "archived" ? "archived" : "active";
}

function normalizeSourceKind(value?: string | null): SupplementSourceKind {
  if (value === "scanned" || value === "custom" || value === "legacy") {
    return value;
  }

  return "legacy";
}

function buildRowFingerprint(args: {
  activeIngredients?: SupplementActiveIngredient[] | null;
  displayName?: string | null;
  fingerprintKind?: SupplementFingerprintKind | null;
  nutritionProfile?: SupplementNutritionProfile | null;
  servingLabel?: string | null;
}) {
  if (args.fingerprintKind === "strong" && hasSupplementActiveIngredients(args.activeIngredients)) {
    return buildStrongSupplementFingerprint({
      activeIngredients: args.activeIngredients ?? [],
      nutritionProfile: args.nutritionProfile,
      productName: normalizeDisplayName(args.displayName),
      servingLabel: normalizeServingLabel(args.servingLabel),
    });
  }

  return buildProvisionalSupplementFingerprint({
    nutritionProfile: args.nutritionProfile,
    productName: normalizeDisplayName(args.displayName),
    servingLabel: normalizeServingLabel(args.servingLabel),
  });
}

function buildWriteFields(args: SupplementWritePayload) {
  const activeIngredients = normalizeSupplementActiveIngredients(args.activeIngredients);
  const status = "active" as const;

  return {
    activeIngredients,
    archivedAt: undefined,
    brand: trimToOptional(args.brand),
    displayName: normalizeDisplayName(args.displayName),
    fingerprintKind: args.fingerprintKind,
    frequency: args.frequency,
    lastScannedAt: args.sourceKind === "scanned" ? Date.now() : undefined,
    nutritionProfile: normalizeSupplementNutritionProfile(args.nutritionProfile),
    productFingerprint: args.productFingerprint,
    scanPhotoCount: args.scanPhotoCount,
    servingLabel: normalizeServingLabel(args.servingLabel),
    sourceKind: args.sourceKind,
    status,
  };
}

function buildMergedFrequency(rows: Doc<"userSupplements">[]) {
  return rows.some((row) => row.frequency === "daily") ? "daily" : "as_needed";
}

function buildMergedStatus(rows: Doc<"userSupplements">[]) {
  return rows.some((row) => normalizeStatus(row.status) === "active") ? "active" : "archived";
}

async function listRowsByUser(
  ctx: Ctx,
  userId: Id<"users">
): Promise<Doc<"userSupplements">[]> {
  const rows: Doc<"userSupplements">[] = [];

  for await (const row of ctx.db
    .query("userSupplements")
    .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", userId))) {
    rows.push(row);
  }

  return rows;
}

async function listLogsForSupplementId(
  ctx: MutationCtx,
  userSupplementId: Id<"userSupplements">
): Promise<Doc<"supplementLogs">[]> {
  const logs: Doc<"supplementLogs">[] = [];

  for await (const log of ctx.db
    .query("supplementLogs")
    .withIndex("by_user_supplement_id_and_timestamp", (queryBuilder) =>
      queryBuilder.eq("userSupplementId", userSupplementId)
    )) {
    logs.push(log);
  }

  return logs;
}

async function listLogsByUser(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<Doc<"supplementLogs">[]> {
  const logs: Doc<"supplementLogs">[] = [];

  for await (const log of ctx.db
    .query("supplementLogs")
    .withIndex("by_user_date", (queryBuilder) => queryBuilder.eq("userId", userId))) {
    logs.push(log);
  }

  return logs;
}

async function findRowsByFingerprint(
  ctx: MutationCtx,
  args: {
    productFingerprint: string;
    userId: Id<"users">;
  }
) {
  const rows: Doc<"userSupplements">[] = [];

  for await (const row of ctx.db
    .query("userSupplements")
    .withIndex("by_user_and_product_fingerprint", (queryBuilder) =>
      queryBuilder.eq("userId", args.userId).eq("productFingerprint", args.productFingerprint)
    )) {
    rows.push(row);
  }

  return rows;
}

function getSurvivorRow(rows: Doc<"userSupplements">[]) {
  const survivorId = pickSupplementMergeSurvivor(
    rows.map((row) => ({
      _creationTime: row._creationTime,
      fingerprintKind: row.fingerprintKind ?? "provisional",
      id: row._id,
      status: normalizeStatus(row.status),
    }))
  );

  return rows.find((row) => row._id === survivorId) ?? rows[0] ?? null;
}

async function relinkAndCollapseLogsForRows(
  ctx: MutationCtx,
  args: {
    losingRows: Doc<"userSupplements">[];
    survivorId: Id<"userSupplements">;
    timeZone: string;
  }
) {
  const combinedLogs: Doc<"supplementLogs">[] = [];

  for (const row of args.losingRows) {
    combinedLogs.push(...(await listLogsForSupplementId(ctx, row._id)));
  }

  if (!combinedLogs.length) {
    return;
  }

  const logsByDay = new Map<string, Doc<"supplementLogs">[]>();

  for (const log of combinedLogs) {
    const dayKey = getLocalDateKey(log.timestamp, args.timeZone);
    const dayLogs = logsByDay.get(dayKey) ?? [];
    dayLogs.push(log);
    logsByDay.set(dayKey, dayLogs);
  }

  for (const dayLogs of logsByDay.values()) {
    const orderedLogs = [...dayLogs].sort((left, right) => left.timestamp - right.timestamp);
    const [keptLog, ...duplicateLogs] = orderedLogs;

    if (keptLog.userSupplementId !== args.survivorId) {
      await ctx.db.patch(keptLog._id, {
        userSupplementId: args.survivorId,
      });
    }

    for (const duplicateLog of duplicateLogs) {
      await ctx.db.delete(duplicateLog._id);
    }
  }
}

async function mergeRowsIntoSurvivor(
  ctx: MutationCtx,
  args: {
    currentWriteFields?: Partial<ReturnType<typeof buildWriteFields>>;
    rows: Doc<"userSupplements">[];
    timeZone: string;
  }
) {
  const survivor = getSurvivorRow(args.rows);

  if (!survivor) {
    throw new Error("Supplement merge requires at least one row.");
  }

  const losingRows = args.rows.filter((row) => row._id !== survivor._id);
  const currentWriteFields = args.currentWriteFields;

  await ctx.db.patch(survivor._id, {
    ...(currentWriteFields ?? {
      activeIngredients: survivor.activeIngredients ?? [],
      archivedAt:
        buildMergedStatus(args.rows) === "archived"
          ? survivor.archivedAt ?? Date.now()
          : undefined,
      brand: survivor.brand,
      displayName: survivor.displayName,
      fingerprintKind: survivor.fingerprintKind ?? "provisional",
      frequency: buildMergedFrequency(args.rows),
      lastScannedAt: survivor.lastScannedAt,
      nutritionProfile: normalizeSupplementNutritionProfile(survivor.nutritionProfile),
      productFingerprint:
        survivor.productFingerprint ??
        buildRowFingerprint({
          activeIngredients: survivor.activeIngredients,
          displayName: survivor.displayName,
          fingerprintKind: survivor.fingerprintKind,
          nutritionProfile: survivor.nutritionProfile,
          servingLabel: survivor.servingLabel,
        }),
      scanPhotoCount: survivor.scanPhotoCount,
      servingLabel: survivor.servingLabel,
      sourceKind: normalizeSourceKind(survivor.sourceKind),
      status: buildMergedStatus(args.rows),
    }),
  });

  if (losingRows.length) {
    await relinkAndCollapseLogsForRows(ctx, {
      losingRows: [survivor, ...losingRows],
      survivorId: survivor._id,
      timeZone: args.timeZone,
    });
  }

  for (const losingRow of losingRows) {
    await ctx.db.delete(losingRow._id);
  }

  return survivor._id;
}

export function buildSupplementSearchText(args: {
  brand?: string;
  category?: string;
  name: string;
  servingLabel?: string;
}) {
  return [args.name, args.brand, args.category, args.servingLabel]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .toLowerCase();
}

export function getSupplementCatalogNutritionProfile(supplement: Doc<"supplements">) {
  return normalizeSupplementNutritionProfile(supplement.nutritionProfile ?? supplement.nutrients);
}

export function resolveUserSupplement({
  catalogSupplement,
  userSupplement,
}: {
  catalogSupplement?: Doc<"supplements"> | null;
  userSupplement: Doc<"userSupplements">;
}): ResolvedUserSupplement {
  return {
    activeIngredients: normalizeSupplementActiveIngredients(userSupplement.activeIngredients),
    brand: trimToOptional(userSupplement.brand) ?? trimToOptional(catalogSupplement?.brand),
    displayName:
      trimToOptional(userSupplement.displayName) ??
      trimToOptional(userSupplement.customName) ??
      trimToOptional(catalogSupplement?.name) ??
      "Supplement",
    frequency: userSupplement.frequency,
    nutritionProfile: normalizeSupplementNutritionProfile(
      userSupplement.nutritionProfile ??
        userSupplement.customNutrients ??
        catalogSupplement?.nutritionProfile ??
        catalogSupplement?.nutrients
    ),
    servingLabel:
      trimToOptional(userSupplement.servingLabel) ??
      trimToOptional(catalogSupplement?.servingLabel) ??
      "1 serving",
    sourceKind: normalizeSourceKind(userSupplement.sourceKind),
    status: normalizeStatus(userSupplement.status),
  };
}

export function buildSupplementLogSnapshotFields(args: {
  resolved: ResolvedUserSupplement;
  timestamp: number;
  userId: Id<"users">;
  userSupplementId: Id<"userSupplements">;
}) {
  return {
    loggedActiveIngredients: args.resolved.activeIngredients,
    loggedDisplayName: args.resolved.displayName,
    loggedNutritionProfile: args.resolved.nutritionProfile,
    loggedServingLabel: args.resolved.servingLabel,
    timestamp: args.timestamp,
    userId: args.userId,
    userSupplementId: args.userSupplementId,
  };
}

export function buildSupplementLogSnapshot(log: Doc<"supplementLogs">) {
  const nutritionProfile = normalizeSupplementNutritionProfile(log.loggedNutritionProfile);

  return {
    activeIngredients: normalizeSupplementActiveIngredients(log.loggedActiveIngredients),
    id: log._id,
    label: trimToOptional(log.loggedDisplayName) ?? "Supplement",
    nutrients: nutritionProfile,
    servingLabel: trimToOptional(log.loggedServingLabel) ?? "1 serving",
    timestamp: log.timestamp,
    totals: {
      calories: nutritionProfile.calories,
      carbs: nutritionProfile.carbs,
      fat: nutritionProfile.fat,
      protein: nutritionProfile.protein,
    },
  };
}

export function buildSupplementStackItem(args: {
  isLoggedToday: boolean;
  userSupplement: Doc<"userSupplements">;
  resolved: ResolvedUserSupplement;
}) {
  return {
    activeIngredients: args.resolved.activeIngredients,
    brand: args.resolved.brand,
    frequency: args.resolved.frequency,
    id: args.userSupplement._id,
    isLoggedToday: args.isLoggedToday,
    label: args.resolved.displayName,
    nutritionProfile: args.resolved.nutritionProfile,
    servingLabel: args.resolved.servingLabel,
    sourceKind: args.resolved.sourceKind,
    status: args.resolved.status,
  };
}

export async function seedStarterSupplementCatalogIfNeeded(ctx: MutationCtx) {
  const existing = await ctx.db.query("supplements").take(1);

  if (existing.length > 0) {
    return { seeded: false };
  }

  for (const supplement of starterSupplements) {
    await ctx.db.insert("supplements", {
      brand: supplement.brand,
      category: supplement.category,
      name: supplement.name,
      nutritionProfile: supplement.nutritionProfile,
      nutrients: supplement.nutritionProfile,
      searchText: buildSupplementSearchText({
        brand: supplement.brand,
        category: supplement.category,
        name: supplement.name,
        servingLabel: supplement.servingLabel,
      }),
      servingLabel: supplement.servingLabel,
    });
  }

  return { seeded: true };
}

export async function loadCatalogSupplementsById(
  ctx: Ctx,
  supplementIds: Array<Id<"supplements"> | undefined>
) {
  const uniqueIds = Array.from(
    new Set(supplementIds.filter((supplementId): supplementId is Id<"supplements"> => Boolean(supplementId)))
  );
  const entries = await Promise.all(
    uniqueIds.map(async (supplementId) => [supplementId, await ctx.db.get(supplementId)] as const)
  );

  return new Map(entries);
}

export async function upsertUserSupplementRow(
  ctx: MutationCtx,
  args: {
    existingUserSupplementId?: Id<"userSupplements">;
    payload: SupplementWritePayload;
    userId: Id<"users">;
    userTimeZone: string;
  }
) {
  const writeFields = buildWriteFields(args.payload);
  const fingerprintMatches = await findRowsByFingerprint(ctx, {
    productFingerprint: args.payload.productFingerprint,
    userId: args.userId,
  });
  const explicitRow = args.existingUserSupplementId
    ? await ctx.db.get(args.existingUserSupplementId)
    : null;
  const candidateRows = Array.from(
    new Map(
      [...fingerprintMatches, explicitRow]
        .filter((row): row is Doc<"userSupplements"> => Boolean(row && row.userId === args.userId))
        .map((row) => [row._id, row])
    ).values()
  );

  if (!candidateRows.length) {
    const userSupplementId = await ctx.db.insert("userSupplements", {
      ...writeFields,
      userId: args.userId,
    });

    return { userSupplementId };
  }

  const userSupplementId = await mergeRowsIntoSurvivor(ctx, {
    currentWriteFields: writeFields,
    rows: candidateRows,
    timeZone: args.userTimeZone,
  });

  return { userSupplementId };
}

export async function backfillCurrentUserSupplementRows(
  ctx: MutationCtx,
  userId: Id<"users">,
  timeZone?: string
) {
  const userSupplements = await listRowsByUser(ctx, userId);
  const catalogById = await loadCatalogSupplementsById(
    ctx,
    userSupplements.map((entry) => entry.supplementId)
  );

  for (const userSupplement of userSupplements) {
    const resolved = resolveUserSupplement({
      catalogSupplement: userSupplement.supplementId
        ? catalogById.get(userSupplement.supplementId) ?? null
        : null,
      userSupplement,
    });
    const productFingerprint =
      userSupplement.productFingerprint ??
      buildProvisionalSupplementFingerprint({
        nutritionProfile: resolved.nutritionProfile,
        productName: resolved.displayName,
        servingLabel: resolved.servingLabel,
      });

    await ctx.db.patch(userSupplement._id, {
      activeIngredients: normalizeSupplementActiveIngredients(userSupplement.activeIngredients),
      archivedAt:
        resolved.status === "archived" ? userSupplement.archivedAt ?? Date.now() : undefined,
      brand: resolved.brand,
      displayName: resolved.displayName,
      fingerprintKind: userSupplement.fingerprintKind ?? "provisional",
      nutritionProfile: resolved.nutritionProfile,
      productFingerprint,
      servingLabel: resolved.servingLabel,
      sourceKind: userSupplement.sourceKind ?? "legacy",
      status: resolved.status,
    });
  }

  if (timeZone) {
    const refreshedRows = await listRowsByUser(ctx, userId);
    const rowsByFingerprint = new Map<string, Doc<"userSupplements">[]>();

    for (const row of refreshedRows) {
      const fingerprint =
        row.productFingerprint ??
        buildRowFingerprint({
          activeIngredients: row.activeIngredients,
          displayName: row.displayName,
          fingerprintKind: row.fingerprintKind,
          nutritionProfile: row.nutritionProfile,
          servingLabel: row.servingLabel,
        });
      const group = rowsByFingerprint.get(fingerprint) ?? [];
      group.push(row);
      rowsByFingerprint.set(fingerprint, group);
    }

    for (const [fingerprint, rows] of rowsByFingerprint.entries()) {
      if (rows.length < 2) {
        continue;
      }

      const survivor = getSurvivorRow(rows);

      if (!survivor) {
        continue;
      }

      await mergeRowsIntoSurvivor(ctx, {
        currentWriteFields: {
          activeIngredients: normalizeSupplementActiveIngredients(survivor.activeIngredients),
          brand: survivor.brand,
          displayName: normalizeDisplayName(survivor.displayName),
          fingerprintKind: survivor.fingerprintKind ?? "provisional",
          frequency: buildMergedFrequency(rows),
          nutritionProfile: normalizeSupplementNutritionProfile(survivor.nutritionProfile),
          productFingerprint: survivor.productFingerprint ?? fingerprint,
          scanPhotoCount: survivor.scanPhotoCount,
          servingLabel: normalizeServingLabel(survivor.servingLabel),
          sourceKind: normalizeSourceKind(survivor.sourceKind),
        },
        rows,
        timeZone,
      });
    }
  }

  const userSupplementsById = new Map((await listRowsByUser(ctx, userId)).map((entry) => [entry._id, entry]));
  const supplementLogs = await listLogsByUser(ctx, userId);

  for (const log of supplementLogs) {
    if (log.loggedDisplayName && log.loggedServingLabel && log.loggedNutritionProfile && log.loggedActiveIngredients) {
      continue;
    }

    const userSupplement = userSupplementsById.get(log.userSupplementId);

    if (!userSupplement) {
      continue;
    }

    const resolved = resolveUserSupplement({
      catalogSupplement: userSupplement.supplementId
        ? catalogById.get(userSupplement.supplementId) ?? null
        : null,
      userSupplement,
    });

    await ctx.db.patch(log._id, {
      loggedActiveIngredients: resolved.activeIngredients,
      loggedDisplayName: resolved.displayName,
      loggedNutritionProfile: resolved.nutritionProfile,
      loggedServingLabel: resolved.servingLabel,
    });
  }
}
