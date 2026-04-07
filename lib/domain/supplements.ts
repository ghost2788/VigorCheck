import { MealMacroTotals } from "./mealNutritionRows";
import { DetailedNutrientInput } from "./nutrients";

export type SupplementFrequency = "daily" | "as_needed";
export type SupplementStatus = "active" | "archived";
export type SupplementSourceKind = "scanned" | "custom" | "legacy";
export type SupplementFingerprintKind = "strong" | "provisional";

export type SupplementActiveIngredient = {
  amount?: number;
  name: string;
  note?: string;
  unit?: string;
};

export type SupplementNutritionProfile = DetailedNutrientInput &
  Partial<{
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  }>;

export type SupplementLogSnapshot = {
  activeIngredients?: SupplementActiveIngredient[];
  id: string;
  label: string;
  nutrients: DetailedNutrientInput;
  servingLabel: string;
  timestamp: number;
  totals: MealMacroTotals;
};

export type SupplementReviewDraft = {
  activeIngredients: SupplementActiveIngredient[];
  brand?: string;
  displayName: string;
  frequency: SupplementFrequency;
  nutritionProfile: SupplementNutritionProfile;
  overallConfidence: "high" | "medium" | "low";
  servingLabel: string;
  servingsPerContainer?: string;
};

export const supplementNutritionFieldKeys = [
  "b12",
  "b6",
  "calcium",
  "calories",
  "carbs",
  "choline",
  "copper",
  "fat",
  "fiber",
  "folate",
  "iron",
  "magnesium",
  "manganese",
  "niacin",
  "omega3",
  "phosphorus",
  "potassium",
  "protein",
  "riboflavin",
  "selenium",
  "sodium",
  "sugar",
  "thiamin",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminK",
  "zinc",
] as const;

export function normalizeSupplementNutritionProfile(
  profile?: SupplementNutritionProfile | null
): Required<Pick<MealMacroTotals, "calories" | "carbs" | "fat" | "protein">> & DetailedNutrientInput {
  return {
    b12: profile?.b12 ?? 0,
    b6: profile?.b6 ?? 0,
    calcium: profile?.calcium ?? 0,
    calories: profile?.calories ?? 0,
    carbs: profile?.carbs ?? 0,
    choline: profile?.choline ?? 0,
    copper: profile?.copper ?? 0,
    fat: profile?.fat ?? 0,
    fiber: profile?.fiber ?? 0,
    folate: profile?.folate ?? 0,
    iron: profile?.iron ?? 0,
    magnesium: profile?.magnesium ?? 0,
    manganese: profile?.manganese ?? 0,
    niacin: profile?.niacin ?? 0,
    omega3: profile?.omega3 ?? 0,
    phosphorus: profile?.phosphorus ?? 0,
    potassium: profile?.potassium ?? 0,
    protein: profile?.protein ?? 0,
    riboflavin: profile?.riboflavin ?? 0,
    selenium: profile?.selenium ?? 0,
    sodium: profile?.sodium ?? 0,
    sugar: profile?.sugar ?? 0,
    thiamin: profile?.thiamin ?? 0,
    vitaminA: profile?.vitaminA ?? 0,
    vitaminC: profile?.vitaminC ?? 0,
    vitaminD: profile?.vitaminD ?? 0,
    vitaminE: profile?.vitaminE ?? 0,
    vitaminK: profile?.vitaminK ?? 0,
    zinc: profile?.zinc ?? 0,
  };
}

function trimToOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeFingerprintText(value?: string | null) {
  return (
    trimToOptional(value)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function roundFingerprintNumber(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.round(value * 1000) / 1000;
}

function buildNormalizedNutritionFingerprint(profile?: SupplementNutritionProfile | null) {
  const normalized = normalizeSupplementNutritionProfile(profile);

  return {
    b12: normalized.b12,
    b6: normalized.b6,
    calcium: normalized.calcium,
    calories: normalized.calories,
    carbs: normalized.carbs,
    choline: normalized.choline,
    copper: normalized.copper,
    fat: normalized.fat,
    fiber: normalized.fiber,
    folate: normalized.folate,
    iron: normalized.iron,
    magnesium: normalized.magnesium,
    manganese: normalized.manganese,
    niacin: normalized.niacin,
    omega3: normalized.omega3,
    phosphorus: normalized.phosphorus,
    potassium: normalized.potassium,
    protein: normalized.protein,
    riboflavin: normalized.riboflavin,
    selenium: normalized.selenium,
    sodium: normalized.sodium,
    sugar: normalized.sugar,
    thiamin: normalized.thiamin,
    vitaminA: normalized.vitaminA,
    vitaminC: normalized.vitaminC,
    vitaminD: normalized.vitaminD,
    vitaminE: normalized.vitaminE,
    vitaminK: normalized.vitaminK,
    zinc: normalized.zinc,
  };
}

export function normalizeSupplementActiveIngredients(
  activeIngredients?: SupplementActiveIngredient[] | null
) {
  const normalized: SupplementActiveIngredient[] = [];

  for (const ingredient of activeIngredients ?? []) {
    const name = trimToOptional(ingredient.name);

    if (!name) {
      continue;
    }

    const nextIngredient: SupplementActiveIngredient = {
      name,
    };
    const amount = roundFingerprintNumber(ingredient.amount);
    const note = trimToOptional(ingredient.note);
    const unit = trimToOptional(ingredient.unit)?.toLowerCase();

    if (amount !== undefined) {
      nextIngredient.amount = amount;
    }

    if (note) {
      nextIngredient.note = note;
    }

    if (unit) {
      nextIngredient.unit = unit;
    }

    normalized.push(nextIngredient);
  }

  return normalized.sort((left, right) => {
      const leftKey = `${normalizeFingerprintText(left.name)}:${left.amount ?? ""}:${left.unit ?? ""}:${
        normalizeFingerprintText(left.note)
      }`;
      const rightKey = `${normalizeFingerprintText(right.name)}:${right.amount ?? ""}:${right.unit ?? ""}:${
        normalizeFingerprintText(right.note)
      }`;

      return leftKey.localeCompare(rightKey);
    });
}

export function hasSupplementActiveIngredients(
  activeIngredients?: SupplementActiveIngredient[] | null
) {
  return normalizeSupplementActiveIngredients(activeIngredients).length > 0;
}

export function buildStrongSupplementFingerprint(args: {
  activeIngredients: SupplementActiveIngredient[];
  nutritionProfile?: SupplementNutritionProfile | null;
  productName: string;
  servingLabel?: string | null;
}) {
  return JSON.stringify({
    activeIngredients: normalizeSupplementActiveIngredients(args.activeIngredients).map((ingredient) => ({
      amount: ingredient.amount ?? null,
      name: normalizeFingerprintText(ingredient.name),
      note: normalizeFingerprintText(ingredient.note),
      unit: normalizeFingerprintText(ingredient.unit),
    })),
    nutritionProfile: buildNormalizedNutritionFingerprint(args.nutritionProfile),
    productName: normalizeFingerprintText(args.productName),
    servingLabel: normalizeFingerprintText(args.servingLabel),
  });
}

export function buildProvisionalSupplementFingerprint(args: {
  nutritionProfile?: SupplementNutritionProfile | null;
  productName: string;
  servingLabel?: string | null;
}) {
  return JSON.stringify({
    nutritionProfile: buildNormalizedNutritionFingerprint(args.nutritionProfile),
    productName: normalizeFingerprintText(args.productName),
    servingLabel: normalizeFingerprintText(args.servingLabel),
  });
}

export function pickSupplementMergeSurvivor(
  candidates: Array<{
    _creationTime: number;
    fingerprintKind: SupplementFingerprintKind;
    id: string;
    status: SupplementStatus;
  }>
) {
  const winner = [...candidates].sort((left, right) => {
    if (left.fingerprintKind !== right.fingerprintKind) {
      return left.fingerprintKind === "strong" ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    return left._creationTime - right._creationTime;
  })[0];

  return winner?.id ?? null;
}
