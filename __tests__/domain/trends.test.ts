import * as trendsDomain from "../../lib/domain/trends";
import * as dayWindow from "../../lib/domain/dayWindow";
import { getNutritionTargets } from "../../lib/domain/wellness";

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

  it("builds capped current streaks from the last 60 days", () => {
    const helper = (trendsDomain as typeof trendsDomain & {
      buildCurrentStreak?: (args: {
        cap?: number;
        days: Array<{
          caloriesScore: number;
          didLogAnything: boolean;
          hydrationScore: number;
          proteinScore: number;
        }>;
        metric: "calories" | "hydration" | "logging" | "protein";
      }) => { count: number; isCapped: boolean };
    }).buildCurrentStreak;

    expect(typeof helper).toBe("function");

    const streakDays = Array.from({ length: 60 }, () => ({
      caloriesScore: 100,
      didLogAnything: true,
      hydrationScore: 100,
      proteinScore: 100,
    }));

    expect(
      helper?.({
        days: streakDays,
        metric: "logging",
      })
    ).toEqual({
      count: 60,
      isCapped: true,
    });

    expect(
      helper?.({
        days: [
          {
            caloriesScore: 100,
            didLogAnything: true,
            hydrationScore: 100,
            proteinScore: 100,
          },
          {
            caloriesScore: 100,
            didLogAnything: true,
            hydrationScore: 0,
            proteinScore: 100,
          },
        ],
        metric: "hydration",
      })
    ).toEqual({
      count: 1,
      isCapped: false,
    });
  });

  it("ranks recurring nutrient gaps by the lowest weekly average coverage ratio", () => {
    const helper = (trendsDomain as typeof trendsDomain & {
      summarizeWeeklyNutrition?: (args: {
        days: Array<{
          isFuture: boolean;
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
        recurringGaps: Array<
          "calcium" | "fiber" | "iron" | "potassium" | "vitaminC" | "vitaminD"
        >;
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
    expect(nutrition?.nutrients.find((entry) => entry.key === "fiber")?.averagePercent).toBe(45);
  });

  it("builds newest-first trailing date keys for capped streak windows", () => {
    const helper = (dayWindow as typeof dayWindow & {
      getTrailingDateKeys?: (args: {
        count: number;
        timeZone: string;
        timestamp: number;
      }) => string[];
    }).getTrailingDateKeys;

    expect(typeof helper).toBe("function");

    expect(
      helper?.({
        count: 3,
        timeZone: "Pacific/Honolulu",
        timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
      })
    ).toEqual(["2026-03-29", "2026-03-28", "2026-03-27"]);
  });
});
