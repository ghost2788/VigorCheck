"use node";

import { Buffer } from "node:buffer";
import OpenAI from "openai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, ActionCtx } from "./_generated/server";
import {
  normalizeSupplementActiveIngredients,
  SupplementActiveIngredient,
  supplementNutritionFieldKeys,
  SupplementReviewDraft,
} from "../lib/domain/supplements";
import { buildAiObservabilityRecordArgs, recordAiRequestSafely } from "./lib/aiObservability";

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
      required: [...supplementNutritionFieldKeys],
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
    activeIngredients: normalizeSupplementActiveIngredients(draft.activeIngredients),
    brand: draft.brand?.trim() || undefined,
    displayName: draft.displayName?.trim() || "Supplement",
    frequency: draft.frequency ?? "daily",
    nutritionProfile,
    overallConfidence: draft.overallConfidence ?? "medium",
    servingLabel: draft.servingLabel?.trim() || "1 serving",
    servingsPerContainer: draft.servingsPerContainer?.trim() || undefined,
  };
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
          callKind: "supplement_scan",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "photo_scan",
          model: SUPPLEMENT_SCAN_MODEL,
          resultStatus: "blocked_quota",
          usageState: "not_applicable",
        })
      );
      throw new Error(precheckResult.message ?? "Supplement scans are unavailable right now.");
    }

    let frontPhotoStorageId: Id<"_storage">;

    try {
      const frontBytes = Buffer.from(args.frontPhotoBase64, "base64");
      const frontBlob = new Blob([frontBytes], {
        type: args.frontPhotoMimeType || "image/jpeg",
      });
      frontPhotoStorageId = await ctx.storage.store(frontBlob);
    } catch {
      throw new Error("The selected front-label photo could not be prepared for analysis.");
    }

    let factsPhotoStorageId: Id<"_storage"> | null = null;

    if (args.factsPhotoBase64) {
      try {
        const factsBytes = Buffer.from(args.factsPhotoBase64, "base64");
        const factsBlob = new Blob([factsBytes], {
          type: args.factsPhotoMimeType || "image/jpeg",
        });
        factsPhotoStorageId = await ctx.storage.store(factsBlob);
      } catch {
        throw new Error("The selected supplement-facts photo could not be prepared for analysis.");
      }
    }

    const reserveResult = await ctx.runMutation(internal.aiUsage.reserve, {
      featureKind: "photo_scan",
    });

    if (!reserveResult.allowed) {
      await recordAiRequestSafely(
        ctx,
        buildAiObservabilityRecordArgs({
          blockedLimitKind: reserveResult.blockingLimitKind,
          callKind: "supplement_scan",
          completedAt: Date.now(),
          createdAt: requestStartedAt,
          featureKind: "photo_scan",
          model: SUPPLEMENT_SCAN_MODEL,
          resultStatus: "blocked_quota",
          usageState: "not_applicable",
        })
      );
      throw new Error(reserveResult.message ?? "Supplement scans are unavailable right now.");
    }

    return buildSupplementScanDraft({
      ctx,
      factsPhotoStorageId,
      frontPhotoStorageId,
      requestStartedAt,
    });
  },
});
