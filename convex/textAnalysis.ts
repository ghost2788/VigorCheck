"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
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
} from "../lib/domain/scan";
import { MealType, resolveDraftMealType } from "../lib/domain/meals";
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
  manganesePer100g?: number;
  name: string;
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

const textPrompt = [
  "Parse this meal description into separate food or drink items.",
  "Keep obvious assembled foods like sandwiches, burgers, wraps, tacos, and toast with toppings as a single item instead of splitting the carrier from the filling.",
  "Do not collapse everything into a single plate if multiple distinct items are named.",
  "Estimate edible weight in grams for each item.",
  "Use whole numbers for calories and grams. Use decimals when needed for micronutrients such as omega-3, copper, or manganese.",
  "Estimate omega-3, choline, selenium, copper, and manganese when possible.",
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
    mealType: MealType;
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

    const normalizedComponents = buildNormalizedScanDraftComponents(
      (parsed.items ?? []).map((item) => ({
        ...item,
        prepMethod: item.prepMethod ?? undefined,
      }))
    );

    if (!normalizedComponents.length) {
      throw new Error("No usable food items were detected from that description.");
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

    return {
      entryMethod: "ai_text",
      items: matchedItems,
      mealType: resolveDraftMealType({
        itemNames: matchedItems.map((item) => item.name),
        seedMealType: args.mealType,
        source: "text",
      }),
      overallConfidence: normalizeScanConfidence(parsed.overallConfidence),
    };
  },
});
