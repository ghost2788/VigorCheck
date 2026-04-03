export type ScanConfidence = "high" | "medium" | "low";
export type ScanItemSource = "ai_estimated" | "manual" | "usda" | "barcode_catalog";

export type NutritionFields = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  b6: number;
  b12: number;
  folate: number;
  thiamin: number;
  niacin: number;
  riboflavin: number;
  calcium: number;
  iron: number;
  potassium: number;
  magnesium: number;
  zinc: number;
  phosphorus: number;
};

export type RawScanModelItem = {
  name: string;
  portionLabel: string;
  estimatedGrams: number;
  prepMethod?: string;
  confidence: ScanConfidence;
  nutrition: Partial<NutritionFields>;
};

export type ScanDraftItem = {
  barcodeValue?: string;
  id: string;
  source: ScanItemSource;
  name: string;
  normalizedName: string;
  portionLabel: string;
  estimatedGrams: number;
  baseEstimatedGrams: number;
  prepMethod?: string;
  confidence: ScanConfidence;
  multiplier: number;
  nutrition: NutritionFields;
  baseNutrition: NutritionFields;
  usdaFoodId?: string;
  per100g?: NutritionFields;
};

export type UsdaMatchCandidate = {
  fdcId: string;
  name: string;
  category: string;
  caloriesPer100g: number;
};

const CORE_NUTRITION_KEYS: Array<keyof NutritionFields> = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sodium",
  "sugar",
];

const MICRONUTRIENT_KEYS: Array<keyof NutritionFields> = [
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminK",
  "b6",
  "b12",
  "folate",
  "thiamin",
  "niacin",
  "riboflavin",
  "calcium",
  "iron",
  "potassium",
  "magnesium",
  "zinc",
  "phosphorus",
];

const NUTRITION_KEYS: Array<keyof NutritionFields> = [...CORE_NUTRITION_KEYS, ...MICRONUTRIENT_KEYS];

const FILLER_TOKENS = new Set([
  "a",
  "an",
  "and",
  "fresh",
  "homemade",
  "meal",
  "of",
  "plain",
  "style",
  "the",
  "with",
]);

const CONFIDENCE_RANK: Record<ScanConfidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function roundNutritionValue(value: number) {
  return Math.round(value);
}

