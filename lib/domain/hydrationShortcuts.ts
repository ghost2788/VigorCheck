import { MealType } from "./meals";

type ShortcutLogMode = "hydration_only" | "hydration_and_nutrition";

export function getDefaultHydrationShortcutMealType(): MealType {
  return "drink";
}

export function resolveHydrationShortcutMealType(mealType?: MealType): MealType {
  return mealType ?? getDefaultHydrationShortcutMealType();
}

export function buildHydrationShortcutDrinkMigrationPatch(shortcut: {
  logMode: ShortcutLogMode;
  mealType?: MealType;
}) {
  if (shortcut.logMode !== "hydration_and_nutrition" || shortcut.mealType === "drink") {
    return;
  }

  return {
    mealType: "drink" as const,
  };
}
