import {
  buildHistoryDaySummary,
  buildHistoryTimeline,
  formatHistoryDateLabel,
  getMealEntryMethodLabel,
} from "../../lib/domain/history";

describe("history domain helpers", () => {
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
        hydration: 11,
        nutrition: {
          calcium: 1000,
          fiber: 30,
          iron: 8,
          potassium: 3400,
          vitaminC: 90,
          vitaminD: 15,
        },
        protein: 122,
      },
    });

    expect(summary).toEqual(
      expect.objectContaining({
        calories: 745,
        dateKey: "2026-03-29",
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
        entryMethod: "ai_text",
        entryMethodLabel: "Text entry",
        id: "meal-1",
        itemCount: 2,
        kind: "meal",
        label: "2 items",
      }),
    ]);
  });

  it("maps saved meal entry methods to product-facing labels", () => {
    expect(getMealEntryMethodLabel("photo_scan")).toBe("FoodScan");
    expect(getMealEntryMethodLabel("ai_text")).toBe("Text entry");
    expect(getMealEntryMethodLabel("manual")).toBe("Manual");
  });

  it("formats a calendar date label for history cards", () => {
    expect(formatHistoryDateLabel("2026-03-29")).toBe("Sun, Mar 29");
  });
});
