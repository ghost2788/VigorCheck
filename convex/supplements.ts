import OpenAI from "openai";
import { v } from "convex/values";
import { ActionCtx, action, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getDayWindowForTimestamp } from "../lib/domain/dayWindow";
import {
  buildProvisionalSupplementFingerprint,
  buildStrongSupplementFingerprint,
  hasSupplementActiveIngredients,
  normalizeSupplementActiveIngredients,
  normalizeSupplementNutritionProfile,
  SupplementActiveIngredient,
  SupplementReviewDraft,
} from "../lib/domain/supplements";
import { buildAiObservabilityRecordArgs, recordAiRequestSafely } from "./lib/aiObservability";
import { supplementActiveIngredientValidator, supplementNutritionValidator } from "./lib/validators";
import { findCurrentUser, requireCurrentUser } from "./lib/devIdentity";
import {
  backfillCurrentUserSupplementRows,
  buildSupplementLogSnapshotFields,
  buildSupplementSearchText,
  buildSupplementStackItem,
  loadCatalogSupplementsById,
  resolveUserSupplement,
  seedStarterSupplementCatalogIfNeeded,
  upsertUserSupplementRow,
} from "./lib/supplements";

const SUPPLEMENT_SCAN_MODEL = "gpt-4.1";

const supplementScanResponseSchema = {
  additionalProperties: false,
  properties: {
    activeIngredients: {
      items: {
        additionalProperties: false,
        properties: {
          amount: {
            type: ["number", "null"],
          },
          name: {
            type: "string",
          },
          note: {
            type: ["string", "null"],
          },
          unit: {
            type: ["string", "null"],
          },
        },
        required: ["name", "amount", "unit", "note"],
        type: "object",
      },
      type: "array",
    },
    brand: {
      type: ["string", "null"],
    },
    nutritionProfile: {
      additionalProperties: false,
      properties: {
        b12: { type: ["number", "null"] },
        b6: { type: ["number", "null"] },
        calcium: { type: ["number", "null"] },
        calories: { type: ["number", "null"] },
        carbs: { type: ["number", "null"] },
        choline: { type: ["number", "null"] },
        copper: { type: ["number", "null"] },
        fat: { type: ["number", "null"] },
        fiber: { type: ["number", "null"] },
        folate: { type: ["number", "null"] },
        iron: { type: ["number", "null"] },
        magnesium: { type: ["number", "null"] },
        manganese: { type: ["number", "null"] },
        niacin: { type: ["number", "null"] },
        omega3: { type: ["number", "null"] },
        phosphorus: { type: ["number", "null"] },
        potassium: { type: ["number", "null"] },
        protein: { type: ["number", "null"] },
        riboflavin: { type: ["number", "null"] },
        selenium: { type: ["number", "null"] },
        sodium: { type: ["number", "null"] },
        sugar: { type: ["number", "null"] },
        thiamin: { type: ["number", "null"] },
        vitaminA: { type: ["number", "null"] },
        vitaminC: { type: ["number", "null"] },
        vitaminD: { type: ["number", "null"] },
        vitaminE: { type: ["number", "null"] },
        vitaminK: { type: ["number", "null"] },
        zinc: { type: ["number", "null"] },
      },
      required: [],
      type: "object",
    },
    overallConfidence: {
      enum: ["high", "medium", "low"],
      type: "string",
    },
    productName: {
      type: "string",
    },
    servingLabel: {
      type: "string",
    },
    servingsPerContainer: {
      type: ["string", "null"],
    },
  },
  required: [
    "productName",
    "brand",
    "servingLabel",
    "servingsPerContainer",
    "activeIngredients",
    "nutritionProfile",
    "overallConfidence",
  ],
  type: "object",
} as const;

const supplementScanPrompt = [
  "Analyze these supplement label photos and extract one supplement product.",
  "Use the front label for brand and product name.",
  "Use the supplement facts panel for serving size, servings per container, vitamins, minerals, calories, macros, sodium, and active ingredients.",
  "Return active ingredients as a structured list with name, amount, and unit when visible.",
  "Only include nutrition values that are actually visible on the label.",
  "If a value is missing or unreadable, return null for that field instead of guessing.",
  "If you receive only one photo, still return the best draft you can.",
  "Lower confidence when the label is blurry, curved, or partly obstructed.",
].join(" ");

function sanitizeActiveIngredients(activeIngredients?: SupplementActiveIngredient[] | null) {
  return normalizeSupplementActiveIngredients(activeIngredients);
}

