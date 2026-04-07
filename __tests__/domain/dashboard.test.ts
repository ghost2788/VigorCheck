import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";

describe("buildTodayDashboard", () => {
  it("builds wellness scores, card summaries, ranked contributors, and guided nutrient insights", () => {
    const detailedNutrition = getDetailedNutrientTargets({
      age: 34,
      sex: "male",
      targetFiber: 20,
    });

    const dashboard = buildTodayDashboard({
      hydrationLogs: [
        {
          amountOz: 8,
          id: "water-1",
          timestamp: Date.parse("2026-03-29T17:15:00.000Z"),
        },
        {
          amountOz: 8,
          id: "water-2",
          timestamp: Date.parse("2026-03-29T20:45:00.000Z"),
        },
      ],
      mealItems: [
        {
          foodName: "Eggs and toast",
          mealId: "meal-1",
        },
        {
          foodName: "Chicken bowl",
          mealId: "meal-2",
        },
      ],
      meals: [
        {
          entryMethod: "search",
          id: "meal-1",
          label: "Breakfast Plate",
          mealType: "breakfast",
          nutrients: {
            calcium: 40,
            choline: 140,
            copper: 0.1,
            fiber: 6,
            iron: 3,
            manganese: 0.4,
            omega3: 0.1,
            potassium: 300,
            selenium: 18,
            vitaminC: 10,
            vitaminD: 4,
          },
          timestamp: Date.parse("2026-03-29T16:30:00.000Z"),
          totals: {
            calories: 1000,
            carbs: 70,
            fat: 30,
            protein: 30,
          },
        },
        {
          entryMethod: "barcode",
          id: "meal-2",
          mealType: "lunch",
          nutrients: {
            calcium: 10,
            choline: 60,
            copper: 0.4,
            fiber: 4,
            iron: 2,
            manganese: 1.4,
            omega3: 0.3,
            potassium: 200,
            selenium: 45,
            vitaminC: 40,
            vitaminD: 1,
          },
          timestamp: Date.parse("2026-03-29T21:10:00.000Z"),
          totals: {
            calories: 800,
            carbs: 66,
            fat: 22,
            protein: 50,
          },
        },
      ],
      targets: {
        calories: 2000,
        carbs: 220,
        detailedNutrition,
        fat: 70,
        hydration: 4,
        nutrition: {
          calcium: 100,
          fiber: 20,
          iron: 10,
          potassium: 1000,
          vitaminC: 100,
          vitaminD: 10,
        },
        protein: 100,
      },
    });

    expect(dashboard.wellness).toEqual({
      biggestGapKey: "hydration",
      rings: {
        calories: {
          rawProgressPercent: 90,
          score: 100,
        },
        hydration: {
          rawProgressPercent: 50,
          score: 50,
        },
        nutrition: {
          rawProgressPercent: 50,
          score: 50,
        },
        protein: {
          rawProgressPercent: 80,
          score: 80,
        },
      },
      score: 70,
    });

    expect(dashboard.cards.calories).toEqual(
      expect.objectContaining({
        consumed: 1800,
        rawProgressPercent: 90,
        score: 100,
        target: 2000,
      })
    );
    expect(dashboard.cards.protein).toEqual(
      expect.objectContaining({
        consumed: 80,
        rawProgressPercent: 80,
        score: 80,
        target: 100,
      })
    );
    expect(dashboard.cards.hydration).toEqual(
      expect.objectContaining({
        consumedCups: 2,
        consumedOz: 16,
        rawProgressPercent: 50,
        score: 50,
        targetCups: 4,
      })
    );
    expect(dashboard.cards.nutrition).toEqual(
      expect.objectContaining({
        coverageRatio: 0.5,
        coveragePercent: 50,
        score: 50,
      })
    );
    expect(dashboard.cards.nutrition.detailGroups).toHaveLength(3);
    expect(dashboard.cards.nutrition.insights.topWins.map((entry) => entry.key)).toEqual([
      "selenium",
      "manganese",
    ]);
    expect(dashboard.cards.nutrition.insights.biggestGaps.map((entry) => entry.key)).toEqual([
      "calcium",
      "potassium",
    ]);
    expect(
      dashboard.cards.nutrition.detailGroups[2].nutrients.find((entry) => entry.key === "omega3")
    ).toEqual(
      expect.objectContaining({
        percent: 25,
        target: 1.6,
        value: 0.4,
      })
    );

    expect(dashboard.cards.calories.contributors.map((meal) => meal.label)).toEqual([
      "Breakfast Plate",
      "Chicken bowl",
    ]);
    expect(dashboard.cards.protein.contributors.map((meal) => meal.label)).toEqual([
      "Chicken bowl",
      "Breakfast Plate",
    ]);
    expect(dashboard.cards.nutrition.contributors.map((meal) => meal.label)).toEqual([
      "Breakfast Plate",
      "Chicken bowl",
    ]);
    expect(dashboard.cards.nutrition.nutrients).toEqual([
      expect.objectContaining({ key: "fiber", percent: 50 }),
      expect.objectContaining({ key: "potassium", percent: 50 }),
      expect.objectContaining({ key: "calcium", percent: 50 }),
      expect.objectContaining({ key: "iron", percent: 50 }),
      expect.objectContaining({ key: "vitaminD", percent: 50 }),
      expect.objectContaining({ key: "vitaminC", percent: 50 }),
    ]);
    expect(dashboard.cards.hydration.entries.map((entry) => entry.id)).toEqual([
      "water-2",
      "water-1",
    ]);

    expect(dashboard.entryTimeline).toEqual([
      expect.objectContaining({
        calories: 800,
        carbs: 66,
        entryMethod: "barcode",
        entryMethodLabel: "Barcode",
        fat: 22,
        id: "meal-2",
        itemCount: 1,
        kind: "meal",
        label: "Chicken bowl",
        mealType: "lunch",
        protein: 50,
      }),
      expect.objectContaining({
        calories: 1000,
        carbs: 70,
        entryMethod: "search",
        entryMethodLabel: "Search",
        fat: 30,
        id: "meal-1",
        itemCount: 1,
        kind: "meal",
        label: "Breakfast Plate",
        mealType: "breakfast",
        protein: 30,
      }),
    ]);
    expect(dashboard.entryTimeline[0].nutritionRows[0]).toEqual(
      expect.objectContaining({
        key: "calories",
        label: "Calories",
      })
    );
    expect((dashboard as { meals?: unknown }).meals).toBeUndefined();
  });

  it("includes supplement logs in totals, contributor lists, and entry timeline while excluding hydration", () => {
    const detailedNutrition = getDetailedNutrientTargets({
      age: 34,
      sex: "male",
      targetFiber: 20,
    });

    const dashboard = buildTodayDashboard({
      hydrationLogs: [],
      mealItems: [
        {
          foodName: "Greek yogurt",
          mealId: "meal-1",
        },
      ],
      meals: [
        {
          entryMethod: "search",
          id: "meal-1",
          label: "Breakfast bowl",
          mealType: "breakfast",
          nutrients: {
            b12: 0,
            b6: 0,
            calcium: 250,
            choline: 0,
            copper: 0,
            fiber: 6,
            folate: 0,
            iron: 2,
            magnesium: 30,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 300,
            riboflavin: 0,
            selenium: 0,
            sodium: 120,
            sugar: 8,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 6,
            vitaminD: 1,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          timestamp: Date.parse("2026-03-29T16:30:00.000Z"),
          totals: {
            calories: 420,
            carbs: 38,
            fat: 12,
            protein: 24,
          },
        },
      ],
      supplementLogs: [
        {
          id: "supplement-log-1",
          label: "Protein powder",
          nutrients: {
            b12: 0,
            b6: 0,
            calcium: 90,
            choline: 0,
            copper: 0,
            fiber: 0,
            folate: 0,
            iron: 0,
            magnesium: 0,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 120,
            riboflavin: 0,
            selenium: 0,
            sodium: 95,
            sugar: 2,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 4,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          servingLabel: "1 scoop",
          timestamp: Date.parse("2026-03-29T18:00:00.000Z"),
          totals: {
            calories: 130,
            carbs: 4,
            fat: 2,
            protein: 25,
          },
        },
      ],
      targets: {
        calories: 2000,
        carbs: 220,
        detailedNutrition,
        fat: 70,
        hydration: 4,
        nutrition: {
          calcium: 1000,
          fiber: 20,
          iron: 10,
          potassium: 1000,
          vitaminC: 100,
          vitaminD: 10,
        },
        protein: 100,
      },
    });

    expect(dashboard.totals).toEqual({
      calories: 550,
      carbs: 42,
      fat: 14,
      protein: 49,
    });
    expect(dashboard.cards.calories.contributors).toEqual([
      expect.objectContaining({
        kind: "meal",
        label: "Breakfast bowl",
        value: 420,
      }),
      expect.objectContaining({
        kind: "supplement",
        label: "Protein powder",
        servingLabel: "1 scoop",
        value: 130,
      }),
    ]);
    expect(dashboard.cards.protein.contributors[0]).toEqual(
      expect.objectContaining({
        kind: "supplement",
        label: "Protein powder",
        servingLabel: "1 scoop",
        value: 25,
      })
    );
    expect(dashboard.cards.nutrition.contributors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "supplement",
          label: "Protein powder",
          servingLabel: "1 scoop",
        }),
      ])
    );
    expect(dashboard.entryTimeline).toHaveLength(2);
    expect(dashboard.entryTimeline[0]).toEqual(
      expect.objectContaining({
        id: "supplement-log-1",
        kind: "supplement",
        label: "Protein powder",
        servingLabel: "1 scoop",
      })
    );
    expect(dashboard.entryTimeline[1]).toEqual(
      expect.objectContaining({
        id: "meal-1",
        kind: "meal",
      })
    );
  });
});