export function createEmptyNutrition(): NutritionFields {
  return {
    b12: 0,
    b6: 0,
    calcium: 0,
    calories: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    folate: 0,
    iron: 0,
    magnesium: 0,
    niacin: 0,
    phosphorus: 0,
    potassium: 0,
    protein: 0,
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

export function normalizeScanConfidence(
  value: unknown,
  fallback: ScanConfidence = "medium"
): ScanConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function normalizeNutrition(nutrition: Partial<NutritionFields>) {
  const normalized = createEmptyNutrition();

  for (const key of NUTRITION_KEYS) {
    const value = nutrition[key];

    if (value === undefined && MICRONUTRIENT_KEYS.includes(key)) {
      normalized[key] = 0;
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return null;
    }

    normalized[key] = roundNutritionValue(value);
  }

  const hasMeaningfulCore =
    normalized.calories > 0 ||
    normalized.protein > 0 ||
    normalized.carbs > 0 ||
    normalized.fat > 0;

  if (!hasMeaningfulCore) {
    return null;
  }

  return normalized;
}

function mergeNutrition(left: NutritionFields, right: NutritionFields) {
  const merged = createEmptyNutrition();

  for (const key of NUTRITION_KEYS) {
    merged[key] = roundNutritionValue(left[key] + right[key]);
  }

  return merged;
}

function highestConfidence(left: ScanConfidence, right: ScanConfidence) {
  return CONFIDENCE_RANK[left] >= CONFIDENCE_RANK[right] ? left : right;
}

function buildDraftId(normalizedName: string, index: number) {
  return `scan-${normalizedName.replace(/\s+/g, "-") || "item"}-${index + 1}`;
}

function tokenizeFoodName(value: string) {
  return normalizeFoodName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !FILLER_TOKENS.has(token));
}

function scoreUsdaCandidate(queryName: string, candidateName: string) {
  const query = normalizeFoodName(queryName);
  const candidate = normalizeFoodName(candidateName);

  if (!query || !candidate) {
    return 0;
  }

  if (query === candidate) {
    return 100;
  }

  const queryTokens = tokenizeFoodName(query);
  const candidateTokens = tokenizeFoodName(candidate);

  if (!queryTokens.length || !candidateTokens.length) {
    return 0;
  }

  const candidateSet = new Set(candidateTokens);
  const overlapCount = queryTokens.filter((token) => candidateSet.has(token)).length;
  const overlapScore = (overlapCount / queryTokens.length) * 50;
  const exactCoverBonus = overlapCount === queryTokens.length ? 25 : 0;
  const substringBonus = candidate.includes(query) || query.includes(candidate) ? 15 : 0;

  return overlapScore + exactCoverBonus + substringBonus;
}

export function normalizeFoodName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildNormalizedScanDraftItems(items: RawScanModelItem[]) {
  const mergedItems = new Map<string, Omit<ScanDraftItem, "id">>();

  for (const item of items) {
    const name = item.name?.trim();
    const portionLabel = item.portionLabel?.trim();
    const normalizedName = normalizeFoodName(name);

    if (!name || !portionLabel || !normalizedName) {
      continue;
    }

    if (
      typeof item.estimatedGrams !== "number" ||
      !Number.isFinite(item.estimatedGrams) ||
      item.estimatedGrams <= 0 ||
      item.estimatedGrams > 1500
    ) {
      continue;
    }

    const normalizedNutrition = normalizeNutrition(item.nutrition);

    if (!normalizedNutrition) {
      continue;
    }

    const existing = mergedItems.get(normalizedName);

    if (!existing) {
      mergedItems.set(normalizedName, {
        baseEstimatedGrams: roundNutritionValue(item.estimatedGrams),
        baseNutrition: normalizedNutrition,
        confidence: item.confidence,
        estimatedGrams: roundNutritionValue(item.estimatedGrams),
        multiplier: 1,
        name,
        normalizedName,
        nutrition: normalizedNutrition,
        portionLabel,
        prepMethod: item.prepMethod?.trim() || undefined,
        source: "ai_estimated",
      });
      continue;
    }

    const mergedGrams = roundNutritionValue(existing.baseEstimatedGrams + item.estimatedGrams);
    const mergedNutrition = mergeNutrition(existing.baseNutrition, normalizedNutrition);

    mergedItems.set(normalizedName, {
      ...existing,
      baseEstimatedGrams: mergedGrams,
      baseNutrition: mergedNutrition,
      confidence: highestConfidence(existing.confidence, item.confidence),
      estimatedGrams: mergedGrams,
      nutrition: mergedNutrition,
      portionLabel: `${mergedGrams} g estimated`,
    });
  }

  return Array.from(mergedItems.values()).map((item, index) => ({
    ...item,
    id: buildDraftId(item.normalizedName, index),
  }));
}

export function findBestUsdaMatch<T extends UsdaMatchCandidate>(queryName: string, candidates: T[]) {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreUsdaCandidate(queryName, candidate.name),
    }))
    .sort((left, right) => right.score - left.score);

  const [best, runnerUp] = scored;

  if (!best || best.score < 65) {
    return null;
  }

  if (runnerUp && best.score - runnerUp.score < 10) {
    return null;
  }

  return best.candidate;
}

function scaleNutrition(nutrition: NutritionFields, multiplier: number) {
  const scaled = createEmptyNutrition();

  for (const key of NUTRITION_KEYS) {
    scaled[key] = roundNutritionValue(nutrition[key] * multiplier);
  }

  return scaled;
}

export function scaleNutritionFields(nutrition: NutritionFields, multiplier: number) {
  return scaleNutrition(nutrition, multiplier);
}

export function scaleDraftItem(item: ScanDraftItem, multiplier: number): ScanDraftItem {
  const safeMultiplier = Math.max(0.25, Math.min(4, multiplier));
  const estimatedGrams = roundNutritionValue(item.baseEstimatedGrams * safeMultiplier);
  const nutrition =
    item.source === "usda" && item.per100g
      ? scaleNutrition(item.per100g, estimatedGrams / 100)
      : scaleNutrition(item.baseNutrition, safeMultiplier);

  return {
    ...item,
    estimatedGrams,
    multiplier: safeMultiplier,
    nutrition,
  };
}