function sanitizeDraftPayload(draft: {
  activeIngredients?: SupplementActiveIngredient[] | null;
  brand?: string | null;
  displayName?: string | null;
  frequency?: "daily" | "as_needed";
  nutritionProfile?: Record<string, number | null | undefined> | null;
  overallConfidence?: "high" | "medium" | "low";
  servingLabel?: string | null;
  servingsPerContainer?: string | null;
}): SupplementReviewDraft {
  const nutritionProfile = Object.fromEntries(
    Object.entries(draft.nutritionProfile ?? {}).flatMap(([key, value]) =>
      typeof value === "number" && Number.isFinite(value) ? [[key, value]] : []
    )
  );

  return {
    activeIngredients: sanitizeActiveIngredients(draft.activeIngredients),
    brand: draft.brand?.trim() || undefined,
    displayName: draft.displayName?.trim() || "Supplement",
    frequency: draft.frequency ?? "daily",
    nutritionProfile,
    overallConfidence: draft.overallConfidence ?? "medium",
    servingLabel: draft.servingLabel?.trim() || "1 serving",
    servingsPerContainer: draft.servingsPerContainer?.trim() || undefined,
  };
}

function requireActiveIngredients(activeIngredients: SupplementActiveIngredient[]) {
  if (!hasSupplementActiveIngredients(activeIngredients)) {
    throw new Error("Add at least one active ingredient before saving this supplement.");
  }
}

function sortStackItems<T extends { label: string }>(items: T[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label));
}

async function getOwnedUserSupplement(
  ctx: Parameters<typeof requireCurrentUser>[0],
  userSupplementId: Id<"userSupplements">
) {
  const user = await requireCurrentUser(ctx);
  const userSupplement = await ctx.db.get(userSupplementId);

  if (!userSupplement || userSupplement.userId !== user._id) {
    throw new Error("Supplement not found.");
  }

  return { user, userSupplement };
}

function getTodayLogWindow(timeZone: string) {
  return getDayWindowForTimestamp(Date.now(), timeZone);
}

async function findTodaySupplementLogs(
  ctx: Parameters<typeof requireCurrentUser>[0],
  args: {
    end: number;
    start: number;
    userSupplementId: Id<"userSupplements">;
  }
) {
  const logs = [];

  for await (const log of ctx.db
    .query("supplementLogs")
    .withIndex("by_user_supplement_id_and_timestamp", (queryBuilder) =>
      queryBuilder.eq("userSupplementId", args.userSupplementId).gte("timestamp", args.start).lt("timestamp", args.end)
    )) {
    logs.push(log);
  }

  return logs;
}

async function buildSupplementScanDraft(args: {
  factsPhotoStorageId?: Id<"_storage"> | null;
  frontPhotoStorageId: Id<"_storage">;
  requestStartedAt: number;
  ctx: ActionCtx;
}) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const inputContent: Array<
    | { text: string; type: "input_text" }
    | { detail: "high"; image_url: string; type: "input_image" }
  > = [
    {
      text: supplementScanPrompt,
      type: "input_text",
    },
  ];
  const frontPhotoUrl = await args.ctx.storage.getUrl(args.frontPhotoStorageId);

  if (!frontPhotoUrl) {
    throw new Error("Uploaded supplement photo could not be read from Convex storage.");
  }

  inputContent.push({
    detail: "high",
    image_url: frontPhotoUrl,
    type: "input_image",
  });

  if (args.factsPhotoStorageId) {
    const factsPhotoUrl = await args.ctx.storage.getUrl(args.factsPhotoStorageId);

    if (!factsPhotoUrl) {
      throw new Error("Uploaded supplement facts photo could not be read from Convex storage.");
    }

    inputContent.push({
      detail: "high",
      image_url: factsPhotoUrl,
      type: "input_image",
    });
  }

  let response: Awaited<ReturnType<OpenAI["responses"]["create"]>>;

  try {
    response = await client.responses.create({
      input: [
        {
          content: inputContent,
          role: "user",
        },
      ],
      model: SUPPLEMENT_SCAN_MODEL,
      text: {
        format: {
          name: "caltracker_supplement_scan",
          schema: supplementScanResponseSchema,
          strict: true,
          type: "json_schema",
        },
      },
    });
  } catch (error) {
    await recordAiRequestSafely(
      args.ctx,
      buildAiObservabilityRecordArgs({
        callKind: "supplement_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: SUPPLEMENT_SCAN_MODEL,
        resultStatus: "provider_error",
        usageState: "not_applicable",
      })
    );
    throw error;
  }

  try {
    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error("OpenAI supplement scan response did not include structured output.");
    }

    const parsed = JSON.parse(outputText) as {
      activeIngredients?: SupplementActiveIngredient[];
      brand?: string | null;
      nutritionProfile?: Record<string, number | null>;
      overallConfidence?: "high" | "medium" | "low";
      productName?: string;
      servingLabel?: string;
      servingsPerContainer?: string | null;
    };

    const draft = sanitizeDraftPayload({
      activeIngredients: parsed.activeIngredients,
      brand: parsed.brand,
      displayName: parsed.productName,
      nutritionProfile: parsed.nutritionProfile,
      overallConfidence: parsed.overallConfidence,
      servingLabel: parsed.servingLabel,
      servingsPerContainer: parsed.servingsPerContainer,
    });

    if (!draft.displayName.trim()) {
      throw new Error("No supplement name could be extracted from that label.");
    }

    await recordAiRequestSafely(
      args.ctx,
      buildAiObservabilityRecordArgs({
        callKind: "supplement_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: SUPPLEMENT_SCAN_MODEL,
        resultStatus: "completed",
        usage: response.usage,
      })
    );

    return draft;
  } catch (error) {
    await recordAiRequestSafely(
      args.ctx,
      buildAiObservabilityRecordArgs({
        callKind: "supplement_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: SUPPLEMENT_SCAN_MODEL,
        resultStatus: "postprocess_error",
        usage: response.usage,
      })
    );
    throw error;
  }
}

