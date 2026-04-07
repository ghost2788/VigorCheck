import type { Sex } from "./targets";

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
  | "phosphorus"
  | "omega3"
  | "choline"
  | "selenium"
  | "copper"
  | "manganese";

export type DetailedNutrientAmounts = Record<DetailedNutrientKey, number>;
export type DetailedNutrientInput = Partial<DetailedNutrientAmounts>;
export type DetailedNutrientTargets = Record<DetailedNutrientKey, number>;
export type DetailedNutrientTargetKind = "maximum" | "minimum";

export type NutrientDetailRow = {
  key: DetailedNutrientKey;
  label: string;
  percent: number;
  target: number;
  targetKind: DetailedNutrientTargetKind;
  unit: string;
  value: number;
};

export type NutrientInsightRow = NutrientDetailRow;

export type NutrientSourceTag = {
  key: DetailedNutrientKey;
  label: string;
  unit: string;
  value: number;
};

export type NutrientDetailGroup = {
  id: "minerals" | "other_nutrients" | "vitamins";
  nutrients: NutrientDetailRow[];
  title: string;
};

const GROUP_ORDER: NutrientDetailGroup["id"][] = ["vitamins", "minerals", "other_nutrients"];

const GROUP_TITLES: Record<NutrientDetailGroup["id"], string> = {
  minerals: "Minerals",
  other_nutrients: "Other nutrients",
  vitamins: "Vitamins",
};

const NUTRIENT_METADATA: Array<{
  group: NutrientDetailGroup["id"];
  key: DetailedNutrientKey;
  label: string;
  targetKind: DetailedNutrientTargetKind;
  unit: string;
}> = [
  { group: "vitamins", key: "vitaminA", label: "Vitamin A", targetKind: "minimum", unit: "mcg" },
  { group: "vitamins", key: "vitaminC", label: "Vitamin C", targetKind: "minimum", unit: "mg" },
  { group: "vitamins", key: "vitaminD", label: "Vitamin D", targetKind: "minimum", unit: "mcg" },
  { group: "vitamins", key: "vitaminE", label: "Vitamin E", targetKind: "minimum", unit: "mg" },
  { group: "vitamins", key: "vitaminK", label: "Vitamin K", targetKind: "minimum", unit: "mcg" },
  { group: "vitamins", key: "b6", label: "Vitamin B6", targetKind: "minimum", unit: "mg" },
  { group: "vitamins", key: "b12", label: "Vitamin B12", targetKind: "minimum", unit: "mcg" },
  { group: "vitamins", key: "folate", label: "Folate", targetKind: "minimum", unit: "mcg" },
  { group: "vitamins", key: "thiamin", label: "Thiamin", targetKind: "minimum", unit: "mg" },
  { group: "vitamins", key: "niacin", label: "Niacin", targetKind: "minimum", unit: "mg" },
  { group: "vitamins", key: "riboflavin", label: "Riboflavin", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "fiber", label: "Fiber", targetKind: "minimum", unit: "g" },
  { group: "minerals", key: "sodium", label: "Sodium", targetKind: "maximum", unit: "mg" },
  { group: "minerals", key: "sugar", label: "Sugar", targetKind: "maximum", unit: "g" },
  { group: "minerals", key: "calcium", label: "Calcium", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "iron", label: "Iron", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "potassium", label: "Potassium", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "magnesium", label: "Magnesium", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "zinc", label: "Zinc", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "phosphorus", label: "Phosphorus", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "selenium", label: "Selenium", targetKind: "minimum", unit: "mcg" },
  { group: "minerals", key: "copper", label: "Copper", targetKind: "minimum", unit: "mg" },
  { group: "minerals", key: "manganese", label: "Manganese", targetKind: "minimum", unit: "mg" },
  { group: "other_nutrients", key: "omega3", label: "Omega-3", targetKind: "minimum", unit: "g" },
  { group: "other_nutrients", key: "choline", label: "Choline", targetKind: "minimum", unit: "mg" },
];

type DetailedTargetArgs = {
  age: number;
  sex: Sex;
  targetFiber: number;
};

function roundPercent(value: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.round((value / target) * 100);
}

function roundDisplayValue(value: number) {
  return Math.round(value * 10) / 10;
}

function getMetadataForKey(key: DetailedNutrientKey) {
  const metadata = NUTRIENT_METADATA.find((entry) => entry.key === key);

  if (!metadata) {
    throw new Error(`Unknown nutrient metadata for ${key}.`);
  }

  return metadata;
}

function buildRow({
  key,
  targetKind,
  targets,
  totals,
}: {
  key: DetailedNutrientKey;
  targetKind: DetailedNutrientTargetKind;
  targets: DetailedNutrientTargets;
  totals: DetailedNutrientAmounts;
}) {
  const metadata = getMetadataForKey(key);

  return {
    key,
    label: metadata.label,
    percent: roundPercent(totals[key], targets[key]),
    target: targets[key],
    targetKind,
    unit: metadata.unit,
    value: roundDisplayValue(totals[key]),
  } satisfies NutrientDetailRow;
}

function getComparableRatio(row: NutrientDetailRow) {
  if (row.targetKind !== "minimum" || !row.target) {
    return null;
  }

  return row.value / row.target;
}

