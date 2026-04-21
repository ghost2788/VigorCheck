"use node";

import { Buffer } from "node:buffer";
import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, ActionCtx } from "./_generated/server";
import {
  buildNormalizedScanDraftComponents,
  findBestUsdaMatch,
  groupAssembledFoodDraftItems,
  mergeDuplicateStandaloneDraftItems,
  normalizeScanConfidence,
  nutritionFromUsdaPer100g,
  promoteDraftItemToUsda,
  ScanConfidence,
  ScanDraftItem,
  UsdaMatchCandidate,
} from "../lib/domain/scan";
import { MealType, resolveDraftMealType } from "../lib/domain/meals";
import {
  buildAiObservabilityRecordArgs,
  recordAiRequestSafely,
} from "./lib/aiObservability";
import { mealTypeValidator } from "./lib/validators";

const OPENAI_SCAN_MODEL = "gpt-4.1";

const scanResponseSchema = {
  additionalProperties: false,
  properties: {
    items: {
      items: {
        additionalProperties: false,
        properties: {
          confidence: {
            enum: ["high", "medium", "low"],
            type: "string",
          },
          estimatedGrams: {
            type: "number",
          },
          name: {
            type: "string",
          },
          nutrition: {
            additionalProperties: false,
            properties: {
              b12: { type: "number" },
              b6: { type: "number" },
              calcium: { type: "number" },
              calories: { type: "number" },
              carbs: { type: "number" },
              choline: { type: "number" },
              copper: { type: "number" },
              fat: { type: "number" },
              fiber: { type: "number" },
              folate: { type: "number" },
              iron: { type: "number" },
              magnesium: { type: "number" },
              manganese: { type: "number" },
              niacin: { type: "number" },
              omega3: { type: "number" },
              phosphorus: { type: "number" },
              potassium: { type: "number" },
              protein: { type: "number" },
              riboflavin: { type: "number" },
              selenium: { type: "number" },
              sodium: { type: "number" },
              sugar: { type: "number" },
              thiamin: { type: "number" },
              vitaminA: { type: "number" },
              vitaminC: { type: "number" },
              vitaminD: { type: "number" },
              vitaminE: { type: "number" },
              vitaminK: { type: "number" },
              zinc: { type: "number" },
            },
            required: [
              "calories",
              "protein",
              "carbs",
              "fat",
              "fiber",
              "omega3",
              "choline",
              "sodium",
              "sugar",
              "vitaminA",
              "vitaminC",
              "vitaminD",
              "vitaminE",
              "vitaminK",
              "b6",
              "b12",
              "folate",
              "thiamin",
              "niacin",
              "riboflavin",
              "calcium",
              "iron",
              "potassium",
              "magnesium",
              "selenium",
              "copper",
              "manganese",
              "zinc",
              "phosphorus",
            ],
            type: "object",
          },
          portionLabel: {
            type: "string",
          },
          prepMethod: {
            type: ["string", "null"],
          },
        },
        required: ["name", "portionLabel", "estimatedGrams", "confidence", "nutrition", "prepMethod"],
        type: "object",
      },
      type: "array",
    },
    overallConfidence: {
      enum: ["high", "medium", "low"],
      type: "string",
    },
  },
  required: ["overallConfidence", "items"],
  type: "object",
} as const;

const scanPrompt = [
  "Analyze this meal photo and identify the visible food items.",
  "Return separate items for distinct foods on the plate, but keep obvious assembled foods like sandwiches, burgers, wraps, tacos, and toast with toppings as a single item.",
  "Do not split bread, buns, tortillas, or toast away from their filling when they are clearly one assembled food.",
  "Estimate edible weight in grams for each item.",
  "Use whole numbers for calories and grams. Use decimals when needed for micronutrients such as omega-3, copper, or manganese.",
  "Do not duplicate the same item unless there are clearly multiple separate portions.",
  "Estimate omega-3, choline, selenium, copper, and manganese when possible.",
  "If prep method is visible, include it.",
  "If uncertain, still return your best estimate and lower the confidence.",
  "Ignore plates, cutlery, cups, napkins, and background objects.",
].join(" ");

type AnalyzePhotoResult = {
  entryMethod: "photo_scan";
  items: ScanDraftItem[];
  mealType: MealType;
  overallConfidence: ScanConfidence;
  photoStorageId: Id<"_storage">;
};

type ParsedScanItem = {
  confidence: "high" | "medium" | "low";
  estimatedGrams: number;
  name: string;
  nutrition: Record<string, number>;
  portionLabel: string;
  prepMethod?: string | null;
};

type UsdaSearchCandidate = UsdaMatchCandidate & {
  b12Per100g: number;
  b6Per100g: number;
  calciumPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  folatePer100g: number;
  ironPer100g: number;
  magnesiumPer100g: number;
  manganesePer100g?: number;
  niacinPer100g: number;
  omega3Per100g?: number;
  phosphorusPer100g: number;
  potassiumPer100g: number;
  proteinPer100g: number;
  riboflavinPer100g: number;
  seleniumPer100g?: number;
  sodiumPer100g: number;
  sugarPer100g: number;
  thiaminPer100g: number;
  vitaminAPer100g: number;
  vitaminCPer100g: number;
  vitaminDPer100g: number;
  vitaminEPer100g: number;
  vitaminKPer100g: number;
  zincPer100g: number;
  cholinePer100g?: number;
  copperPer100g?: number;
};

