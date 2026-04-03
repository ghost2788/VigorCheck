export type DetailedNutrientKey =
  | "fiber"
  | "sodium"
  | "sugar"
  | "vitaminA"
  | "vitaminC"
  | "vitaminD"
  | "vitaminE"
  | "vitaminK"
  | "b6"
  | "b12"
  | "folate"
  | "thiamin"
  | "niacin"
  | "riboflavin"
  | "calcium"
  | "iron"
  | "potassium"
  | "magnesium"
  | "zinc"
  | "phosphorus";

export type DetailedNutrientAmounts = Record<DetailedNutrientKey, number>;
export type DetailedNutrientInput = Partial<DetailedNutrientAmounts>;

export type NutrientDetailGroup = {
  id: "minerals_other" | "vitamins";
  nutrients: Array<{
    key: DetailedNutrientKey;
    label: string;
    unit: string;
    value: number;
  }>;
  title: string;
};

const NUTRIENT_METADATA: Array<{
  group: NutrientDetailGroup["id"];
  key: DetailedNutrientKey;
  label: string;
  unit: string;
}> = [
  { group: "vitamins", key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { group: "vitamins", key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { group: "vitamins", key: "vitaminD", label: "Vitamin D", unit: "mcg" },
  { group: "vitamins", key: "vitaminE", label: "Vitamin E", unit: "mg" },
  { group: "vitamins", key: "vitaminK", label: "Vitamin K", unit: "mcg" },
  { group: "vitamins", key: "b6", label: "Vitamin B6", unit: "mg" },
  { group: "vitamins", key: "b12", label: "Vitamin B12", unit: "mcg" },
  { group: "vitamins", key: "folate", label: "Folate", unit: "mcg" },
  { group: "vitamins", key: "thiamin", label: "Thiamin", unit: "mg" },
  { group: "vitamins", key: "niacin", label: "Niacin", unit: "mg" },
  { group: "vitamins", key: "riboflavin", label: "Riboflavin", unit: "mg" },
  { group: "minerals_other", key: "fiber", label: "Fiber", unit: "g" },
  { group: "minerals_other", key: "sodium", label: "Sodium", unit: "mg" },
  { group: "minerals_other", key: "sugar", label: "Sugar", unit: "g" },
  { group: "minerals_other", key: "calcium", label: "Calcium", unit: "mg" },
  { group: "minerals_other", key: "iron", label: "Iron", unit: "mg" },
  { group: "minerals_other", key: "potassium", label: "Potassium", unit: "mg" },
  { group: "minerals_other", key: "magnesium", label: "Magnesium", unit: "mg" },
  { group: "minerals_other", key: "zinc", label: "Zinc", unit: "mg" },
  { group: "minerals_other", key: "phosphorus", label: "Phosphorus", unit: "mg" },
];

const GROUP_TITLES: Record<NutrientDetailGroup["id"], string> = {
  minerals_other: "Minerals & other",
  vitamins: "Vitamins",
};

export function createEmptyDetailedNutrientTotals(): DetailedNutrientAmounts {
  return {
    b12: 0,
    b6: 0,
    calcium: 0,
    fiber: 0,
    folate: 0,
    iron: 0,
    magnesium: 0,
    niacin: 0,
    phosphorus: 0,
    potassium: 0,
    riboflavin: 0,
    sodium: 0,
    sugar: 0,
    thiamin: 0,
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    zinc: 0,
  };
}

export function sumDetailedNutrients(
  entries: Array<{
    nutrients: DetailedNutrientInput;
  }>
): DetailedNutrientAmounts {
  return entries.reduce<DetailedNutrientAmounts>((totals, entry) => {
    for (const nutrient of NUTRIENT_METADATA) {
      totals[nutrient.key] += entry.nutrients[nutrient.key] ?? 0;
    }

    return totals;
  }, createEmptyDetailedNutrientTotals());
}

export function buildGroupedNutrientDetails(
  totals: DetailedNutrientAmounts
): NutrientDetailGroup[] {
  return (["vitamins", "minerals_other"] as const).map((groupId) => ({
    id: groupId,
    nutrients: NUTRIENT_METADATA.filter((nutrient) => nutrient.group === groupId).map((nutrient) => ({
      key: nutrient.key,
      label: nutrient.label,
      unit: nutrient.unit,
      value: totals[nutrient.key],
    })),
    title: GROUP_TITLES[groupId],
  }));
}
