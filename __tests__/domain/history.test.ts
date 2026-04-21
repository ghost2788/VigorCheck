import {
  buildHistoryDaySummary,
  buildHistoryTimeline,
  formatHistoryDateLabel,
  getMealEntryMethodLabel,
} from "../../lib/domain/history";
import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";

describe("history domain helpers", () => {
  const detailedNutritionTargets = getDetailedNutrientTargets({
    age: 34,
    sex: "male",
    targetFiber: 30,
  });
  const macroTargets = {
    calories: 2000,
    carbs: 200,
    fat: 67,
    protein: 150,
  };

  it("builds a history day summary from meals and hydration logs", () => {
    const summary = buildHistoryDaySummary({
      dateKey: "2026-03-29",
      hydrationLogs: [
        {
          amountOz: 8,
          id: "water-1",
          timestamp: Date.parse("2026-03-29T18:30:00.000Z"),
        },
      ],
      meals: [
        {
          entryMethod: "search",
          id: "meal-1",
          label: "Chicken bowl",
          mealType: "lunch",
          nutrients: {
            calcium: 80,
            fiber: 8,
            iron: 3,
            potassium: 620,
            vitaminC: 20,
            vitaminD: 2,
          },
          timestamp: Date.parse("2026-03-29T20:00:00.000Z"),
          totals: {
            calories: 745,
            carbs: 68,
            fat: 24,
            protein: 43,
          },
        },
      ],
      targets: {
        calories: 3030,
        carbs: 320,
        hydration: 11,
        nutrition: {
          calcium: 1000,
          fiber: 30,
          iron: 8,
          potassium: 3400,
          vitaminC: 90,
          vitaminD: 15,
        },
        detailedNutrition: getDetailedNutrientTargets({
          age: 34,
          sex: "male",
          targetFiber: 30,
        }),
        fat: 92,
        protein: 122,
      },
    });

    expect(summary).toEqual(
      expect.objectContaining({
        calories: 745,
        carbs: 68,
        dateKey: "2026-03-29",
        fat: 24,
        hydrationCups: 1,
        mealCount: 1,
        nutritionCoveragePercent: expect.any(Number),
        protein: 43,
        wellnessScore: expect.any(Number),
      })
    );
  });

  it("builds a unified reverse-chronological timeline with meal source labels", () => {
    const timeline = buildHistoryTimeline({
      macroTargets,
      detailedNutritionTargets,
      hydrationLogs: [
        {
          amountOz: 16,
          id: "water-1",
          shortcutLabel: "Water",
          timestamp: Date.parse("2026-03-29T22:00:00.000Z"),
        },
      ],
      mealItemsByMealId: new Map([
        [
          "meal-1",
          [
            { foodName: "Greek yogurt" },
            { foodName: "Blueberries" },
          ],
        ],
      ]),
      meals: [
        {
          entryMethod: "ai_text",
          id: "meal-1",
          label: undefined,
          mealType: "breakfast",
          nutrients: {
            calcium: 80,
            fiber: 2,
            omega3: 1.2,
            sodium: 640,
            sugar: 12,
            vitaminD: 13,
          },
          timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
          totals: {
            calories: 320,
            carbs: 34,
            fat: 9,
            protein: 23,
          },
        },
      ],
    });

    expect(timeline).toEqual([
      expect.objectContaining({
        amountCups: 2,
        amountOz: 16,
        id: "water-1",
        kind: "hydration",
        label: "Water",
      }),
      expect.objectContaining({
        calories: 320,
        carbs: 34,
        entryMethod: "ai_text",
        entryMethodLabel: "Text entry",
        fat: 9,
        id: "meal-1",
        itemCount: 2,
        kind: "meal",
        label: "2 items",
        mealType: "breakfast",
        nutritionRows: expect.arrayContaining([
          expect.objectContaining({
            goalKind: "soft_maximum",
            key: "calories",
            label: "Calories",
            percent: 16,
            rowKind: "macro",
            target: 2000,
            unit: "kcal",
            value: 320,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "protein",
            label: "Protein",
            percent: 15,
            rowKind: "macro",
            target: 150,
            unit: "g",
            value: 23,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "carbs",
            label: "Carbs",
            percent: 17,
            rowKind: "macro",
            target: 200,
            unit: "g",
            value: 34,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "fat",
            label: "Fat",
            percent: 13,
            rowKind: "macro",
            target: 67,
            unit: "g",
            value: 9,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "fiber",
            label: "Fiber",
            percent: 7,
            rowKind: "nutrient",
            target: 30,
            unit: "g",
            value: 2,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "calcium",
            label: "Calcium",
            percent: 8,
            rowKind: "nutrient",
            target: 1000,
            unit: "mg",
            value: 80,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "vitaminD",
            label: "Vitamin D",
            percent: 87,
            rowKind: "nutrient",
            target: 15,
            unit: "mcg",
            value: 13,
          }),
          expect.objectContaining({
            goalKind: "maximum",
            key: "sodium",
            label: "Sodium",
            percent: 28,
            rowKind: "nutrient",
            target: 2300,
            unit: "mg",
            value: 640,
          }),
          expect.objectContaining({
            goalKind: "maximum",
            key: "sugar",
            label: "Sugar",
            percent: 33,
            rowKind: "nutrient",
            target: 36,
            unit: "g",
            value: 12,
          }),
          expect.objectContaining({
            goalKind: "goal",
            key: "omega3",
            label: "Omega-3",
            percent: 75,
            rowKind: "nutrient",
            target: 1.6,
            unit: "g",
            value: 1.2,
          }),
        ]),
        protein: 23,
      }),
    ]);
  });

  it("prefers a remembered hydration display label when shortcutLabel is absent", () => {
    const timeline = buildHistoryTimeline({
      macroTargets,
      detailedNutritionTargets,
      hydrationLogs: [
        {
          amountOz: 12,
          displayLabel: "Cold brew",
          id: "drink-1",
          timestamp: Date.parse("2026-03-29T22:00:00.000Z"),
        },
      ],
      mealItemsByMealId: new Map(),
      meals: [],
    });

    expect(timeline).toEqual([
      expect.objectContaining({
        amountCups: 1.5,
        amountOz: 12,
        id: "drink-1",
        kind: "hydration",
        label: "Cold brew",
      }),
    ]);
  });

  it("maps saved meal entry methods to product-facing labels", () => {
    expect(getMealEntryMethodLabel("photo_scan")).toBe("FoodScan");
    expect(getMealEntryMethodLabel("ai_text")).toBe("Text entry");
    expect(getMealEntryMethodLabel("manual")).toBe("Manual");
  });

  it("builds a supplement-only history day summary with neutral footer copy", () => {
    const summary = buildHistoryDaySummary({
      dateKey: "2026-03-30",
      hydrationLogs: [],
      meals: [],
      supplementLogs: [
        {
          id: "supplement-log-1",
          label: "Vitamin D3",
          nutrients: {
            b12: 0,
            b6: 0,
            calcium: 0,
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
            potassium: 0,
            riboflavin: 0,
            selenium: 0,
            sodium: 0,
            sugar: 0,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 25,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          servingLabel: "1 softgel",
          timestamp: Date.parse("2026-03-30T18:30:00.000Z"),
          totals: {
            calories: 10,
            carbs: 0,
            fat: 1,
            protein: 0,
          },
        },
      ],
      targets: {
        calories: 3030,
        carbs: 320,
        hydration: 11,
        nutrition: {
          calcium: 1000,
          fiber: 30,
          iron: 8,
          potassium: 3400,
          vitaminC: 90,
          vitaminD: 15,
        },
        detailedNutrition: getDetailedNutrientTargets({
          age: 34,
          sex: "male",
          targetFiber: 30,
        }),
        fat: 92,
        protein: 122,
      },
    });

    expect(summary).toEqual(
      expect.objectContaining({
        calories: 10,
        entryCount: 1,
        footerLabel: "1 supplement",
        mealCount: 0,
        protein: 0,
        supplementCount: 1,
      })
    );
  });

  it("passes goal context through the history summary wrapper", () => {
    const hydrationLogs = [
      {
        amountOz: 8,
        id: "water-1",
        timestamp: Date.parse("2026-03-29T18:30:00.000Z"),
      },
    ];
    const meals = [
      {
        entryMethod: "search" as const,
        id: "meal-1",
        label: "Chicken bowl",
        mealType: "lunch" as const,
        nutrients: {
          calcium: 80,
          fiber: 8,
          iron: 3,
          potassium: 620,
          vitaminC: 20,
          vitaminD: 2,
        },
        timestamp: Date.parse("2026-03-29T20:00:00.000Z"),
        totals: {
          calories: 745,
          carbs: 68,
          fat: 24,
          protein: 43,
        },
      },
    ];
    const targets = {
      calories: 3030,
      carbs: 320,
      hydration: 11,
      nutrition: {
        calcium: 1000,
        fiber: 30,
        iron: 8,
        potassium: 3400,
        vitaminC: 90,
        vitaminD: 15,
      },
      detailedNutrition: getDetailedNutrientTargets({
        age: 34,
        sex: "male",
        targetFiber: 30,
      }),
      fat: 92,
      protein: 122,
    };

    const dashboard = buildTodayDashboard({
      goalType: "fat_loss",
      hydrationLogs,
      mealItems: [],
      meals,
      targets,
    });
    const summary = buildHistoryDaySummary({
      dateKey: "2026-03-29",
      goalType: "fat_loss",
      hydrationLogs,
      meals,
      targets,
    });

    expect(summary.wellnessScore).toBe(dashboard.wellness.score);
  });

  it("renders supplement entries in the unified history timeline", () => {
    const timeline = buildHistoryTimeline({
      macroTargets,
      detailedNutritionTargets,
      hydrationLogs: [],
      mealItemsByMealId: new Map(),
      meals: [],
      supplementLogs: [
        {
          id: "supplement-log-1",
          label: "Magnesium glycinate",
          nutrients: {
            b12: 0,
            b6: 0,
            calcium: 0,
            choline: 0,
            copper: 0,
            fiber: 0,
            folate: 0,
            iron: 0,
            magnesium: 200,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 0,
            riboflavin: 0,
            selenium: 0,
            sodium: 0,
            sugar: 0,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          servingLabel: "2 capsules",
          timestamp: Date.parse("2026-03-29T23:00:00.000Z"),
          totals: {
            calories: 0,
            carbs: 0,
            fat: 0,
            protein: 0,
          },
        },
      ],
    });

    expect(timeline).toEqual([
      expect.objectContaining({
        id: "supplement-log-1",
        kind: "supplement",
        label: "Magnesium glycinate",
        servingLabel: "2 capsules",
      }),
    ]);
  });

  it("formats a calendar date label for history cards", () => {
    expect(formatHistoryDateLabel("2026-03-29")).toBe("Sun, Mar 29");
  });
});
