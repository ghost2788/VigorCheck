import { computeBaseTargets, resolveEditableTargets } from "../../lib/domain/targets";

describe("computeBaseTargets", () => {
  it("computes fat-loss targets from a user profile", () => {
    const targets = computeBaseTargets({
      activityLevel: "moderate",
      age: 34,
      goalType: "fat_loss",
      height: 70,
      sex: "male",
      weight: 180,
    });

    expect(targets).toEqual({
      calories: 2232,
      carbs: 257,
      fat: 62,
      fiber: 31,
      hydration: 11,
      protein: 162,
      sodium: 2300,
      sugar: 36,
    });
  });

  it("computes muscle-gain targets for a female profile", () => {
    const targets = computeBaseTargets({
      activityLevel: "light",
      age: 29,
      goalType: "muscle_gain",
      height: 64,
      sex: "female",
      weight: 140,
    });

    expect(targets).toEqual({
      calories: 2149,
      carbs: 290,
      fat: 60,
      fiber: 30,
      hydration: 9,
      protein: 112,
      sodium: 2300,
      sugar: 25,
    });
  });
});

describe("resolveEditableTargets", () => {
  it("stores overrides only when the submitted values differ from computed defaults", () => {
    const computed = {
      calories: 2232,
      carbs: 256,
      fat: 62,
      fiber: 31,
      hydration: 11,
      protein: 162,
      sodium: 2300,
      sugar: 36,
    };

    expect(
      resolveEditableTargets({
        computed,
        submitted: {
          calories: 2232,
          carbs: 240,
          fat: 62,
          protein: 170,
        },
      })
    ).toEqual({
      overrideCalories: undefined,
      overrideCarbs: 240,
      overrideFat: undefined,
      overrideProtein: 170,
    });
  });
});
