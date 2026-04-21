import {
  buildGoalsAndTargetsSummary,
  buildReminderSummaryItems,
  diffPlanSettings,
  mergePlanSettings,
} from "../../lib/domain/profileSettings";

describe("buildReminderSummaryItems", () => {
  it("returns all four reminders with on/off status", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: true,
      notifyMealLogging: true,
      notifyGoalCompletion: false,
      notifyEndOfDay: false,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items).toEqual([
      { label: "Hydration", enabled: true },
      { label: "Meal logging", enabled: true },
      { label: "Goal completion", enabled: false },
      { label: "End-of-day", enabled: false },
    ]);
  });

  it("returns all enabled when all toggles are on", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: true,
      notifyMealLogging: true,
      notifyGoalCompletion: true,
      notifyEndOfDay: true,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items.every((item) => item.enabled)).toBe(true);
  });

  it("returns all disabled when all toggles are off", () => {
    const items = buildReminderSummaryItems({
      notifyHydration: false,
      notifyMealLogging: false,
      notifyGoalCompletion: false,
      notifyEndOfDay: false,
      wakeTime: "07:00",
      sleepTime: "22:00",
    });

    expect(items.every((item) => !item.enabled)).toBe(true);
  });
});

describe("buildGoalsAndTargetsSummary", () => {
  it("returns Pace alongside separate Carbs and Fat items for paced goals", () => {
    const items = buildGoalsAndTargetsSummary({
      activityLevel: "moderate",
      age: 32,
      goalPace: "moderate",
      goalType: "fat_loss",
      height: 70,
      preferredUnitSystem: "imperial",
      primaryTrackingChallenge: "consistency",
      sex: "male",
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      timeZone: "America/New_York",
      weight: 185,
    });

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Pace");
    expect(labels).toContain("Carbs");
    expect(labels).toContain("Fat");
    expect(labels).not.toContain("Carbs / Fat");

    expect(items.find((i) => i.label === "Pace")?.value).toBe("Moderate");
    expect(items.find((i) => i.label === "Carbs")?.value).toBe("200 g");
    expect(items.find((i) => i.label === "Fat")?.value).toBe("67 g");
  });

  it("omits Pace for goals that do not use it", () => {
    const items = buildGoalsAndTargetsSummary({
      activityLevel: "moderate",
      age: 32,
      goalPace: undefined,
      goalType: "general_health",
      height: 70,
      preferredUnitSystem: "imperial",
      primaryTrackingChallenge: "consistency",
      sex: "male",
      targets: { calories: 2200, protein: 150, carbs: 240, fat: 73 },
      timeZone: "America/New_York",
      weight: 185,
    });

    expect(items.map((item) => item.label)).toEqual([
      "Goal",
      "Calories",
      "Protein",
      "Carbs",
      "Fat",
    ]);
    expect(items.find((item) => item.value === "Not used")).toBeUndefined();
  });
});

describe("profileSettings", () => {
  const baseSettings = {
    activityLevel: "moderate" as const,
    age: 34,
    goalPace: "moderate" as const,
    goalType: "fat_loss" as const,
    height: 70,
    preferredUnitSystem: "imperial" as const,
    primaryTrackingChallenge: "consistency" as const,
    sex: "male" as const,
    targets: {
      calories: 2500,
      carbs: 250,
      fat: 80,
      protein: 180,
    },
    timeZone: "Pacific/Honolulu",
    weight: 180,
  };

  it("returns only changed fields when diffing plan settings", () => {
    expect(
      diffPlanSettings(baseSettings, {
        ...baseSettings,
        goalPace: "aggressive",
        primaryTrackingChallenge: "motivation",
      })
    ).toEqual({
      goalPace: "aggressive",
      primaryTrackingChallenge: "motivation",
    });
  });

  it("drops goal pace when the next goal does not use it", () => {
    expect(
      mergePlanSettings(baseSettings, {
        goalType: "general_health",
      })
    ).toEqual(
      expect.objectContaining({
        goalPace: undefined,
        goalType: "general_health",
      })
    );
  });
});
