import { buildEntryTimeline } from "../../lib/domain/entryTimeline";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";

describe("buildEntryTimeline", () => {
  const detailedNutritionTargets = getDetailedNutrientTargets({
    age: 30,
    sex: "male",
    targetFiber: 30,
  });
  const macroTargets = {
    calories: 2400,
    carbs: 300,
    fat: 80,
    protein: 150,
  };

  it("builds a reverse-chronological mixed timeline when hydration is included", () => {
    const timeline = buildEntryTimeline({
      detailedNutritionTargets,
      hydrationLogs: [
        {
          amountOz: 12,
          id: "hydration-1",
          rememberedHydrationLabel: "Electrolyte drink",
          timestamp: Date.parse("2026-04-06T08:00:00.000Z"),
        },
      ],
      includeHydration: true,
      macroTargets,
      mealItemsByMealId: new Map([
        [
          "meal-1",
          [
            { foodName: "Protein oats" },
            { foodName: "Blueberries" },
          ],
        ],
      ]),
      meals: [
        {
          entryMethod: "manual",
          id: "meal-1",
          mealType: "breakfast",
          nutrients: {
            fiber: 8,
            iron: 2,
            potassium: 420,
            vitaminC: 14,
          },
          timestamp: Date.parse("2026-04-06T09:00:00.000Z"),
          totals: {
            calories: 420,
            carbs: 58,
            fat: 11,
            protein: 24,
          },
        },
      ],
      supplementLogs: [
        {
          id: "supplement-1",
          label: "Iron",
          nutrients: {
            iron: 65,
          },
          servingLabel: "1 tablet",
          timestamp: Date.parse("2026-04-06T10:00:00.000Z"),
          totals: {
            calories: 0,
            carbs: 0,
            fat: 0,
            protein: 0,
          },
        },
      ],
    });

    expect(timeline.map((entry) => entry.kind)).toEqual(["supplement", "meal", "hydration"]);
    expect(timeline[0]).toEqual(
      expect.objectContaining({
        id: "supplement-1",
        kind: "supplement",
        label: "Iron",
      })
    );
    expect(timeline[2]).toEqual(
      expect.objectContaining({
        amountOz: 12,
        kind: "hydration",
        label: "Electrolyte drink",
      })
    );
  });

  it("omits hydration when requested for the Home entry feed", () => {
    const timeline = buildEntryTimeline({
      detailedNutritionTargets,
      hydrationLogs: [
        {
          amountOz: 8,
          id: "hydration-1",
          timestamp: Date.parse("2026-04-06T08:00:00.000Z"),
        },
      ],
      includeHydration: false,
      macroTargets,
      mealItemsByMealId: new Map(),
      meals: [
        {
          entryMethod: "manual",
          id: "meal-1",
          label: "Coffee protein shake",
          mealType: "drink",
          nutrients: {},
          timestamp: Date.parse("2026-04-06T09:00:00.000Z"),
          totals: {
            calories: 180,
            carbs: 12,
            fat: 4,
            protein: 28,
          },
        },
      ],
      supplementLogs: [],
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toEqual(
      expect.objectContaining({
        id: "meal-1",
        kind: "meal",
        mealType: "drink",
      })
    );
  });
});
