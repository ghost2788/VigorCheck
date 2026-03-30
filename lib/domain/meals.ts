export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPE_OPTIONS: Array<{ label: string; value: MealType }> = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

export function getDefaultMealType(date = new Date()): MealType {
  const hour = date.getHours();

  if (hour < 11) {
    return "breakfast";
  }

  if (hour < 15) {
    return "lunch";
  }

  if (hour < 21) {
    return "dinner";
  }

  return "snack";
}
