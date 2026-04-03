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

});
