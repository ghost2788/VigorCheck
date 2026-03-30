import {
  buildNormalizedScanDraftItems,
  createAiEstimatedDraftItem,
  createUsdaDraftItem,
  findBestUsdaMatch,
  scaleDraftItem,
} from "../../lib/domain/scan";

describe("scan domain helpers", () => {
  it("drops invalid items and merges duplicate normalized names", () => {
    const items = buildNormalizedScanDraftItems([
      {
        confidence: "medium",
        estimatedGrams: 150,
        name: "Grilled Chicken Breast",
        nutrition: {
          b12: 0.2,
          b6: 0.6,
          calcium: 12,
          calories: 248,
          carbs: 0,
          fat: 5.4,
          fiber: 0,
          folate: 4,
          iron: 1,
          magnesium: 32,
          niacin: 12,
          phosphorus: 210,
          potassium: 256,
          protein: 46,
          riboflavin: 0.1,
          sodium: 104,
          sugar: 0,
          thiamin: 0.1,
          vitaminA: 14,
          vitaminC: 0,
          vitaminD: 0.1,
          vitaminE: 0.3,
          vitaminK: 0.5,
          zinc: 1,
        },
        portionLabel: "1 grilled breast",
        prepMethod: "grilled",
      },
      {
        confidence: "high",
        estimatedGrams: 55,
        name: " grilled chicken breast ",
        nutrition: {
          b12: 0.1,
          b6: 0.2,
          calcium: 4,
          calories: 90,
          carbs: 0,
          fat: 2.1,
          fiber: 0,
          folate: 1,
          iron: 0.3,
          magnesium: 10,
          niacin: 4,
          phosphorus: 74,
          potassium: 91,
          protein: 17,
          riboflavin: 0.05,
          sodium: 36,
          sugar: 0,
          thiamin: 0.03,
          vitaminA: 5,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0.1,
          vitaminK: 0.2,
          zinc: 0.4,
        },
        portionLabel: "extra slices",
        prepMethod: "grilled",
      },
      {
        confidence: "low",
        estimatedGrams: 0,
        name: "Mystery sauce",
        nutrition: {
          b12: 0,
          b6: 0,
          calcium: 0,
          calories: 40,
          carbs: 8,
          fat: 0,
          fiber: 0,
          folate: 0,
          iron: 0,
          magnesium: 0,
          niacin: 0,
          phosphorus: 0,
          potassium: 0,
          protein: 0,
          riboflavin: 0,
          sodium: 180,
          sugar: 6,
          thiamin: 0,
          vitaminA: 0,
          vitaminC: 0,
          vitaminD: 0,
          vitaminE: 0,
          vitaminK: 0,
          zinc: 0,
        },
        portionLabel: "a drizzle",
        prepMethod: undefined,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        confidence: "high",
        estimatedGrams: 205,
        name: "Grilled Chicken Breast",
        prepMethod: "grilled",
        source: "ai_estimated",
      })
    );
    expect(items[0].nutrition).toEqual(
      expect.objectContaining({
        calories: 338,
        fat: 7,
        protein: 63,
      })
    );
  });

  it("chooses a strong USDA match but rejects weak ones", () => {
    const candidates = [
      {
        caloriesPer100g: 165,
        category: "protein",
        fdcId: "1001",
        name: "Chicken, broilers or fryers, breast, meat only, cooked, grilled",
      },
      {
        caloriesPer100g: 237,
        category: "protein",
        fdcId: "1002",
        name: "Chicken, broilers or fryers, breast, meat only, fried",
      },
      {
        caloriesPer100g: 130,
        category: "grains",
        fdcId: "1003",
        name: "Rice, white, cooked",
      },
    ];

    expect(findBestUsdaMatch("grilled chicken breast", candidates)?.fdcId).toBe("1001");
    expect(findBestUsdaMatch("orange chicken", candidates)).toBeNull();
  });

  it("recalculates USDA and AI-estimated items from the multiplier", () => {
    const usdaItem = createUsdaDraftItem({
      confidence: "high",
      estimatedGrams: 120,
      name: "White rice",
      nutrition: {
        b12: 0,
        b6: 0.1,
        calcium: 10,
        calories: 156,
        carbs: 33.6,
        fat: 0.4,
        fiber: 0.5,
        folate: 58,
        iron: 0.2,
        magnesium: 14,
        niacin: 1.7,
        phosphorus: 52,
        potassium: 42,
        protein: 3.2,
        riboflavin: 0.02,
        sodium: 2,
        sugar: 0.1,
        thiamin: 0.02,
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0,
        vitaminE: 0,
        vitaminK: 0,
        zinc: 0.6,
      },
      per100g: {
        b12: 0,
        b6: 0.08,
        calcium: 8,
        calories: 130,
        carbs: 28,
        fat: 0.3,
        fiber: 0.4,
        folate: 48,
        iron: 0.17,
        magnesium: 12,
        niacin: 1.4,
        phosphorus: 43,
        potassium: 35,
        protein: 2.7,
        riboflavin: 0.02,
        sodium: 1.6,
        sugar: 0.08,
        thiamin: 0.02,
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0,
        vitaminE: 0,
        vitaminK: 0,
        zinc: 0.5,
      },
      portionLabel: "1 bowl",
      usdaFoodId: "1003",
    });
    const aiItem = createAiEstimatedDraftItem({
      confidence: "medium",
      estimatedGrams: 180,
      name: "Chicken bowl",
      nutrition: {
        b12: 0.2,
        b6: 0.4,
        calcium: 40,
        calories: 620,
        carbs: 58,
        fat: 18,
        fiber: 6,
        folate: 90,
        iron: 3,
        magnesium: 60,
        niacin: 8,
        phosphorus: 200,
        potassium: 520,
        protein: 42,
        riboflavin: 0.2,
        sodium: 780,
        sugar: 5,
        thiamin: 0.15,
        vitaminA: 80,
        vitaminC: 12,
        vitaminD: 0,
        vitaminE: 0.8,
        vitaminK: 8,
        zinc: 2.2,
      },
      portionLabel: "1 entree",
      prepMethod: "mixed",
    });

    const scaledUsda = scaleDraftItem(usdaItem, 1.5);
    const scaledAi = scaleDraftItem(aiItem, 0.5);

    expect(scaledUsda.estimatedGrams).toBe(180);
    expect(scaledUsda.nutrition).toEqual(
      expect.objectContaining({
        calories: 234,
        carbs: 50,
        protein: 5,
      })
    );

    expect(scaledAi.estimatedGrams).toBe(90);
    expect(scaledAi.nutrition).toEqual(
      expect.objectContaining({
        calories: 310,
        carbs: 29,
        protein: 21,
      })
    );
  });
});
