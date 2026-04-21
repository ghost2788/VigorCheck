import { v } from "convex/values";
import { action } from "./_generated/server";
import { buildBarcodeDraftFromOpenFoodFactsProduct } from "../lib/domain/barcode";
import { resolveDraftMealType } from "../lib/domain/meals";
import { mealTypeValidator } from "./lib/validators";

export const lookupProduct = action({
  args: {
    code: v.string(),
    mealType: mealTypeValidator,
  },
  handler: async (_ctx, args) => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(args.code)}.json?fields=code,product_name,brands,categories,categories_tags,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,nutriments`
    );

    if (response.status === 404) {
      return {
        code: args.code,
        kind: "fallback" as const,
        message: "This barcode could not be matched to a complete product.",
      };
    }

    if (response.status === 429) {
      throw new Error("Barcode lookup is busy right now. Please try again in a moment.");
    }

    if (!response.ok) {
      throw new Error("This barcode lookup could not finish right now.");
    }

    const payload = (await response.json()) as {
      product?: {
        brands?: string;
        categories?: string;
        categories_tags?: string[];
        nutriments?: Record<string, number | string | undefined>;
        product_name?: string;
        product_quantity?: number;
        product_quantity_unit?: string;
        quantity?: string;
        serving_quantity?: number;
        serving_size?: string;
      };
      status?: number;
    };

    if (payload.status !== 1 || !payload.product) {
      return {
        code: args.code,
        kind: "fallback" as const,
        message: "This barcode could not be matched to a complete product.",
      };
    }

    const draftItem = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: args.code,
      product: payload.product,
    });

    if (!draftItem) {
      return {
        code: args.code,
        kind: "fallback" as const,
        message: "This barcode could not be matched to a complete product.",
      };
    }

    return {
      draft: {
        entryMethod: "barcode" as const,
        items: [draftItem],
        mealType: resolveDraftMealType({
          categoriesTags: payload.product.categories_tags,
          productName: payload.product.product_name,
          seedMealType: args.mealType,
          source: "barcode",
        }),
        overallConfidence: "high" as const,
      },
      kind: "success" as const,
    };
  },
});
