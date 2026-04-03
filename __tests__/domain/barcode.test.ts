import { createEmptyNutrition } from "../../lib/domain/scan";
import {
  buildBarcodeDraftFromOpenFoodFactsProduct,
  isSupportedBarcodeType,
} from "../../lib/domain/barcode";

describe("barcode domain helpers", () => {
  it("accepts only packaged-food barcode formats", () => {
    expect(isSupportedBarcodeType("ean13")).toBe(true);
    expect(isSupportedBarcodeType("upc_a")).toBe(true);
    expect(isSupportedBarcodeType("qr")).toBe(false);
    expect(isSupportedBarcodeType("code128")).toBe(false);
  });

  it("normalizes a labeled serving into a barcode review draft", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "012345678905",
      product: {
        brands: "Example Foods",
        nutriments: {
          "calcium_serving": 150,
          "calcium_unit": "mg",
          "carbohydrates_serving": 23,
          "carbohydrates_unit": "g",
          "energy-kcal_serving": 210,
          "fat_serving": 7,
          "fat_unit": "g",
          "fiber_serving": 3,
          "fiber_unit": "g",
          "iron_serving": 2.5,
          "iron_unit": "mg",
          "potassium_serving": 180,
          "potassium_unit": "mg",
          "proteins_serving": 20,
          "proteins_unit": "g",
          "sodium_serving": 0.23,
          "sodium_unit": "g",
          "vitamin-c_serving": 12,
          "vitamin-c_unit": "mg",
          "vitamin-d_serving": 2,
          "vitamin-d_unit": "ug",
        },
        product_name: "Crunch Protein Bar",
        quantity: "60 g",
        serving_quantity: 60,
        serving_size: "1 bar (60 g)",
      },
    });

    expect(draft).toEqual(
      expect.objectContaining({
        barcodeValue: "012345678905",
        confidence: "high",
        estimatedGrams: 60,
        name: "Crunch Protein Bar",
        portionLabel: "1 serving from label (1 bar (60 g))",
        source: "barcode_catalog",
      })
    );
    expect(draft?.nutrition).toEqual(
      expect.objectContaining({
        calcium: 150,
        calories: 210,
        carbs: 23,
        fat: 7,
        fiber: 3,
        iron: 3,
        potassium: 180,
        protein: 20,
        sodium: 230,
        vitaminC: 12,
        vitaminD: 2,
      })
    );
  });

  it("falls back to a package amount when no serving size is available", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "098765432109",
      product: {
        nutriments: {
          "carbohydrates_100g": 30,
          "carbohydrates_unit": "g",
          "energy-kcal_100g": 250,
          "fat_100g": 10,
          "fat_unit": "g",
          "proteins_100g": 8,
          "proteins_unit": "g",
        },
        product_name: "Granola Clusters",
        quantity: "45 g",
      },
    });

    expect(draft).toEqual(
      expect.objectContaining({
        estimatedGrams: 45,
        portionLabel: "1 package fallback (45 g)",
      })
    );
    expect(draft?.nutrition).toEqual(
      expect.objectContaining({
        calories: 113,
        carbs: 14,
        fat: 5,
        protein: 4,
      })
    );
  });

  it("falls back to 100 g when provider serving data is missing", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "111111111111",
      product: {
        nutriments: {
          "carbohydrates_100g": 48,
          "energy-kcal_100g": 370,
          "fat_100g": 4,
          "proteins_100g": 9,
        },
        product_name: "Toasted Oats",
      },
    });

    expect(draft).toEqual(
      expect.objectContaining({
        estimatedGrams: 100,
        portionLabel: "100 g fallback serving",
      })
    );
    expect(draft?.nutrition).toEqual(
      expect.objectContaining({
        calories: 370,
        carbs: 48,
        fat: 4,
        protein: 9,
      })
    );
  });

  it("rejects incomplete provider data before review", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "222222222222",
      product: {
        nutriments: {
          "fiber_serving": 2,
          "fiber_unit": "g",
          "vitamin-c_serving": 5,
          "vitamin-c_unit": "mg",
        },
        product_name: "Mystery Snack",
        serving_quantity: 28,
        serving_size: "28 g",
      },
    });

    expect(draft).toBeNull();
  });

  it("uses an empty nutrition object as the baseline shape", () => {
    expect(createEmptyNutrition()).toEqual(
      expect.objectContaining({
        calories: 0,
        carbs: 0,
        fat: 0,
        protein: 0,
      })
    );
  });
});