async function buildScanDraft(
  ctx: ActionCtx,
  args: {
    mealType: MealType;
    requestStartedAt: number;
    storageId: Id<"_storage">;
  }
): Promise<AnalyzePhotoResult> {
  const imageUrl = await ctx.storage.getUrl(args.storageId);

  if (!imageUrl) {
    throw new Error("Uploaded meal photo could not be read from storage.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let response: Awaited<ReturnType<OpenAI["responses"]["create"]>>;

  try {
    response = await client.responses.create({
      input: [
        {
          content: [
            {
              text: scanPrompt,
              type: "input_text",
            },
            {
              detail: "high",
              image_url: imageUrl,
              type: "input_image",
            },
          ],
          role: "user",
        },
      ],
      model: OPENAI_SCAN_MODEL,
      text: {
        format: {
          name: "caltracker_meal_scan",
          schema: scanResponseSchema,
          strict: true,
          type: "json_schema",
        },
      },
    });
  } catch (error) {
    await recordAiRequestSafely(
      ctx,
      buildAiObservabilityRecordArgs({
        callKind: "photo_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: OPENAI_SCAN_MODEL,
        resultStatus: "provider_error",
        usageState: "not_applicable",
      })
    );
    throw error;
  }

  try {
    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error("OpenAI scan response did not include structured output.");
    }

    const parsed = JSON.parse(outputText) as {
      items?: ParsedScanItem[];
      overallConfidence?: unknown;
    };

    const normalizedComponents: ScanDraftItem[] = buildNormalizedScanDraftComponents(
      (parsed.items ?? []).map((item) => ({
        ...item,
        prepMethod: item.prepMethod ?? undefined,
      }))
    );

    if (!normalizedComponents.length) {
      throw new Error("No usable food items were detected from this meal photo.");
    }

    const matchedComponents: ScanDraftItem[] = await Promise.all(
      normalizedComponents.map(async (item) => {
        const candidates = (await ctx.runQuery(internal.usda.searchByName, {
          term: item.name,
        })) as UsdaSearchCandidate[];
        const match = findBestUsdaMatch(item.name, candidates);

        if (!match) {
          return item;
        }

        return promoteDraftItemToUsda(item, match.fdcId, nutritionFromUsdaPer100g(match));
      })
    );
    const groupedItems = groupAssembledFoodDraftItems(matchedComponents);
    const matchedItems = mergeDuplicateStandaloneDraftItems(groupedItems);
    const result = {
      entryMethod: "photo_scan" as const,
      items: matchedItems,
      mealType: resolveDraftMealType({
        itemNames: matchedItems.map((item) => item.name),
        seedMealType: args.mealType,
        source: "photo",
      }),
      overallConfidence: normalizeScanConfidence(parsed.overallConfidence),
      photoStorageId: args.storageId,
    };

    await recordAiRequestSafely(
      ctx,
      buildAiObservabilityRecordArgs({
        callKind: "photo_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: OPENAI_SCAN_MODEL,
        resultStatus: "completed",
        usage: response.usage,
      })
    );

    return result;
  } catch (error) {
    await recordAiRequestSafely(
      ctx,
      buildAiObservabilityRecordArgs({
        callKind: "photo_scan",
        completedAt: Date.now(),
        createdAt: args.requestStartedAt,
        featureKind: "photo_scan",
        model: OPENAI_SCAN_MODEL,
        resultStatus: "postprocess_error",
        usage: response.usage,
      })
    );
    throw error;
  }
}

export const analyzePhoto = action({
  args: {
    base64: v.string(),
    mealType: mealTypeValidator,
    mimeType: v.string(),
  },
  handler: async (ctx, args): Promise<AnalyzePhotoResult> => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in Convex.");
    }

    const requestStartedAt = Date.now();
    const precheckResult = await ctx.runQuery(internal.aiUsage.precheck, {
      featureKind: "photo_scan",
    });

    if (!precheckResult.allowed) {
      await recordAiRequestSafely(
        ctx,
        buildAiObservabilityRecordArgs({
          blockedLimitKind: precheckResult.blockingLimitKind,
          callKind: "photo_scan",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "photo_scan",
          model: OPENAI_SCAN_MODEL,
          resultStatus: "blocked_quota",
          usageState: "not_applicable",
        })
      );
      throw new Error(precheckResult.message ?? "AI photo scans are unavailable right now.");
    }

    let storageId: Id<"_storage">;

    try {
      const bytes = Buffer.from(args.base64, "base64");
      const blob = new Blob([bytes], {
        type: args.mimeType || "image/jpeg",
      });
      storageId = await ctx.storage.store(blob);
    } catch {
      throw new Error("The selected photo could not be prepared for Convex storage.");
    }

    const reserveResult = await ctx.runMutation(internal.aiUsage.reserve, {
      featureKind: "photo_scan",
    });

    if (!reserveResult.allowed) {
      await recordAiRequestSafely(
        ctx,
        buildAiObservabilityRecordArgs({
          blockedLimitKind: reserveResult.blockingLimitKind,
          callKind: "photo_scan",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "photo_scan",
          model: OPENAI_SCAN_MODEL,
          resultStatus: "blocked_quota",
          usageState: "not_applicable",
        })
      );
      throw new Error(reserveResult.message ?? "AI photo scans are unavailable right now.");
    }

    return buildScanDraft(ctx, {
      mealType: args.mealType,
      requestStartedAt,
      storageId,
    });
  },
});
