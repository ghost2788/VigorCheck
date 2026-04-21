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
          "choline_serving": 80,
          "choline_unit": "mg",
          "copper_serving": 0.2,
          "copper_unit": "mg",
          "energy-kcal_serving": 210,
          "fat_serving": 7,
          "fat_unit": "g",
          "fiber_serving": 3,
          "fiber_unit": "g",
          "iron_serving": 2.5,
          "iron_unit": "mg",
          "manganese_serving": 0.6,
          "manganese_unit": "mg",
          "omega-3-fat_serving": 0.5,
          "omega-3-fat_unit": "g",
          "potassium_serving": 180,
          "potassium_unit": "mg",
          "proteins_serving": 20,
          "proteins_unit": "g",
          "selenium_serving": 22,
          "selenium_unit": "ug",
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
        portionUnit: "g",
        portionLabel: "1 serving from label (1 bar (60 g))",
        source: "barcode_catalog",
      })
    );
    expect(draft?.nutrition).toEqual(
      expect.objectContaining({
        calcium: 150,
        calories: 210,
        carbs: 23,
        choline: 80,
        copper: 0.2,
        fat: 7,
        fiber: 3,
        iron: 3,
        manganese: 0.6,
        omega3: 0.5,
        potassium: 180,
        protein: 20,
        selenium: 22,
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
        portionUnit: "g",
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
        portionUnit: "g",
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
        choline: 0,
        copper: 0,
        fat: 0,
        manganese: 0,
        omega3: 0,
        protein: 0,
        selenium: 0,
      })
    );
  });

  it("parses Red Bull-style 100ml vitamin fields and keeps ml servings", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "9002490100070",
      product: {
        nutriments: {
          "carbohydrates_100ml": 11,
          "carbohydrates_unit": "g",
          "energy-kcal_100ml": 45,
          "niacin_100ml": 3.2,
          "niacin_unit": "mg",
          "sodium_100ml": 0.04,
          "sodium_unit": "g",
          "sugars_100ml": 11,
          "sugars_unit": "g",
          "vitamin-b12_100ml": 0.8,
          "vitamin-b12_unit": "ug",
          "vitamin-b6_100ml": 0.8,
          "vitamin-b6_unit": "mg",
        },
        product_name: "Red Bull Energy Drink",
        quantity: "250 ml",
        serving_quantity: 250,
        serving_size: "1 can (250 ml)",
      },
    });

    expect(draft).toEqual(
      expect.objectContaining({
        estimatedGrams: 250,
        name: "Red Bull Energy Drink",
        portionLabel: "1 serving from label (1 can (250 ml))",
        portionUnit: "ml",
      })
    );
    expect(draft?.nutrition).toEqual(
      expect.objectContaining({
        b12: 2,
        b6: 2,
        calories: 113,
        carbs: 28,
        niacin: 8,
        sodium: 100,
        sugar: 28,
      })
    );
  });

  it("maps vitamin-b3 into niacin for barcode products", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "9002490100071",
      product: {
        nutriments: {
          "carbohydrates_100ml": 10,
          "carbohydrates_unit": "g",
          "energy-kcal_100ml": 42,
          "vitamin-b3_100ml": 4,
          "vitamin-b3_unit": "mg",
        },
        product_name: "Energy Drink Variant",
        quantity: "250 ml",
      },
    });

    expect(draft?.portionUnit).toBe("ml");
    expect(draft?.nutrition.niacin).toBe(10);
  });

  it("converts vitamin-pp grams into niacin milligrams for sugarfree drinks", () => {
    const draft = buildBarcodeDraftFromOpenFoodFactsProduct({
      code: "9002490215415",
      product: {
        nutriments: {
          "energy-kcal_serving": 7.5,
          "energy-kcal_unit": "kcal",
          "proteins_serving": 0,
          "proteins_unit": "g",
          "fat_serving": 0,
          "fat_unit": "g",
          "carbohydrates_serving": 0,
          "carbohydrates_unit": "g",
          "sodium_serving": 0.1,
          "sodium_unit": "g",
          "sugars_serving": 0,
          "sugars_unit": "g",
          "vitamin-pp_serving": 0.02,
          "vitamin-pp_unit": "g",
        },
        product_name: "Red Bull Sugarfree 250 ml",
        quantity: "250 ml",
        serving_quantity: 250,
        serving_size: "250 ml",
      },
    });

    expect(draft?.nutrition.niacin).toBe(20);
    expect(draft?.nutrition.sodium).toBe(100);
  });
});
