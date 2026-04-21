import * as trendsDomain from "../../lib/domain/trends";
import * as dayWindow from "../../lib/domain/dayWindow";
import { buildTodayDashboard } from "../../lib/domain/dashboard";
import { getNutritionTargets } from "../../lib/domain/wellness";
import { getDetailedNutrientTargets } from "../../lib/domain/nutrients";

describe("weekly trend helpers", () => {
  it("builds a Sunday-start week window in Honolulu for the current week", () => {
    const helper = (dayWindow as typeof dayWindow & {
      getWeekWindowForOffset?: (args: {
        timeZone: string;
        timestamp: number;
        weekOffset: number;
        weekStartsOn: 0 | 1;
      }) => {
        end: number;
        endDateKey: string;
        start: number;
        startDateKey: string;
      };
    }).getWeekWindowForOffset;

    expect(typeof helper).toBe("function");

    expect(
      helper?.({
        timeZone: "Pacific/Honolulu",
        timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
        weekOffset: 0,
        weekStartsOn: 0,
      })
    ).toEqual({
      end: Date.parse("2026-04-05T10:00:00.000Z"),
      endDateKey: "2026-04-05",
      start: Date.parse("2026-03-29T10:00:00.000Z"),
      startDateKey: "2026-03-29",
    });
  });

  it("ranks recurring nutrient gaps by the lowest weekly average coverage ratio", () => {
    const helper = (trendsDomain as typeof trendsDomain & {
      summarizeWeeklyNutrition?: (args: {
        days: Array<{
          isFuture: boolean;
          nutrientDetailGroups: Array<{
            nutrients: Array<{
              key: string;
              percent: number;
              target: number;
              value: number;
            }>;
          }>;
          nutrients: Array<{
            consumed: number;
            key:
              | "calcium"
              | "fiber"
              | "iron"
              | "potassium"
              | "vitaminC"
              | "vitaminD";
            target: number;
          }>;
        }>;
      }) => {
        averageCoveragePercent: number;
        detailGroups: Array<{
          nutrients: Array<{
            key: string;
            target: number;
            unit: string;
            value: number;
          }>;
        }>;
        nutrients: Array<{
          averagePercent: number;
          key:
            | "calcium"
            | "fiber"
            | "iron"
            | "potassium"
            | "vitaminC"
            | "vitaminD";
        }>;
        recurringGaps: string[];
        recurringWins: string[];
      };
    }).summarizeWeeklyNutrition;

    expect(typeof helper).toBe("function");

    const targets = getNutritionTargets({
      age: 34,
      sex: "male",
      targetFiber: 30,
    });

    const nutrition = helper?.({
      days: [
        {
          isFuture: false,
          nutrientDetailGroups: [
            {
              nutrients: [
                { key: "fiber", percent: 50, target: targets.fiber, value: 15 },
                { key: "potassium", percent: 18, target: targets.potassium, value: 600 },
                { key: "calcium", percent: 50, target: targets.calcium, value: 500 },
                { key: "iron", percent: 50, target: targets.iron, value: 4 },
                { key: "vitaminD", percent: 13, target: targets.vitaminD, value: 2 },
                { key: "vitaminC", percent: 22, target: targets.vitaminC, value: 20 },
                { key: "omega3", percent: 25, target: 1.6, value: 0.4 },
                { key: "choline", percent: 36, target: 550, value: 200 },
                { key: "selenium", percent: 80, target: 55, value: 44 },
              ],
            },
          ],
          nutrients: [
            { consumed: 15, key: "fiber", target: targets.fiber },
            { consumed: 600, key: "potassium", target: targets.potassium },
            { consumed: 500, key: "calcium", target: targets.calcium },
            { consumed: 4, key: "iron", target: targets.iron },
            { consumed: 2, key: "vitaminD", target: targets.vitaminD },
            { consumed: 20, key: "vitaminC", target: targets.vitaminC },
          ],
        },
        {
          isFuture: false,
          nutrientDetailGroups: [
            {
              nutrients: [
                { key: "fiber", percent: 40, target: targets.fiber, value: 12 },
                { key: "potassium", percent: 21, target: targets.potassium, value: 700 },
                { key: "calcium", percent: 40, target: targets.calcium, value: 400 },
                { key: "iron", percent: 63, target: targets.iron, value: 5 },
                { key: "vitaminD", percent: 7, target: targets.vitaminD, value: 1 },
                { key: "vitaminC", percent: 17, target: targets.vitaminC, value: 15 },
                { key: "omega3", percent: 31, target: 1.6, value: 0.5 },
                { key: "choline", percent: 27, target: 550, value: 150 },
                { key: "selenium", percent: 64, target: 55, value: 35 },
              ],
            },
          ],
          nutrients: [
            { consumed: 12, key: "fiber", target: targets.fiber },
            { consumed: 700, key: "potassium", target: targets.potassium },
            { consumed: 400, key: "calcium", target: targets.calcium },
            { consumed: 5, key: "iron", target: targets.iron },
            { consumed: 1, key: "vitaminD", target: targets.vitaminD },
            { consumed: 15, key: "vitaminC", target: targets.vitaminC },
          ],
        },
      ],
    });

    expect(nutrition?.recurringGaps).toEqual(["vitaminD", "potassium"]);
    expect(nutrition?.recurringWins).toEqual(["selenium", "iron"]);
    expect(nutrition?.nutrients.find((entry) => entry.key === "fiber")?.averagePercent).toBe(45);
    expect(
      nutrition?.detailGroups
        .flatMap((group: { nutrients: Array<{ key: string; target: number; unit: string; value: number }> }) => group.nutrients)
        .find((entry: { key: string; target: number; unit: string; value: number }) => entry.key === "fiber")
    ).toMatchObject({
      target: 60,
      unit: "g",
      value: 27,
    });
  });

  it("treats supplement-only days as logged days and includes supplement nutrition in totals", () => {
    const day = trendsDomain.buildTrendDay({
      dateKey: "2026-03-31",
      hydrationLogs: [],
      isFuture: false,
      meals: [],
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
          timestamp: Date.parse("2026-03-31T17:00:00.000Z"),
          totals: {
            calories: 130,
            carbs: 4,
            fat: 2,
            protein: 25,
          },
        },
      ],
      targets: {
        calories: 2200,
        carbs: 260,
        detailedNutrition: getDetailedNutrientTargets({
          age: 34,
          sex: "male",
          targetFiber: 30,
        }),
        fat: 70,
        hydration: 8,
        nutrition: getNutritionTargets({
          age: 34,
          sex: "male",
          targetFiber: 30,
        }),
        protein: 150,
      },
    });

    expect(day.didLogAnything).toBe(true);
    expect(day.calories).toBe(130);
    expect(day.carbs).toBe(4);
    expect(day.fat).toBe(2);
    expect(day.protein).toBe(25);
    expect(day.nutrients.find((entry) => entry.key === "vitaminD")).toEqual(
      expect.objectContaining({
        consumed: 4,
      })
    );
  });

  it("passes goal context into trend days and counts on-track days from the weighted wellness score", () => {
    const targets = {
      calories: 2000,
      carbs: 220,
      detailedNutrition: getDetailedNutrientTargets({
        age: 34,
        sex: "male",
        targetFiber: 20,
      }),
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
    };
    const hydrationLogs = [
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
    ];
    const meals = [
      {
        entryMethod: "search" as const,
        id: "meal-1",
        label: "Breakfast Plate",
        mealType: "breakfast" as const,
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
        entryMethod: "barcode" as const,
        id: "meal-2",
        mealType: "lunch" as const,
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
    ];

    const homeDashboard = buildTodayDashboard({
      goalType: "fat_loss",
      hydrationLogs,
      mealItems: [],
      meals,
      targets,
    });
    const fatLossDay = trendsDomain.buildTrendDay({
      dateKey: "2026-03-29",
      goalType: "fat_loss",
      hydrationLogs,
      isFuture: false,
      meals,
      targets,
    });
    const generalHealthDay = trendsDomain.buildTrendDay({
      dateKey: "2026-03-30",
      goalType: "general_health",
      hydrationLogs,
      isFuture: false,
      meals,
      targets,
    });
    const overview = trendsDomain.buildWeeklyOverview({
      days: [fatLossDay, generalHealthDay],
      recurringGaps: [],
    });

    expect(fatLossDay.wellnessScore).toBe(homeDashboard.wellness.score);
    expect(fatLossDay.carbs).toBe(136);
    expect(fatLossDay.fat).toBe(52);
    expect(fatLossDay.carbsScore).toBe(30);
    expect(fatLossDay.fatScore).toBe(61);
    expect(fatLossDay.wellnessScore).toBe(69);
    expect(generalHealthDay.wellnessScore).toBe(62);
    expect(overview.onTrackDays).toBe(0);
    expect(overview.weeklyWellnessScore).toBe(66);
    expect(overview.summaryText).toContain("averaging 1,800 kcal/day");
    expect(overview.summaryText).toContain("80g protein/day");
    expect(overview.summaryText).toContain("136g carbs/day");
    expect(overview.summaryText).toContain("52g fat/day");
  });

});
