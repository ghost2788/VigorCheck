"use node";

import { Buffer } from "node:buffer";
import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import {
  buildNormalizedScanDraftItems,
  findBestUsdaMatch,
  normalizeScanConfidence,
  nutritionFromUsdaPer100g,
  promoteDraftItemToUsda,
  ScanConfidence,
  ScanDraftItem,
  UsdaMatchCandidate,
} from "../lib/domain/scan";
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
              fat: { type: "number" },
              fiber: { type: "number" },
              folate: { type: "number" },
              iron: { type: "number" },
              magnesium: { type: "number" },
              niacin: { type: "number" },
              phosphorus: { type: "number" },
              potassium: { type: "number" },
              protein: { type: "number" },
              riboflavin: { type: "number" },
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
  "Return separate items, not a single combined plate summary.",
  "Estimate edible weight in grams for each item.",
  "Use integers for nutrition values and grams.",
  "Do not duplicate the same item unless there are clearly multiple separate portions.",
  "If prep method is visible, include it.",
  "If uncertain, still return your best estimate and lower the confidence.",
  "Ignore plates, cutlery, cups, napkins, and background objects.",
].join(" ");

type AnalyzePhotoResult = {
  entryMethod: "photo_scan";
  items: ScanDraftItem[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
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
  niacinPer100g: number;
  phosphorusPer100g: number;
  potassiumPer100g: number;
  proteinPer100g: number;
  riboflavinPer100g: number;
  sodiumPer100g: number;
  sugarPer100g: number;
  thiaminPer100g: number;
  vitaminAPer100g: number;
  vitaminCPer100g: number;
  vitaminDPer100g: number;
  vitaminEPer100g: number;
  vitaminKPer100g: number;
  zincPer100g: number;
};

async function buildScanDraft(
  ctx: any,
  args: {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
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

  const response = await client.responses.create({
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

  const outputText = response.output_text?.trim();

  if (!outputText) {
    throw new Error("OpenAI scan response did not include structured output.");
  }

  const parsed = JSON.parse(outputText) as {
    items?: ParsedScanItem[];
    overallConfidence?: unknown;
  };

  const normalizedItems: ScanDraftItem[] = buildNormalizedScanDraftItems(
    (parsed.items ?? []).map((item) => ({
      ...item,
      prepMethod: item.prepMethod ?? undefined,
    }))
  );

  if (!normalizedItems.length) {
    throw new Error("No usable food items were detected from this meal photo.");
  }

  const matchedItems: ScanDraftItem[] = await Promise.all(
    normalizedItems.map(async (item) => {
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

  return {
    entryMethod: "photo_scan",
    items: matchedItems,
    mealType: args.mealType,
    overallConfidence: normalizeScanConfidence(parsed.overallConfidence),
    photoStorageId: args.storageId,
  };
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

    return buildScanDraft(ctx, {
      mealType: args.mealType,
      storageId,
    });
  },
});
