import { computeBaseTargets } from "../../lib/domain/targets";

describe("computeBaseTargets", () => {
  const baseProfile = {
    activityLevel: "moderate" as const,
    age: 34,
    goalType: "fat_loss" as const,
    goalPace: "moderate" as const,
    height: 70,
    preferredUnitSystem: "imperial" as const,
    primaryTrackingChallenge: "portion_sizes" as const,
    sex: "male" as const,
    weight: 180,
  };

  it("uses goal pace to adjust fat-loss calorie targets", () => {
    const slow = computeBaseTargets({
      ...baseProfile,
      goalPace: "slow",
    });
    const moderate = computeBaseTargets(baseProfile);
    const aggressive = computeBaseTargets({
      ...baseProfile,
      goalPace: "aggressive",
    });

    expect(slow.calories).toBeGreaterThan(moderate.calories);
    expect(aggressive.calories).toBeLessThan(moderate.calories);
  });

  it("uses goal pace to adjust muscle-gain calorie targets", () => {
    const slow = computeBaseTargets({
      ...baseProfile,
      goalPace: "slow",
      goalType: "muscle_gain",
    });
    const moderate = computeBaseTargets({
      ...baseProfile,
      goalPace: "moderate",
      goalType: "muscle_gain",
    });
    const aggressive = computeBaseTargets({
      ...baseProfile,
      goalPace: "aggressive",
      goalType: "muscle_gain",
    });

    expect(slow.calories).toBeLessThan(moderate.calories);
    expect(aggressive.calories).toBeGreaterThan(moderate.calories);
  });

  it("ignores goal pace for general-health plans", () => {
    const slow = computeBaseTargets({
      ...baseProfile,
      goalPace: "slow",
      goalType: "general_health",
    });
    const aggressive = computeBaseTargets({
      ...baseProfile,
      goalPace: "aggressive",
      goalType: "general_health",
    });

    expect(slow.calories).toBe(aggressive.calories);
    expect(slow.protein).toBe(aggressive.protein);
  });
});
