import { buildTodayDashboard } from "../../lib/domain/dashboard";

describe("buildTodayDashboard", () => {
  it("builds wellness scores, card summaries, and ranked contributors", () => {
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
          id: "meal-1",
          label: "Breakfast Plate",
          mealType: "breakfast",
          nutrients: {
            calcium: 40,
            fiber: 6,
            iron: 3,
            potassium: 300,
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
          id: "meal-2",
          mealType: "lunch",
          nutrients: {
            calcium: 10,
            fiber: 4,
            iron: 2,
            potassium: 200,
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
        coveragePercent: 50,
        score: 50,
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

    expect(dashboard.meals).toEqual([
      expect.objectContaining({
        id: "meal-2",
        itemCount: 1,
        label: "Chicken bowl",
      }),
      expect.objectContaining({
        id: "meal-1",
        itemCount: 1,
        label: "Breakfast Plate",
      }),
    ]);
  });
});
