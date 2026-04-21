"use node";

import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  buildAiObservabilityRecordArgs,
  recordAiRequestSafely,
} from "./lib/aiObservability";
import { nutritionValidator, rememberedShortcutCategoryValidator } from "./lib/validators";

const OPENAI_DRINK_MODEL = "gpt-4.1";

const drinkEstimateSchema = {
  additionalProperties: false,
  properties: {
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
        "sodium",
        "sugar",
        "omega3",
        "choline",
        "selenium",
        "copper",
        "manganese",
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
  },
  required: ["nutrition"],
  type: "object",
} as const;

export const estimateNutrition = action({
  args: {
    category: rememberedShortcutCategoryValidator,
    name: v.string(),
    servingOz: v.number(),
  },
  returns: v.object({
    nutrition: nutritionValidator,
  }),
  handler: async (_, args) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured in Convex.");
    }

    const requestStartedAt = Date.now();
    const reserveResult = await _.runMutation(internal.aiUsage.reserve, {
      featureKind: "text_ai",
    });

    if (!reserveResult.allowed) {
      await recordAiRequestSafely(
        _,
        buildAiObservabilityRecordArgs({
          blockedLimitKind: reserveResult.blockingLimitKind,
          callKind: "drink_estimate",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "text_ai",
          model: OPENAI_DRINK_MODEL,
          resultStatus: "blocked_quota",
          usageState: "not_applicable",
        })
      );
      throw new Error(reserveResult.message ?? "AI drink estimates are unavailable right now.");
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
                text: [
                  "Estimate nutrition for a single packaged or prepared drink.",
                  "Return the nutrition for one serving only.",
                  "Use the provided serving ounces as the serving size.",
                  "If the drink likely has no meaningful micronutrients, return zeros for them.",
                  "Estimate omega-3, choline, selenium, copper, and manganese when possible.",
                  "Use decimals when needed for omega-3, copper, or manganese.",
                  `Drink: ${args.name}`,
                  `Category: ${args.category}`,
                  `Serving ounces: ${args.servingOz}`,
                ].join(" "),
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        model: OPENAI_DRINK_MODEL,
        text: {
          format: {
            name: "caltracker_drink_estimate",
            schema: drinkEstimateSchema,
            strict: true,
            type: "json_schema",
          },
        },
      });
    } catch (error) {
      await recordAiRequestSafely(
        _,
        buildAiObservabilityRecordArgs({
          callKind: "drink_estimate",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "text_ai",
          model: OPENAI_DRINK_MODEL,
          resultStatus: "provider_error",
          usageState: "not_applicable",
        })
      );
      throw error;
    }

    try {
      const outputText = response.output_text?.trim();

      if (!outputText) {
        throw new Error("OpenAI drink estimate did not include structured output.");
      }

      const parsed = JSON.parse(outputText) as { nutrition?: Record<string, number> };
      const nutrition = parsed.nutrition;

      if (!nutrition) {
        throw new Error("OpenAI drink estimate was missing nutrition data.");
      }

      const result = {
        nutrition: {
          b12: Math.max(0, Math.round(nutrition.b12 ?? 0)),
          b6: Math.max(0, Math.round(nutrition.b6 ?? 0)),
          calcium: Math.max(0, Math.round(nutrition.calcium ?? 0)),
          calories: Math.max(0, Math.round(nutrition.calories ?? 0)),
          carbs: Math.max(0, Math.round(nutrition.carbs ?? 0)),
          choline: Math.max(0, Math.round(nutrition.choline ?? 0)),
          copper: Math.max(0, Math.round((nutrition.copper ?? 0) * 10) / 10),
          fat: Math.max(0, Math.round(nutrition.fat ?? 0)),
          fiber: Math.max(0, Math.round(nutrition.fiber ?? 0)),
          folate: Math.max(0, Math.round(nutrition.folate ?? 0)),
          iron: Math.max(0, Math.round(nutrition.iron ?? 0)),
          magnesium: Math.max(0, Math.round(nutrition.magnesium ?? 0)),
          manganese: Math.max(0, Math.round((nutrition.manganese ?? 0) * 10) / 10),
          niacin: Math.max(0, Math.round(nutrition.niacin ?? 0)),
          omega3: Math.max(0, Math.round((nutrition.omega3 ?? 0) * 10) / 10),
          phosphorus: Math.max(0, Math.round(nutrition.phosphorus ?? 0)),
          potassium: Math.max(0, Math.round(nutrition.potassium ?? 0)),
          protein: Math.max(0, Math.round(nutrition.protein ?? 0)),
          riboflavin: Math.max(0, Math.round(nutrition.riboflavin ?? 0)),
          selenium: Math.max(0, Math.round(nutrition.selenium ?? 0)),
          sodium: Math.max(0, Math.round(nutrition.sodium ?? 0)),
          sugar: Math.max(0, Math.round(nutrition.sugar ?? 0)),
          thiamin: Math.max(0, Math.round(nutrition.thiamin ?? 0)),
          vitaminA: Math.max(0, Math.round(nutrition.vitaminA ?? 0)),
          vitaminC: Math.max(0, Math.round(nutrition.vitaminC ?? 0)),
          vitaminD: Math.max(0, Math.round(nutrition.vitaminD ?? 0)),
          vitaminE: Math.max(0, Math.round(nutrition.vitaminE ?? 0)),
          vitaminK: Math.max(0, Math.round(nutrition.vitaminK ?? 0)),
          zinc: Math.max(0, Math.round(nutrition.zinc ?? 0)),
        },
      };

      await recordAiRequestSafely(
        _,
        buildAiObservabilityRecordArgs({
          callKind: "drink_estimate",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "text_ai",
          model: OPENAI_DRINK_MODEL,
          resultStatus: "completed",
          usage: response.usage,
        })
      );

      return result;
    } catch (error) {
      await recordAiRequestSafely(
        _,
        buildAiObservabilityRecordArgs({
          callKind: "drink_estimate",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "text_ai",
          model: OPENAI_DRINK_MODEL,
          resultStatus: "postprocess_error",
          usage: response.usage,
        })
      );
      throw error;
    }
  },
});
