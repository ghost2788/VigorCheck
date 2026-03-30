"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  buildNormalizedScanDraftItems,
  findBestUsdaMatch,
  normalizeScanConfidence,
  nutritionFromUsdaPer100g,
  promoteDraftItemToUsda,
  ScanConfidence,
  ScanDraftItem,
} from "../lib/domain/scan";
import { mealTypeValidator } from "./lib/validators";

const OPENAI_TEXT_MODEL = "gpt-4.1-mini";

const textResponseSchema = {
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

type ParsedTextItem = {
  confidence: "high" | "medium" | "low";
  estimatedGrams: number;
  name: string;
  nutrition: Record<string, number>;
  portionLabel: string;
  prepMethod?: string | null;
};

type UsdaSearchCandidate = {
  b12Per100g: number;
  b6Per100g: number;
  calciumPer100g: number;
  caloriesPer100g: number;
  carbsPer100g: number;
  category: string;
  fatPer100g: number;
  fdcId: string;
  fiberPer100g: number;
  folatePer100g: number;
  ironPer100g: number;
  magnesiumPer100g: number;
  name: string;
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

const textPrompt = [
  "Parse this meal description into separate food or drink items.",
  "Do not collapse everything into a single plate if multiple items are named.",
  "Estimate edible weight in grams for each item.",
  "Use integers for grams and nutrition values.",
  "If a prep method is clearly implied, include it.",
  "Return your best estimate even when uncertain and lower confidence when needed.",
].join(" ");

export const analyzeMealDescription = action({
  args: {
    description: v.string(),
    mealType: mealTypeValidator,
  },
  handler: async (ctx, args): Promise<{
    entryMethod: "ai_text";
    items: ScanDraftItem[];
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    overallConfidence: ScanConfidence;
  }> => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in Convex.");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      input: [
        {
          content: [
            {
              text: `${textPrompt} Meal description: ${args.description}`,
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      model: OPENAI_TEXT_MODEL,
      text: {
        format: {
          name: "caltracker_text_meal",
          schema: textResponseSchema,
          strict: true,
          type: "json_schema",
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error("OpenAI text meal response did not include structured output.");
    }

    const parsed = JSON.parse(outputText) as {
      items?: ParsedTextItem[];
      overallConfidence?: unknown;
    };

    const normalizedItems = buildNormalizedScanDraftItems(
      (parsed.items ?? []).map((item) => ({
        ...item,
        prepMethod: item.prepMethod ?? undefined,
      }))
    );

    if (!normalizedItems.length) {
      throw new Error("No usable food items were detected from that description.");
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
      entryMethod: "ai_text",
      items: matchedItems,
      mealType: args.mealType,
      overallConfidence: normalizeScanConfidence(parsed.overallConfidence),
    };
  },
});