export const analyzeLabelPhotos = action({
  args: {
    factsPhotoBase64: v.optional(v.string()),
    factsPhotoMimeType: v.optional(v.string()),
    frontPhotoBase64: v.string(),
    frontPhotoMimeType: v.string(),
  },
  handler: async (ctx, args): Promise<SupplementReviewDraft> => {
    return ctx.runAction(api.supplementScan.analyzeLabelPhotos, args);
  },
});

export const ensureReady = mutation({
  args: {},
  handler: async (ctx) => {
    const catalog = await seedStarterSupplementCatalogIfNeeded(ctx);
    const user = await findCurrentUser(ctx);

    if (!user) {
      return {
        seededCatalog: catalog.seeded,
        syncedUserData: false,
      };
    }

    await backfillCurrentUserSupplementRows(ctx, user._id, user.timeZone);

    return {
      seededCatalog: catalog.seeded,
      syncedUserData: true,
    };
  },
});

export const currentStack = query({
  args: {},
  handler: async (ctx) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return {
        archived: [],
        asNeeded: [],
        daily: [],
      };
    }

    const { end, start } = getTodayLogWindow(user.timeZone);
    const [dailyRows, asNeededRows, archivedDailyRows, archivedAsNeededRows, todayLogs] = await Promise.all([
      ctx.db
        .query("userSupplements")
        .withIndex("by_user_and_status_and_frequency", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).eq("status", "active").eq("frequency", "daily")
        )
        .collect(),
      ctx.db
        .query("userSupplements")
        .withIndex("by_user_and_status_and_frequency", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).eq("status", "active").eq("frequency", "as_needed")
        )
        .collect(),
      ctx.db
        .query("userSupplements")
        .withIndex("by_user_and_status_and_frequency", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).eq("status", "archived").eq("frequency", "daily")
        )
        .collect(),
      ctx.db
        .query("userSupplements")
        .withIndex("by_user_and_status_and_frequency", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).eq("status", "archived").eq("frequency", "as_needed")
        )
        .collect(),
      ctx.db
        .query("supplementLogs")
        .withIndex("by_user_date", (queryBuilder) =>
          queryBuilder.eq("userId", user._id).gte("timestamp", start).lt("timestamp", end)
        )
        .collect(),
    ]);

    const catalogById = await loadCatalogSupplementsById(ctx, [
      ...dailyRows.map((entry) => entry.supplementId),
      ...asNeededRows.map((entry) => entry.supplementId),
      ...archivedDailyRows.map((entry) => entry.supplementId),
      ...archivedAsNeededRows.map((entry) => entry.supplementId),
    ]);
    const loggedTodayIds = new Set(todayLogs.map((entry) => entry.userSupplementId));
    const mapRow = (row: (typeof dailyRows)[number]) =>
      buildSupplementStackItem({
        isLoggedToday: loggedTodayIds.has(row._id),
        resolved: resolveUserSupplement({
          catalogSupplement: row.supplementId ? catalogById.get(row.supplementId) ?? null : null,
          userSupplement: row,
        }),
        userSupplement: row,
      });

    return {
      archived: sortStackItems([...archivedDailyRows, ...archivedAsNeededRows].map(mapRow)),
      asNeeded: sortStackItems(asNeededRows.map(mapRow)),
      daily: sortStackItems(dailyRows.map(mapRow)),
    };
  },
});

