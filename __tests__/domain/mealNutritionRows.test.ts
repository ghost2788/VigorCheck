import { buildMealNutritionRows } from "../../lib/domain/mealNutritionRows";
import { buildExpandedNutrientProgressRows } from "../../lib/domain/nutrientProgress";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";
import { createEmptyNutrition } from "../../lib/domain/scan";

describe("buildMealNutritionRows", () => {
  it("marks macro rows with macro provenance and goal semantics", () => {
    const rows = buildMealNutritionRows({
      detailedNutritionTargets: null,
      macroTargets: {
        calories: 2000,
        carbs: 250,
        fat: 70,
        protein: 100,
      },
      nutrients: createEmptyNutrition(),
      totals: {
        calories: 2200,
        carbs: 0,
        fat: 35,
        protein: 100,
      },
    });

    expect(rows).toEqual([
      expect.objectContaining({
        goalKind: "soft_maximum",
        key: "calories",
        percent: 110,
        progressRatio: 1.1,
        rowKind: "macro",
      }),
      expect.objectContaining({
        goalKind: "goal",
        key: "protein",
        percent: 100,
        progressRatio: 1,
        rowKind: "macro",
      }),
      expect.objectContaining({
        goalKind: "goal",
        key: "fat",
        percent: 50,
        progressRatio: 0.5,
        rowKind: "macro",
      }),
    ]);
  });

  it("marks detailed rows with nutrient provenance and target semantics", () => {
    const targets = getDetailedNutrientTargets({
      age: 31,
      sex: "male",
      targetFiber: 30,
    });

    const rows = buildMealNutritionRows({
      detailedNutritionTargets: targets,
      macroTargets: null,
      nutrients: {
        ...createEmptyNutrition(),
        sodium: 460,
        vitaminC: 45,
      },
      totals: {
        calories: 0,
        carbs: 0,
        fat: 0,
        protein: 0,
      },
    });

    expect(rows).toEqual([
      expect.objectContaining({
        goalKind: "goal",
        key: "vitaminC",
        progressRatio: 0.5,
        rowKind: "nutrient",
      }),
      expect.objectContaining({
        goalKind: "maximum",
        key: "sodium",
        progressRatio: 0.2,
        rowKind: "nutrient",
      }),
    ]);
  });
});

describe("buildExpandedNutrientProgressRows", () => {
  it("zeros progressRatio for missing or invalid nutrient targets", () => {
    const rows = buildExpandedNutrientProgressRows({
      detailGroups: [
        {
          id: "minerals",
          nutrients: [
            {
              key: "sodium",
              label: "Sodium",
              percent: 0,
              target: 0,
              targetKind: "maximum",
              unit: "mg",
              value: 400,
            },
          ],
          title: "Minerals",
        },
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        goalKind: "maximum",
        key: "sodium",
        percent: 0,
        progressRatio: 0,
        rowKind: "nutrient",
      }),
    ]);
  });
});