type CreateDraftItemInput = Omit<ScanDraftItem, "baseEstimatedGrams" | "baseNutrition" | "id" | "multiplier" | "normalizedName" | "source">;

export function createAiEstimatedDraftItem(input: CreateDraftItemInput): ScanDraftItem {
  return {
    ...input,
    baseEstimatedGrams: input.estimatedGrams,
    baseNutrition: input.nutrition,
    id: buildDraftId(normalizeFoodName(input.name), 0),
    multiplier: 1,
    normalizedName: normalizeFoodName(input.name),
    source: "ai_estimated",
  };
}

export function createUsdaDraftItem(
  input: CreateDraftItemInput & { per100g: NutritionFields; usdaFoodId: string }
): ScanDraftItem {
  return {
    ...input,
    baseEstimatedGrams: input.estimatedGrams,
    baseNutrition: input.nutrition,
    id: buildDraftId(normalizeFoodName(input.name), 0),
    multiplier: 1,
    normalizedName: normalizeFoodName(input.name),
    source: "usda",
  };
}

export function createManualDraftItem(input: CreateDraftItemInput): ScanDraftItem {
  return {
    ...input,
    baseEstimatedGrams: input.estimatedGrams,
    baseNutrition: input.nutrition,
    id: buildDraftId(normalizeFoodName(input.name), 0),
    multiplier: 1,
    normalizedName: normalizeFoodName(input.name),
    source: "manual",
  };
}

export function createBarcodeDraftItem(
  input: CreateDraftItemInput & { barcodeValue: string }
): ScanDraftItem {
  return {
    ...input,
    baseEstimatedGrams: input.estimatedGrams,
    baseNutrition: input.nutrition,
    id: buildDraftId(normalizeFoodName(input.name), 0),
    multiplier: 1,
    normalizedName: normalizeFoodName(input.name),
    source: "barcode_catalog",
  };
}

type UsdaPer100gDocument = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  sugarPer100g: number;
  vitaminAPer100g: number;
  vitaminCPer100g: number;
  vitaminDPer100g: number;
  vitaminEPer100g: number;
  vitaminKPer100g: number;
  b6Per100g: number;
  b12Per100g: number;
  folatePer100g: number;
  thiaminPer100g: number;
  niacinPer100g: number;
  riboflavinPer100g: number;
  calciumPer100g: number;
  ironPer100g: number;
  potassiumPer100g: number;
  magnesiumPer100g: number;
  zincPer100g: number;
  phosphorusPer100g: number;
};

export function nutritionFromUsdaPer100g(document: UsdaPer100gDocument): NutritionFields {
  return {
    b12: document.b12Per100g,
    b6: document.b6Per100g,
    calcium: document.calciumPer100g,
    calories: document.caloriesPer100g,
    carbs: document.carbsPer100g,
    fat: document.fatPer100g,
    fiber: document.fiberPer100g,
    folate: document.folatePer100g,
    iron: document.ironPer100g,
    magnesium: document.magnesiumPer100g,
    niacin: document.niacinPer100g,
    phosphorus: document.phosphorusPer100g,
    potassium: document.potassiumPer100g,
    protein: document.proteinPer100g,
    riboflavin: document.riboflavinPer100g,
    sodium: document.sodiumPer100g,
    sugar: document.sugarPer100g,
    thiamin: document.thiaminPer100g,
    vitaminA: document.vitaminAPer100g,
    vitaminC: document.vitaminCPer100g,
    vitaminD: document.vitaminDPer100g,
    vitaminE: document.vitaminEPer100g,
    vitaminK: document.vitaminKPer100g,
    zinc: document.zincPer100g,
  };
}

export function promoteDraftItemToUsda(
  item: ScanDraftItem,
  usdaFoodId: string,
  per100g: NutritionFields
): ScanDraftItem {
  const nutrition = scaleNutrition(per100g, item.baseEstimatedGrams / 100);

  return {
    ...item,
    baseNutrition: nutrition,
    nutrition,
    per100g,
    source: "usda",
    usdaFoodId,
  };
}
