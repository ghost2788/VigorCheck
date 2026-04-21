import {
  buildHydrationShortcutDrinkMigrationPatch,
  getDefaultHydrationShortcutMealType,
} from "../../lib/domain/hydrationShortcuts";

describe("hydration shortcut meal type helpers", () => {
  it("defaults new shortcut meal types to drink", () => {
    expect(getDefaultHydrationShortcutMealType()).toBe("drink");
  });

  it("migrates all hydration_and_nutrition shortcuts to drink", () => {
    expect(
      buildHydrationShortcutDrinkMigrationPatch({
        logMode: "hydration_and_nutrition",
        mealType: "snack",
      })
    ).toEqual({ mealType: "drink" });

    expect(
      buildHydrationShortcutDrinkMigrationPatch({
        logMode: "hydration_and_nutrition",
        mealType: "drink",
      })
    ).toBeUndefined();
  });

  it("leaves hydration_only shortcuts unchanged", () => {
    expect(
      buildHydrationShortcutDrinkMigrationPatch({
        logMode: "hydration_only",
        mealType: "snack",
      })
    ).toBeUndefined();
  });
});
