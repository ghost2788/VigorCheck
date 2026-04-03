import {
  buildGroupedNutrientDetails,
  createEmptyDetailedNutrientTotals,
  sumDetailedNutrients,
} from "../../lib/domain/nutrients";

describe("nutrient detail helpers", () => {
  it("sums the full detailed nutrient set across meals", () => {
    const totals = sumDetailedNutrients([
      {
        nutrients: {
          ...createEmptyDetailedNutrientTotals(),
          fiber: 8,
          potassium: 420,
          vitaminC: 24,
        },
      },
      {
        nutrients: {
          ...createEmptyDetailedNutrientTotals(),
          fiber: 5,
          potassium: 280,
          vitaminC: 16,
          zinc: 3,
        },
      },
    ]);

    expect(totals.fiber).toBe(13);
    expect(totals.potassium).toBe(700);
    expect(totals.vitaminC).toBe(40);
    expect(totals.zinc).toBe(3);
  });

  it("returns grouped vitamin and mineral detail blocks", () => {
    const groups = buildGroupedNutrientDetails({
      ...createEmptyDetailedNutrientTotals(),
      calcium: 640,
      vitaminD: 12,
    });

    expect(groups).toHaveLength(2);
    expect(groups[0].title).toBe("Vitamins");
    expect(groups[1].title).toBe("Minerals & other");
    expect(groups[0].nutrients.find((entry) => entry.key === "vitaminD")?.value).toBe(12);
    expect(groups[1].nutrients.find((entry) => entry.key === "calcium")?.value).toBe(640);
  });
});