export function createEmptyDetailedNutrientTotals(): DetailedNutrientAmounts {
  return {
    b12: 0,
    b6: 0,
    calcium: 0,
    choline: 0,
    copper: 0,
    fiber: 0,
    folate: 0,
    iron: 0,
    magnesium: 0,
    manganese: 0,
    niacin: 0,
    omega3: 0,
    phosphorus: 0,
    potassium: 0,
    riboflavin: 0,
    selenium: 0,
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

export function getDetailedNutrientTargets({
  age,
  sex,
  targetFiber,
}: DetailedTargetArgs): DetailedNutrientTargets {
  const normalizedAge = Math.max(age, 19);
  const isMale = sex === "male";
  const olderAdult = normalizedAge >= 51;
  const seniorAdult = normalizedAge >= 71;

  return {
    b12: 2.4,
    b6: isMale ? (olderAdult ? 1.7 : 1.3) : olderAdult ? 1.5 : 1.3,
    calcium: isMale ? (seniorAdult ? 1200 : 1000) : olderAdult ? 1200 : 1000,
    choline: isMale ? 550 : 425,
    copper: 0.9,
    fiber: targetFiber,
    folate: 400,
    iron: isMale ? 8 : olderAdult ? 8 : 18,
    magnesium: isMale ? 420 : 320,
    manganese: isMale ? 2.3 : 1.8,
    niacin: isMale ? 16 : 14,
    omega3: isMale ? 1.6 : 1.1,
    phosphorus: 700,
    potassium: isMale ? 3400 : 2600,
    riboflavin: isMale ? 1.3 : 1.1,
    selenium: 55,
    sodium: 2300,
    sugar: isMale ? 36 : 25,
    thiamin: isMale ? 1.2 : 1.1,
    vitaminA: isMale ? 900 : 700,
    vitaminC: isMale ? 90 : 75,
    vitaminD: seniorAdult ? 20 : 15,
    vitaminE: 15,
    vitaminK: isMale ? 120 : 90,
    zinc: isMale ? 11 : 8,
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

export function buildGroupedNutrientDetails({
  targets,
  totals,
}: {
  targets: DetailedNutrientTargets;
  totals: DetailedNutrientAmounts;
}): NutrientDetailGroup[] {
  return GROUP_ORDER.map((groupId) => ({
    id: groupId,
    nutrients: NUTRIENT_METADATA.filter((nutrient) => nutrient.group === groupId).map((nutrient) =>
      buildRow({
        key: nutrient.key,
        targetKind: nutrient.targetKind,
        targets,
        totals,
      })
    ),
    title: GROUP_TITLES[groupId],
  }));
}

export function buildNutrientInsights({
  targets,
  totals,
}: {
  targets: DetailedNutrientTargets;
  totals: DetailedNutrientAmounts;
}) {
  const ranked = NUTRIENT_METADATA.map((nutrient) =>
    buildRow({
      key: nutrient.key,
      targetKind: nutrient.targetKind,
      targets,
      totals,
    })
  )
    .filter((row) => row.value > 0)
    .map((row) => ({
      ratio: getComparableRatio(row),
      row,
    }))
    .filter((entry): entry is { ratio: number; row: NutrientDetailRow } => entry.ratio !== null);

  const topWins = [...ranked]
    .sort((left, right) => {
      if (right.ratio !== left.ratio) {
        return right.ratio - left.ratio;
      }

      return left.row.label.localeCompare(right.row.label);
    })
    .slice(0, 2)
    .map((entry) => entry.row);

  const biggestGaps = [...ranked]
    .sort((left, right) => {
      if (left.ratio !== right.ratio) {
        return left.ratio - right.ratio;
      }

      return left.row.label.localeCompare(right.row.label);
    })
    .slice(0, 2)
    .map((entry) => entry.row);

  return {
    biggestGaps,
    topWins,
  };
}

export function buildTopNutrientSources({
  limit = 2,
  minimumContributionRatio = 0.1,
  targets,
  totals,
}: {
  limit?: number;
  minimumContributionRatio?: number;
  targets: DetailedNutrientTargets;
  totals: DetailedNutrientInput;
}): NutrientSourceTag[] {
  return NUTRIENT_METADATA.map((nutrient) => {
    const rawValue = totals[nutrient.key] ?? 0;
    const target = targets[nutrient.key];
    const ratio =
      nutrient.targetKind === "minimum" && target > 0 && rawValue > 0 ? rawValue / target : 0;

    return {
      key: nutrient.key,
      label: nutrient.label,
      ratio,
      rawValue,
      targetKind: nutrient.targetKind,
      unit: nutrient.unit,
    };
  })
    .filter(
      (entry) =>
        entry.targetKind === "minimum" && entry.ratio >= minimumContributionRatio && entry.rawValue > 0
    )
    .sort((left, right) => {
      if (right.ratio !== left.ratio) {
        return right.ratio - left.ratio;
      }

      if (right.rawValue !== left.rawValue) {
        return right.rawValue - left.rawValue;
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, limit)
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      unit: entry.unit,
      value: roundDisplayValue(entry.rawValue),
    }));
}
