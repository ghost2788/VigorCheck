import {
  getWellnessWeights,
  getNutritionTargets,
  ouncesToCups,
  rankMealNutritionContribution,
  scoreCaloriesTargetCloseness,
  scoreWeightedWellness,
} from "../../lib/domain/wellness";

describe("wellness helpers", () => {
  it("keeps calories at 100 within the tolerance band and declines outside it", () => {
    expect(scoreCaloriesTargetCloseness(1800, 2000)).toBe(100);
    expect(scoreCaloriesTargetCloseness(1000, 2000)).toBe(0);
    expect(scoreCaloriesTargetCloseness(2800, 2000)).toBe(25);
    expect(scoreCaloriesTargetCloseness(3000, 2000)).toBe(0);
    expect(scoreCaloriesTargetCloseness(1300, 2000)).toBe(38);
  });

  it("converts ounces to cups in eight-ounce increments", () => {
    expect(ouncesToCups(0)).toBe(0);
    expect(ouncesToCups(8)).toBe(1);
    expect(ouncesToCups(20)).toBe(2.5);
  });

  it("resolves profile-based nutrient targets with the under-19 fallback", () => {
    expect(
      getNutritionTargets({
        age: 17,
        sex: "female",
        targetFiber: 28,
      })
    ).toEqual({
      calcium: 1000,
      fiber: 28,
      iron: 18,
      potassium: 2600,
      vitaminC: 75,
      vitaminD: 15,
    });

    expect(
      getNutritionTargets({
        age: 74,
        sex: "male",
        targetFiber: 30,
      })
    ).toEqual({
      calcium: 1200,
      fiber: 30,
      iron: 8,
      potassium: 3400,
      vitaminC: 90,
      vitaminD: 20,
    });
  });

  it("ranks meals by summed fractional nutrient contribution", () => {
    const ranking = rankMealNutritionContribution({
      meal: {
        calcium: 150,
        fiber: 5,
        iron: 2,
        potassium: 600,
        vitaminC: 20,
        vitaminD: 1,
      },
      targets: {
        calcium: 1000,
        fiber: 25,
        iron: 8,
        potassium: 3400,
        vitaminC: 90,
        vitaminD: 15,
      },
    });

    expect(ranking).toBeCloseTo(1.07, 2);
  });

  it("returns the exact goal-aware wellness weights and weighted composite score", () => {
    expect(getWellnessWeights("general_health")).toEqual({
      calories: 0.18,
      carbs: 0.14,
      fat: 0.12,
      hydration: 0.18,
      nutrition: 0.22,
      protein: 0.16,
    });
    expect(getWellnessWeights("fat_loss")).toEqual({
      calories: 0.3,
      carbs: 0.18,
      fat: 0.12,
      hydration: 0.1,
      nutrition: 0.1,
      protein: 0.2,
    });
    expect(getWellnessWeights("muscle_gain")).toEqual({
      calories: 0.25,
      carbs: 0.2,
      fat: 0.12,
      hydration: 0.1,
      nutrition: 0.1,
      protein: 0.23,
    });
    expect(getWellnessWeights("energy_balance")).toEqual({
      calories: 0.24,
      carbs: 0.17,
      fat: 0.16,
      hydration: 0.13,
      nutrition: 0.12,
      protein: 0.18,
    });

    const scores = {
      calories: 100,
      protein: 80,
      carbs: 70,
      fat: 60,
      hydration: 50,
      nutrition: 50,
    } as const;

    expect(scoreWeightedWellness("general_health", scores)).toBe(68);
    expect(scoreWeightedWellness("fat_loss", scores)).toBe(76);
    expect(scoreWeightedWellness("muscle_gain", scores)).toBe(75);
    expect(scoreWeightedWellness("energy_balance", scores)).toBe(72);
  });
});