export const searchCatalog = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await findCurrentUser(ctx);

    if (!user) {
      return [];
    }

    const term = args.query.trim().toLowerCase();

    if (!term) {
      return [];
    }

    const results = await ctx.db
      .query("supplements")
      .withSearchIndex("by_search_text", (queryBuilder) => queryBuilder.search("searchText", term))
      .take(12);

    return results.map((result) => ({
      brand: result.brand,
      category: result.category,
      id: result._id,
      label: result.name,
      servingLabel: result.servingLabel ?? "1 serving",
    }));
  },
});

export const addCatalogSupplementToStack = mutation({
  args: {
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    supplementId: v.id("supplements"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const supplement = await ctx.db.get(args.supplementId);

    if (!supplement) {
      throw new Error("Supplement not found.");
    }

    const userSupplementId = (
      await upsertUserSupplementRow(ctx, {
        payload: {
          activeIngredients: [],
          brand: supplement.brand,
          displayName: supplement.name,
          fingerprintKind: "provisional",
          frequency: args.frequency,
          nutritionProfile: supplement.nutritionProfile ?? supplement.nutrients,
          productFingerprint: buildProvisionalSupplementFingerprint({
            nutritionProfile: supplement.nutritionProfile ?? supplement.nutrients,
            productName: supplement.name,
            servingLabel: supplement.servingLabel ?? "1 serving",
          }),
          servingLabel: supplement.servingLabel ?? "1 serving",
          sourceKind: "legacy",
        },
        userId: user._id,
        userTimeZone: user.timeZone,
      })
    ).userSupplementId;

    return { userSupplementId };
  },
});

export const createCustomSupplement = mutation({
  args: {
    activeIngredients: v.array(supplementActiveIngredientValidator),
    brand: v.optional(v.string()),
    displayName: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    nutritionProfile: supplementNutritionValidator,
    servingLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const activeIngredients = sanitizeActiveIngredients(args.activeIngredients);

    requireActiveIngredients(activeIngredients);

    const userSupplementId = (
      await upsertUserSupplementRow(ctx, {
        payload: {
          activeIngredients,
          brand: args.brand,
          displayName: args.displayName.trim(),
          fingerprintKind: "strong",
          frequency: args.frequency,
          nutritionProfile: args.nutritionProfile,
          productFingerprint: buildStrongSupplementFingerprint({
            activeIngredients,
            nutritionProfile: args.nutritionProfile,
            productName: args.displayName.trim(),
            servingLabel: args.servingLabel.trim() || "1 serving",
          }),
          servingLabel: args.servingLabel,
          sourceKind: "custom",
        },
        userId: user._id,
        userTimeZone: user.timeZone,
      })
    ).userSupplementId;

    return { userSupplementId };
  },
});

export const updateStackItem = mutation({
  args: {
    activeIngredients: v.array(supplementActiveIngredientValidator),
    brand: v.optional(v.string()),
    displayName: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    nutritionProfile: supplementNutritionValidator,
    servingLabel: v.string(),
    userSupplementId: v.id("userSupplements"),
  },
  handler: async (ctx, args) => {
    const { user, userSupplement } = await getOwnedUserSupplement(ctx, args.userSupplementId);
    const activeIngredients = sanitizeActiveIngredients(args.activeIngredients);

    requireActiveIngredients(activeIngredients);

    const userSupplementId = (
      await upsertUserSupplementRow(ctx, {
        existingUserSupplementId: userSupplement._id,
        payload: {
          activeIngredients,
          brand: args.brand,
          displayName: args.displayName.trim(),
          fingerprintKind: "strong",
          frequency: args.frequency,
          nutritionProfile: args.nutritionProfile,
          productFingerprint: buildStrongSupplementFingerprint({
            activeIngredients,
            nutritionProfile: args.nutritionProfile,
            productName: args.displayName.trim(),
            servingLabel: args.servingLabel.trim() || "1 serving",
          }),
          servingLabel: args.servingLabel,
          sourceKind: userSupplement.sourceKind === "scanned" ? "scanned" : "custom",
        },
        userId: user._id,
        userTimeZone: user.timeZone,
      })
    ).userSupplementId;

    return { userSupplementId };
  },
});

export const saveScannedSupplement = mutation({
  args: {
    activeIngredients: v.array(supplementActiveIngredientValidator),
    brand: v.optional(v.string()),
    displayName: v.string(),
    existingUserSupplementId: v.optional(v.id("userSupplements")),
    frequency: v.union(v.literal("daily"), v.literal("as_needed")),
    nutritionProfile: supplementNutritionValidator,
    scanPhotoCount: v.number(),
    servingLabel: v.string(),
    takenToday: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const activeIngredients = sanitizeActiveIngredients(args.activeIngredients);

    requireActiveIngredients(activeIngredients);

    const userSupplementId = (
      await upsertUserSupplementRow(ctx, {
        existingUserSupplementId: args.existingUserSupplementId,
        payload: {
          activeIngredients,
          brand: args.brand,
          displayName: args.displayName.trim(),
          fingerprintKind: "strong",
          frequency: args.frequency,
          nutritionProfile: args.nutritionProfile,
          productFingerprint: buildStrongSupplementFingerprint({
            activeIngredients,
            nutritionProfile: args.nutritionProfile,
            productName: args.displayName.trim(),
            servingLabel: args.servingLabel.trim() || "1 serving",
          }),
          scanPhotoCount: args.scanPhotoCount,
          servingLabel: args.servingLabel,
          sourceKind: "scanned",
        },
        userId: user._id,
        userTimeZone: user.timeZone,
      })
    ).userSupplementId;

    if (!args.takenToday) {
      return {
        alreadyLoggedToday: false,
        supplementLogId: null,
        userSupplementId,
      };
    }

    const { end, start } = getTodayLogWindow(user.timeZone);
    const existingLogs = await findTodaySupplementLogs(ctx, {
      end,
      start,
      userSupplementId,
    });

    if (existingLogs[0]) {
      return {
        alreadyLoggedToday: true,
        supplementLogId: existingLogs[0]._id,
        userSupplementId,
      };
    }

    const supplementLogId = await ctx.db.insert(
      "supplementLogs",
      buildSupplementLogSnapshotFields({
        resolved: {
          activeIngredients,
          brand: args.brand?.trim() || undefined,
          displayName: args.displayName.trim(),
          frequency: args.frequency,
          nutritionProfile: normalizeSupplementNutritionProfile(args.nutritionProfile),
          servingLabel: args.servingLabel.trim() || "1 serving",
          sourceKind: "scanned",
          status: "active",
        },
        timestamp: Date.now(),
        userId: user._id,
        userSupplementId,
      })
    );

    return {
      alreadyLoggedToday: false,
      supplementLogId,
      userSupplementId,
    };
  },
});

export const archiveStackItem = mutation({
  args: {
    userSupplementId: v.id("userSupplements"),
  },
  handler: async (ctx, args) => {
    const { userSupplement } = await getOwnedUserSupplement(ctx, args.userSupplementId);

    await ctx.db.patch(userSupplement._id, {
      archivedAt: Date.now(),
      status: "archived",
    });

    return { userSupplementId: userSupplement._id };
  },
});

export const logToday = mutation({
  args: {
    userSupplementId: v.id("userSupplements"),
  },
  handler: async (ctx, args) => {
    const { user, userSupplement } = await getOwnedUserSupplement(ctx, args.userSupplementId);
    const { end, start } = getTodayLogWindow(user.timeZone);
    const existingLogs = await findTodaySupplementLogs(ctx, {
      end,
      start,
      userSupplementId: userSupplement._id,
    });

    if (existingLogs[0]) {
      return { supplementLogId: existingLogs[0]._id };
    }

    if ((userSupplement.status ?? "active") !== "active") {
      throw new Error("Archived supplements cannot be logged.");
    }

    const catalogSupplement = userSupplement.supplementId
      ? await ctx.db.get(userSupplement.supplementId)
      : null;
    const resolved = resolveUserSupplement({
      catalogSupplement,
      userSupplement,
    });
    const supplementLogId = await ctx.db.insert(
      "supplementLogs",
      buildSupplementLogSnapshotFields({
        resolved,
        timestamp: Date.now(),
        userId: user._id,
        userSupplementId: userSupplement._id,
      })
    );

    return { supplementLogId };
  },
});

export const unlogToday = mutation({
  args: {
    userSupplementId: v.id("userSupplements"),
  },
  handler: async (ctx, args) => {
    const { user, userSupplement } = await getOwnedUserSupplement(ctx, args.userSupplementId);
    const { end, start } = getTodayLogWindow(user.timeZone);
    const logs = await findTodaySupplementLogs(ctx, {
      end,
      start,
      userSupplementId: userSupplement._id,
    });

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    return { deleted: logs.length > 0 };
  },
});

export const deleteLog = mutation({
  args: {
    logId: v.id("supplementLogs"),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const log = await ctx.db.get(args.logId);

    if (!log || log.userId !== user._id) {
      throw new Error("Supplement log not found.");
    }

    await ctx.db.delete(log._id);

    return { deleted: true };
  },
});
