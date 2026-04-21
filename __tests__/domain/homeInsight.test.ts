import {
  getAtAGlanceMessage,
  getClampedProgressPercent,
  getDisplayedRingProgress,
  getNutritionCoverageDescriptor,
  getTargetRelativeBarPercent,
} from "../../lib/domain/homeInsight";

describe("getAtAGlanceMessage", () => {
  it("uses a positive calorie summary once the target is reached", () => {
    expect(
      getAtAGlanceMessage({
        biggestGapKey: "calories",
        calorieProgressPercent: 104,
      })
    ).toBe("You've reached your calorie target for the day.");
  });

  it("uses a softer hydration nudge instead of a negative warning", () => {
    expect(
      getAtAGlanceMessage({
        biggestGapKey: "hydration",
        calorieProgressPercent: 42,
      })
    ).toBe("Hydration could use a little more attention.");
  });

  it("keeps protein and nutrition summaries neutral", () => {
    expect(
      getAtAGlanceMessage({
        biggestGapKey: "protein",
        calorieProgressPercent: 55,
      })
    ).toBe("Protein is still building today.");

    expect(
      getAtAGlanceMessage({
        biggestGapKey: "nutrition",
        calorieProgressPercent: 55,
      })
    ).toBe("Nutrition coverage is still building today.");
  });

  it("keeps the calorie ring visible when raw progress exists but the wellness score is zero", () => {
    expect(
      getDisplayedRingProgress({
        rawProgressPercent: 11,
        score: 0,
      })
    ).toBe(11);
  });

  it("caps displayed ring progress at 100", () => {
    expect(
      getDisplayedRingProgress({
        rawProgressPercent: 132,
        score: 84,
      })
    ).toBe(100);
  });

  it("uses the daily target, not today's consumed total, for contribution bars", () => {
    expect(
      getTargetRelativeBarPercent({
        target: 3030,
        value: 320,
      })
    ).toBe(11);

    expect(
      getTargetRelativeBarPercent({
        target: 122,
        value: 23,
      })
    ).toBe(19);

    expect(
      getTargetRelativeBarPercent({
        target: 11,
        value: 1,
      })
    ).toBe(9);
  });

  it("does not force a visual floor for direct progress bars", () => {
    expect(getClampedProgressPercent(0)).toBe(0);
    expect(getClampedProgressPercent(25)).toBe(25);
    expect(getClampedProgressPercent(132)).toBe(100);
  });

  it("maps nutrition coverage into neutral descriptor bands", () => {
    expect(getNutritionCoverageDescriptor(0)).toBe("Getting started");
    expect(getNutritionCoverageDescriptor(24)).toBe("Getting started");
    expect(getNutritionCoverageDescriptor(25)).toBe("Building coverage");
    expect(getNutritionCoverageDescriptor(49)).toBe("Building coverage");
    expect(getNutritionCoverageDescriptor(50)).toBe("Solid coverage");
    expect(getNutritionCoverageDescriptor(74)).toBe("Solid coverage");
    expect(getNutritionCoverageDescriptor(75)).toBe("Strong coverage");
    expect(getNutritionCoverageDescriptor(99)).toBe("Strong coverage");
    expect(getNutritionCoverageDescriptor(100)).toBe("Complete");
  });
});
