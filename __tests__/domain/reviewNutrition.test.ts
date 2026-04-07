import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";
import { buildReviewMacroRows, buildReviewNutrientRows } from "../../lib/domain/reviewNutrition";
import { createEmptyNutrition } from "../../lib/domain/scan";

const detailedTargets = getDetailedNutrientTargets({
  age: 31,
  sex: "male",
  targetFiber: 30,
});

describe("buildReviewNutrientRows", () => {
  it("keeps sodium and micronutrients while hiding macro-grid duplicates", () => {
    const result = buildReviewNutrientRows({
      nutrition: {
        ...createEmptyNutrition(),
        calories: 160,
        carbs: 18,
        fiber: 7,
        protein: 12,
        sodium: 420,
        vitaminC: 60,
      },
      targets: detailedTargets,
    });

    expect(result.map((row) => row.key)).toEqual(["vitaminC", "sodium"]);
  });

  it("returns no rows when only hidden macro nutrients are available", () => {
    const result = buildReviewNutrientRows({
      nutrition: {
        ...createEmptyNutrition(),
        calories: 140,
        carbs: 24,
        fat: 2,
        protein: 8,
      },
      targets: detailedTargets,
    });

    expect(result).toEqual([]);
  });
});

describe("buildReviewMacroRows", () => {
  it("builds ordered macro rows with rounded percentages and hidden zero values", () => {
    const result = buildReviewMacroRows({
      nutrition: {
        ...createEmptyNutrition(),
        calories: 250,
        carbs: 0,
        fat: 12,
        protein: 20,
      },
      targets: {
        calories: 200,
        carbs: 250,
        fat: 60,
        protein: 80,
      },
    });

    expect(result).toEqual([
      {
        amountLabel: "250 kcal",
        barPercent: 100,
        key: "calories",
        label: "Calories",
        percent: 125,
      },
      {
        amountLabel: "20 g",
        barPercent: 25,
        key: "protein",
        label: "Protein",
        percent: 25,
      },
      {
        amountLabel: "12 g",
        barPercent: 20,
        key: "fat",
        label: "Fat",
        percent: 20,
      },
    ]);
  });

  it("returns zero-safe percentages when targets are missing or zero", () => {
    const result = buildReviewMacroRows({
      nutrition: {
        ...createEmptyNutrition(),
        calories: 140,
        carbs: 28,
      },
      targets: {
        calories: 0,
        carbs: 0,
        fat: 60,
        protein: 80,
      },
    });

    expect(result).toEqual([
      {
        amountLabel: "140 kcal",
        barPercent: 0,
        key: "calories",
        label: "Calories",
        percent: 0,
      },
      {
        amountLabel: "28 g",
        barPercent: 0,
        key: "carbs",
        label: "Carbs",
        percent: 0,
      },
    ]);
  });
});
