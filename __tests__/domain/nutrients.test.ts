import {
  buildGroupedNutrientDetails,
  buildNutrientInsights,
  buildTopNutrientSources,
  createEmptyDetailedNutrientTotals,
  getDetailedNutrientTargets,
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

  it("returns grouped vitamin, mineral, and other nutrient blocks with coverage metadata", () => {
    const targets = getDetailedNutrientTargets({
      age: 34,
      sex: "male",
      targetFiber: 30,
    });
    const groups = buildGroupedNutrientDetails({
      targets,
      totals: {
        ...createEmptyDetailedNutrientTotals(),
        calcium: 640,
        choline: 275,
        omega3: 0.8,
        selenium: 44,
        vitaminD: 12,
      },
    });

    expect(groups).toHaveLength(3);
    expect(groups[0].title).toBe("Vitamins");
    expect(groups[1].title).toBe("Minerals");
    expect(groups[2].title).toBe("Other nutrients");
    expect(groups[0].nutrients.find((entry) => entry.key === "vitaminD")).toEqual(
      expect.objectContaining({
        percent: 80,
        target: 15,
        targetKind: "minimum",
        value: 12,
      })
    );
    expect(groups[1].nutrients.find((entry) => entry.key === "calcium")).toEqual(
      expect.objectContaining({
        percent: 64,
        target: 1000,
        targetKind: "minimum",
        value: 640,
      })
    );
    expect(groups[1].nutrients.find((entry) => entry.key === "selenium")).toEqual(
      expect.objectContaining({
        percent: 80,
        target: 55,
        value: 44,
      })
    );
    expect(groups[2].nutrients.find((entry) => entry.key === "omega3")).toEqual(
      expect.objectContaining({
        percent: 50,
        target: 1.6,
        unit: "g",
        value: 0.8,
      })
    );
    expect(groups[2].nutrients.find((entry) => entry.key === "choline")).toEqual(
      expect.objectContaining({
        percent: 50,
        target: 550,
        unit: "mg",
        value: 275,
      })
    );
  });

  it("builds top wins and biggest gaps from minimum-style nutrient targets", () => {
    const targets = getDetailedNutrientTargets({
      age: 34,
      sex: "female",
      targetFiber: 28,
    });

    const insights = buildNutrientInsights({
      targets,
      totals: {
        ...createEmptyDetailedNutrientTotals(),
        choline: 90,
        copper: 0.7,
        fiber: 26,
        omega3: 0.4,
        selenium: 65,
        sodium: 1900,
        sugar: 30,
        vitaminC: 98,
      },
    });

    expect(insights.topWins.map((entry) => entry.key)).toEqual(["vitaminC", "selenium"]);
    expect(insights.biggestGaps.map((entry) => entry.key)).toEqual(["choline", "omega3"]);
    expect(insights.biggestGaps[0]).toEqual(
      expect.objectContaining({
        key: "choline",
        percent: 21,
      })
    );
  });

  it("builds positive nutrient source tags from minimum nutrients above the 10 percent cutoff", () => {
    const targets = getDetailedNutrientTargets({
      age: 34,
      sex: "male",
      targetFiber: 30,
    });

    const topSources = buildTopNutrientSources({
      targets,
      totals: {
        ...createEmptyDetailedNutrientTotals(),
        calcium: 100,
        choline: 54,
        fiber: 2.9,
        sodium: 1800,
        sugar: 18,
        vitaminC: 20,
      },
    });

    expect(topSources).toEqual([
      {
        key: "vitaminC",
        label: "Vitamin C",
        unit: "mg",
        value: 20,
      },
      {
        key: "calcium",
        label: "Calcium",
        unit: "mg",
        value: 100,
      },
    ]);
  });

  it("breaks equal-ratio ties by raw value and then alphabetically", () => {
    const targets = getDetailedNutrientTargets({
      age: 34,
      sex: "male",
      targetFiber: 30,
    });

    const topSources = buildTopNutrientSources({
      targets,
      totals: {
        ...createEmptyDetailedNutrientTotals(),
        copper: 0.09,
        vitaminD: 1.5,
        vitaminE: 1.5,
      },
    });

    expect(topSources).toEqual([
      {
        key: "vitaminD",
        label: "Vitamin D",
        unit: "mcg",
        value: 1.5,
      },
      {
        key: "vitaminE",
        label: "Vitamin E",
        unit: "mg",
        value: 1.5,
      },
    ]);
  });
});
