export type ScanConfidence = "high" | "medium" | "low";
export type ScanItemSource = "ai_estimated" | "manual" | "usda" | "barcode_catalog";
export type ScanPortionUnit = "g" | "ml" | "oz" | "serving";

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
  omega3: number;
  choline: number;
  selenium: number;
  copper: number;
  manganese: number;
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
  portionUnit: ScanPortionUnit;
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

type AssembledFoodKind = "sandwich" | "burger" | "wrap" | "taco" | "toast";

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
  "omega3",
  "choline",
  "selenium",
  "copper",
  "manganese",
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

const DECIMAL_NUTRITION_KEYS = new Set<keyof NutritionFields>([
  "copper",
  "manganese",
  "omega3",
]);

const SANDWICH_FILLING_KEYWORDS = [
  "peanut butter",
  "almond butter",
  "sunflower butter",
  "jelly",
  "jam",
  "preserve",
  "preserves",
  "spread",
  "ham",
  "turkey",
  "chicken",
  "tuna",
  "salad",
  "cheese",
  "nutella",
  "hummus",
  "avocado",
];

const BURGER_PRIMARY_KEYWORDS = [
  "patty",
  "burger",
  "beef",
  "chicken",
  "turkey",
  "veggie",
  "black bean",
];

const BURGER_TOPPING_KEYWORDS = ["cheese", "lettuce", "tomato", "onion", "pickle", "sauce"];

const TOAST_TOPPING_KEYWORDS = [
  "peanut butter",
  "almond butter",
  "jelly",
  "jam",
  "avocado",
  "cream cheese",
  "butter",
  "honey",
  "nutella",
  "spread",
];

const DRINK_KEYWORDS = [
  "coffee",
  "tea",
  "water",
  "juice",
  "smoothie",
  "shake",
  "kombucha",
  "soda",
  "cola",
  "drink",
  "latte",
  "espresso",
];

function roundNutritionValue(key: keyof NutritionFields, value: number) {
  if (DECIMAL_NUTRITION_KEYS.has(key)) {
    return Math.round(value * 10) / 10;
  }

  return Math.round(value);
}

function roundEstimatedGrams(value: number) {
  return Math.round(value);
}

export function createEmptyNutrition(): NutritionFields {
  return {
    b12: 0,
    b6: 0,
    calcium: 0,
    calories: 0,
    carbs: 0,
    choline: 0,
    copper: 0,
    fat: 0,
    fiber: 0,
    folate: 0,
    iron: 0,
    magnesium: 0,
    manganese: 0,
    niacin: 0,
    omega3: 0,
    phosphorus: 0,
    potassium: 0,
    protein: 0,
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

    normalized[key] = roundNutritionValue(key, value);
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
    merged[key] = roundNutritionValue(key, left[key] + right[key]);
  }

  return merged;
}

function highestConfidence(left: ScanConfidence, right: ScanConfidence) {
  return CONFIDENCE_RANK[left] >= CONFIDENCE_RANK[right] ? left : right;
}

function buildDraftId(normalizedName: string, index: number) {
  return `scan-${normalizedName.replace(/\s+/g, "-") || "item"}-${index + 1}`;
}

function normalizedItemText(item: Pick<ScanDraftItem, "name" | "portionLabel" | "prepMethod">) {
  return normalizeFoodName(`${item.name} ${item.portionLabel} ${item.prepMethod ?? ""}`);
}

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeFoodName(keyword)));
}

function isLikelyDrinkComponent(item: ScanDraftItem) {
  return includesAnyKeyword(normalizedItemText(item), DRINK_KEYWORDS);
}

function isSandwichCarrier(item: ScanDraftItem) {
  const text = normalizedItemText(item);
  return !text.includes("toast") && text.includes("bread") && (text.includes("slice") || text.includes("sandwich"));
}

function isSingleServingSandwichCarrier(item: ScanDraftItem) {
  const text = normalizedItemText(item);
  return text.includes("sandwich") || text.includes("2 slice") || text.includes("two slice");
}

function isBurgerCarrier(item: ScanDraftItem) {
  return normalizedItemText(item).includes("bun");
}

function isWrapCarrier(item: ScanDraftItem) {
  const text = normalizedItemText(item);
  return text.includes("wrap") || (text.includes("tortilla") && !text.includes("taco"));
}

function isTacoCarrier(item: ScanDraftItem) {
  const text = normalizedItemText(item);
  return text.includes("taco shell") || text.includes("hard taco shell") || text.includes("soft taco shell");
}

function isToastCarrier(item: ScanDraftItem) {
  return normalizedItemText(item).includes("toast");
}

function getAssembledFoodKind(item: Pick<ScanDraftItem, "name" | "portionLabel" | "prepMethod">) {
  const text = normalizeFoodName(`${item.name} ${item.portionLabel} ${item.prepMethod ?? ""}`);
  const name = normalizeFoodName(item.name);
  const portion = normalizeFoodName(item.portionLabel);

  if (text.includes("sandwich") || portion === "1 sandwich") {
    return "sandwich";
  }

  if (text.includes("burger") || portion === "1 burger") {
    return "burger";
  }

  if (text.includes("wrap") || portion === "1 wrap") {
    return "wrap";
  }

  if (text.includes("taco") || portion === "1 taco") {
    return "taco";
  }

  if ((portion === "1 toast" || name.endsWith(" toast")) && name.split(" ").length > 1) {
    return "toast";
  }

  return null;
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

function buildNormalizedScanDraftComponent(
  item: RawScanModelItem,
  index: number
): ScanDraftItem | null {
  const name = item.name?.trim();
  const portionLabel = item.portionLabel?.trim();
  const normalizedName = normalizeFoodName(name);

  if (!name || !portionLabel || !normalizedName) {
    return null;
  }

  if (
    typeof item.estimatedGrams !== "number" ||
    !Number.isFinite(item.estimatedGrams) ||
    item.estimatedGrams <= 0 ||
    item.estimatedGrams > 1500
  ) {
    return null;
  }

  const normalizedNutrition = normalizeNutrition(item.nutrition);

  if (!normalizedNutrition) {
    return null;
  }

  const estimatedGrams = roundEstimatedGrams(item.estimatedGrams);

  return {
    baseEstimatedGrams: estimatedGrams,
    baseNutrition: normalizedNutrition,
    confidence: item.confidence,
    estimatedGrams,
    id: buildDraftId(normalizedName, index),
    multiplier: 1,
    name,
    normalizedName,
    nutrition: normalizedNutrition,
    portionLabel,
    portionUnit: "g",
    prepMethod: item.prepMethod?.trim() || undefined,
    source: "ai_estimated" as const,
  };
}

export function buildNormalizedScanDraftComponents(items: RawScanModelItem[]) {
  return items
    .map((item, index) => buildNormalizedScanDraftComponent(item, index))
    .filter((item): item is ScanDraftItem => item !== null);
}

function getCombinedPrepMethod(items: ScanDraftItem[]) {
  const prepMethods = Array.from(
    new Set(items.map((item) => item.prepMethod?.trim()).filter((value): value is string => Boolean(value)))
  );

  if (!prepMethods.length) {
    return undefined;
  }

  return prepMethods.length === 1 ? prepMethods[0] : "mixed";
}

function getMergedSource(items: ScanDraftItem[]) {
  const first = items[0];

  if (items.every((item) => item.source === "usda")) {
    return {
      barcodeValue: undefined,
      per100g:
        items.every((item) => item.usdaFoodId && item.usdaFoodId === first.usdaFoodId && item.per100g) &&
        first.per100g
          ? first.per100g
          : undefined,
      source: "usda" as const,
      usdaFoodId:
        items.every((item) => item.usdaFoodId && item.usdaFoodId === first.usdaFoodId)
          ? first.usdaFoodId
          : undefined,
    };
  }

  if (items.every((item) => item.source === "barcode_catalog")) {
    return {
      barcodeValue:
        items.every((item) => item.barcodeValue && item.barcodeValue === first.barcodeValue)
          ? first.barcodeValue
          : undefined,
      per100g: undefined,
      source: "barcode_catalog" as const,
      usdaFoodId: undefined,
    };
  }

  if (items.every((item) => item.source === "manual")) {
    return {
      barcodeValue: undefined,
      per100g: undefined,
      source: "manual" as const,
      usdaFoodId: undefined,
    };
  }

  return {
    barcodeValue: undefined,
    per100g: undefined,
    source: "ai_estimated" as const,
    usdaFoodId: undefined,
  };
}

function createMergedDraftItem(
  items: ScanDraftItem[],
  options: {
    idIndex: number;
    name: string;
    normalizedName?: string;
    portionLabel: string;
    source?: ScanItemSource;
  }
): ScanDraftItem {
  const baseEstimatedGrams = roundEstimatedGrams(
    items.reduce((sum, item) => sum + item.baseEstimatedGrams, 0)
  );
  const baseNutrition = items.reduce(
    (sum, item) => mergeNutrition(sum, item.baseNutrition),
    createEmptyNutrition()
  );
  const normalizedName = options.normalizedName ?? normalizeFoodName(options.name);
  const mergedSource = options.source
    ? {
        barcodeValue: undefined,
        per100g: undefined,
        source: options.source,
        usdaFoodId: undefined,
      }
    : getMergedSource(items);

  return {
    barcodeValue: mergedSource.barcodeValue,
    baseEstimatedGrams,
    baseNutrition,
    confidence: items.reduce(
      (best, item) => highestConfidence(best, item.confidence),
      items[0]?.confidence ?? "medium"
    ),
    estimatedGrams: baseEstimatedGrams,
    id: buildDraftId(normalizedName, options.idIndex),
    multiplier: 1,
    name: options.name,
    normalizedName,
    nutrition: baseNutrition,
    per100g: mergedSource.per100g,
    portionLabel: options.portionLabel,
    portionUnit: items[0]?.portionUnit ?? "g",
    prepMethod: getCombinedPrepMethod(items),
    source: mergedSource.source,
    usdaFoodId: mergedSource.usdaFoodId,
  };
}

function mergeCandidateFillings(items: ScanDraftItem[]) {
  const mergedItems = new Map<string, ScanDraftItem>();

  for (const item of items) {
    const existing = mergedItems.get(item.normalizedName);

    if (!existing) {
      mergedItems.set(item.normalizedName, item);
      continue;
    }

    mergedItems.set(
      item.normalizedName,
      createMergedDraftItem([existing, item], {
        idIndex: 0,
        name: existing.name,
        normalizedName: existing.normalizedName,
        portionLabel: `${roundEstimatedGrams(existing.baseEstimatedGrams + item.baseEstimatedGrams)} g estimated`,
      })
    );
  }

  return Array.from(mergedItems.values());
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripContextTokens(value: string, tokens: string[]) {
  let cleaned = normalizeFoodName(value);

  for (const token of tokens) {
    const normalizedToken = normalizeFoodName(token);
    cleaned = cleaned.replace(new RegExp(`\\b${normalizedToken.replace(/\s+/g, "\\s+")}\\b`, "g"), " ");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

function cleanedDescriptorParts(kind: AssembledFoodKind, items: ScanDraftItem[]) {
  const contextTokensByKind: Record<AssembledFoodKind, string[]> = {
    burger: ["burger", "bun", "inside burger", "filling"],
    sandwich: ["sandwich", "bread", "inside", "spread", "filling"],
    taco: ["taco", "shell", "inside", "filling"],
    toast: ["toast", "on", "spread", "topping"],
    wrap: ["wrap", "tortilla", "inside", "filling"],
  };

  return items
    .map((item) => stripContextTokens(item.name, contextTokensByKind[kind]))
    .map((part) => part.replace(/\bstyle\b/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildAssembledFoodName(kind: AssembledFoodKind, fillings: ScanDraftItem[]) {
  const descriptors = cleanedDescriptorParts(kind, fillings);
  const normalizedDescriptors = descriptors.map((descriptor) => normalizeFoodName(descriptor));
  const joined = (parts: string[], fallback: string) => {
    if (!parts.length) {
      return fallback;
    }

    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return `${parts[0]} and ${parts[1]}`;
    }

    return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  };

  if (
    kind === "sandwich" &&
    normalizedDescriptors.some((descriptor) => descriptor.includes("peanut butter")) &&
    normalizedDescriptors.some(
      (descriptor) => descriptor.includes("jelly") || descriptor.includes("jam")
    )
  ) {
    return "Peanut butter and jelly sandwich";
  }

  if (
    kind === "burger" &&
    normalizedDescriptors.some((descriptor) => descriptor.includes("cheese")) &&
    normalizedDescriptors.some(
      (descriptor) =>
        descriptor.includes("beef") || descriptor.includes("hamburger") || descriptor.includes("patty")
    )
  ) {
    return "Cheeseburger";
  }

  const descriptor = joined(descriptors.map((part) => toTitleCase(part)), "");

  switch (kind) {
    case "burger":
      return descriptor ? `${descriptor} burger` : "Filled burger";
    case "sandwich":
      return descriptor ? `${descriptor} sandwich` : "Filled sandwich";
    case "taco":
      return descriptor ? `${descriptor} taco` : "Filled taco";
    case "toast":
      return descriptor ? `${descriptor} toast` : "Loaded toast";
    case "wrap":
      return descriptor ? `${descriptor} wrap` : "Filled wrap";
    default:
      return "Filled sandwich";
  }
}

function buildAssembledFoodPortionLabel(kind: AssembledFoodKind) {
  switch (kind) {
    case "burger":
      return "1 burger";
    case "sandwich":
      return "1 sandwich";
    case "taco":
      return "1 taco";
    case "toast":
      return "1 toast";
    case "wrap":
      return "1 wrap";
    default:
      return "1 serving";
  }
}

type IndexedDraftItem = {
  index: number;
  item: ScanDraftItem;
};

type AssembledFoodCandidate = {
  fillings: ScanDraftItem[];
  indices: number[];
  items: ScanDraftItem[];
  kind: AssembledFoodKind;
  startIndex: number;
};

function hasSandwichSignal(carriers: IndexedDraftItem[], fillings: ScanDraftItem[]) {
  return (
    carriers.some(({ item }) => normalizedItemText(item).includes("sandwich")) ||
    fillings.some((item) => includesAnyKeyword(normalizedItemText(item), SANDWICH_FILLING_KEYWORDS)) ||
    fillings.some((item) => normalizedItemText(item).includes("inside"))
  );
}

function findSandwichCandidate(items: IndexedDraftItem[]) {
  const carriers = items.filter(({ item }) => isSandwichCarrier(item));

  if (!carriers.length || carriers.length > 2) {
    return null;
  }

  if (carriers.length === 1 && !isSingleServingSandwichCarrier(carriers[0].item)) {
    return null;
  }

  const rawFillings = items.filter(
    ({ item }) =>
      !isSandwichCarrier(item) &&
      !isLikelyDrinkComponent(item) &&
      (normalizedItemText(item).includes("sandwich") ||
        normalizedItemText(item).includes("inside") ||
        includesAnyKeyword(normalizedItemText(item), SANDWICH_FILLING_KEYWORDS))
  );
  const fillings = mergeCandidateFillings(rawFillings.map(({ item }) => item));

  if (!rawFillings.length || !fillings.length || fillings.length > 2 || !hasSandwichSignal(carriers, fillings)) {
    return null;
  }

  const indices = [...carriers.map(({ index }) => index), ...rawFillings.map(({ index }) => index)].sort(
    (left, right) => left - right
  );

  return {
    fillings,
    indices,
    items: items.filter(({ index }) => indices.includes(index)).map(({ item }) => item),
    kind: "sandwich" as const,
    startIndex: Math.min(...indices),
  };
}

function findBurgerCandidate(items: IndexedDraftItem[]) {
  const carriers = items.filter(({ item }) => isBurgerCarrier(item));

  if (carriers.length !== 1) {
    return null;
  }

  const primaryFillings = mergeCandidateFillings(
    items
      .filter(
        ({ item }) =>
          !isBurgerCarrier(item) &&
          !isLikelyDrinkComponent(item) &&
          includesAnyKeyword(normalizedItemText(item), BURGER_PRIMARY_KEYWORDS)
      )
      .map(({ item }) => item)
  );
  const toppings = mergeCandidateFillings(
    items
      .filter(
        ({ item }) =>
          !isBurgerCarrier(item) &&
          !isLikelyDrinkComponent(item) &&
          !includesAnyKeyword(normalizedItemText(item), BURGER_PRIMARY_KEYWORDS) &&
          includesAnyKeyword(normalizedItemText(item), BURGER_TOPPING_KEYWORDS)
      )
      .map(({ item }) => item)
  );

  if (primaryFillings.length !== 1 || toppings.length > 1) {
    return null;
  }

  const candidateItems = items.filter(
    ({ item }) =>
      isBurgerCarrier(item) ||
      includesAnyKeyword(normalizedItemText(item), BURGER_PRIMARY_KEYWORDS) ||
      includesAnyKeyword(normalizedItemText(item), BURGER_TOPPING_KEYWORDS)
  );
  const indices = candidateItems.map(({ index }) => index).sort((left, right) => left - right);

  return {
    fillings: [...primaryFillings, ...toppings],
    indices,
    items: candidateItems.map(({ item }) => item),
    kind: "burger" as const,
    startIndex: Math.min(...indices),
  };
}

function findWrapCandidate(items: IndexedDraftItem[]) {
  const carriers = items.filter(({ item }) => isWrapCarrier(item));

  if (carriers.length !== 1) {
    return null;
  }

  const rawFillings = items.filter(
    ({ item }) => !isWrapCarrier(item) && !isLikelyDrinkComponent(item) && !isTacoCarrier(item)
  );
  const fillings = mergeCandidateFillings(rawFillings.map(({ item }) => item));

  if (fillings.length !== 1) {
    return null;
  }

  const indices = [...carriers.map(({ index }) => index), ...rawFillings.map(({ index }) => index)].sort(
    (left, right) => left - right
  );

  return {
    fillings,
    indices,
    items: items.filter(({ index }) => indices.includes(index)).map(({ item }) => item),
    kind: "wrap" as const,
    startIndex: Math.min(...indices),
  };
}

function findTacoCandidate(items: IndexedDraftItem[]) {
  const carriers = items.filter(({ item }) => isTacoCarrier(item));

  if (carriers.length !== 1) {
    return null;
  }

  const rawFillings = items.filter(
    ({ item }) => !isTacoCarrier(item) && !isLikelyDrinkComponent(item) && !isWrapCarrier(item)
  );
  const fillings = mergeCandidateFillings(rawFillings.map(({ item }) => item));

  if (fillings.length !== 1) {
    return null;
  }

  const indices = [...carriers.map(({ index }) => index), ...rawFillings.map(({ index }) => index)].sort(
    (left, right) => left - right
  );

  return {
    fillings,
    indices,
    items: items.filter(({ index }) => indices.includes(index)).map(({ item }) => item),
    kind: "taco" as const,
    startIndex: Math.min(...indices),
  };
}

function findToastCandidate(items: IndexedDraftItem[]) {
  const carriers = items.filter(({ item }) => isToastCarrier(item));

  if (carriers.length !== 1) {
    return null;
  }

  const rawFillings = items.filter(
    ({ item }) =>
      !isToastCarrier(item) &&
      !isLikelyDrinkComponent(item) &&
      includesAnyKeyword(normalizedItemText(item), TOAST_TOPPING_KEYWORDS)
  );
  const fillings = mergeCandidateFillings(rawFillings.map(({ item }) => item));

  if (!fillings.length || fillings.length > 2) {
    return null;
  }

  const indices = [...carriers.map(({ index }) => index), ...rawFillings.map(({ index }) => index)].sort(
    (left, right) => left - right
  );

  return {
    fillings,
    indices,
    items: items.filter(({ index }) => indices.includes(index)).map(({ item }) => item),
    kind: "toast" as const,
    startIndex: Math.min(...indices),
  };
}

function findNextAssembledFoodCandidate(items: IndexedDraftItem[]) {
  const candidates = [
    findSandwichCandidate(items),
    findBurgerCandidate(items),
    findWrapCandidate(items),
    findTacoCandidate(items),
    findToastCandidate(items),
  ].filter((candidate): candidate is AssembledFoodCandidate => candidate !== null);

  if (!candidates.length) {
    return null;
  }

  return candidates.sort((left, right) => left.startIndex - right.startIndex)[0];
}

function buildAssembledFoodItem(candidate: AssembledFoodCandidate) {
  const name = buildAssembledFoodName(candidate.kind, candidate.fillings);
  const normalizedName = normalizeFoodName(name);

  return createMergedDraftItem(candidate.items, {
    idIndex: candidate.startIndex,
    name,
    normalizedName,
    portionLabel: buildAssembledFoodPortionLabel(candidate.kind),
    source: candidate.items.every((item) => item.source === "usda") ? "usda" : "ai_estimated",
  });
}

export function groupAssembledFoodDraftItems(items: ScanDraftItem[]) {
  const remaining = items.map((item, index) => ({ index, item }));
  const consumed = new Set<number>();
  const mergedByStartIndex = new Map<number, ScanDraftItem>();

  while (true) {
    const available = remaining.filter(({ index }) => !consumed.has(index));
    const candidate = findNextAssembledFoodCandidate(available);

    if (!candidate) {
      break;
    }

    candidate.indices.forEach((index) => consumed.add(index));
    mergedByStartIndex.set(candidate.startIndex, buildAssembledFoodItem(candidate));
  }

  return items.flatMap((item, index) => {
    const merged = mergedByStartIndex.get(index);

    if (merged) {
      return [merged];
    }

    if (consumed.has(index)) {
      return [];
    }

    return [item];
  });
}

export function mergeDuplicateStandaloneDraftItems(items: ScanDraftItem[]) {
  const mergedItems: ScanDraftItem[] = [];
  const mergedItemIndexByName = new Map<string, number>();

  for (const item of items) {
    if (getAssembledFoodKind(item)) {
      mergedItems.push(item);
      continue;
    }

    const existingIndex = mergedItemIndexByName.get(item.normalizedName);

    if (existingIndex === undefined) {
      mergedItemIndexByName.set(item.normalizedName, mergedItems.length);
      mergedItems.push(item);
      continue;
    }

    const existing = mergedItems[existingIndex];
    mergedItems[existingIndex] = createMergedDraftItem([existing, item], {
      idIndex: existingIndex,
      name: existing.name,
      normalizedName: existing.normalizedName,
      portionLabel: `${roundEstimatedGrams(existing.baseEstimatedGrams + item.baseEstimatedGrams)} g estimated`,
    });
  }

  return mergedItems;
}

export function buildNormalizedScanDraftItems(items: RawScanModelItem[]) {
  return mergeDuplicateStandaloneDraftItems(buildNormalizedScanDraftComponents(items));
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
    scaled[key] = roundNutritionValue(key, nutrition[key] * multiplier);
  }

  return scaled;
}

export function scaleNutritionFields(nutrition: NutritionFields, multiplier: number) {
  return scaleNutrition(nutrition, multiplier);
}

export function scaleDraftItem(item: ScanDraftItem, multiplier: number): ScanDraftItem {
  const safeMultiplier = Math.max(0.25, Math.min(4, multiplier));
  const estimatedGrams = roundEstimatedGrams(item.baseEstimatedGrams * safeMultiplier);
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

type CreateDraftItemInput = Omit<
  ScanDraftItem,
  "baseEstimatedGrams" | "baseNutrition" | "id" | "multiplier" | "normalizedName" | "portionUnit" | "source"
> & {
  portionUnit?: ScanPortionUnit;
};

export function createAiEstimatedDraftItem(input: CreateDraftItemInput): ScanDraftItem {
  return {
    ...input,
    baseEstimatedGrams: input.estimatedGrams,
    baseNutrition: input.nutrition,
    id: buildDraftId(normalizeFoodName(input.name), 0),
    multiplier: 1,
    normalizedName: normalizeFoodName(input.name),
    portionUnit: input.portionUnit ?? "g",
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
    portionUnit: input.portionUnit ?? "g",
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
    portionUnit: input.portionUnit ?? "g",
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
    portionUnit: input.portionUnit ?? "g",
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
  omega3Per100g?: number;
  cholinePer100g?: number;
  seleniumPer100g?: number;
  copperPer100g?: number;
  manganesePer100g?: number;
};

export function nutritionFromUsdaPer100g(document: UsdaPer100gDocument): NutritionFields {
  return {
    b12: document.b12Per100g,
    b6: document.b6Per100g,
    calcium: document.calciumPer100g,
    calories: document.caloriesPer100g,
    carbs: document.carbsPer100g,
    choline: document.cholinePer100g ?? 0,
    copper: document.copperPer100g ?? 0,
    fat: document.fatPer100g,
    fiber: document.fiberPer100g,
    folate: document.folatePer100g,
    iron: document.ironPer100g,
    magnesium: document.magnesiumPer100g,
    manganese: document.manganesePer100g ?? 0,
    niacin: document.niacinPer100g,
    omega3: document.omega3Per100g ?? 0,
    phosphorus: document.phosphorusPer100g,
    potassium: document.potassiumPer100g,
    protein: document.proteinPer100g,
    riboflavin: document.riboflavinPer100g,
    selenium: document.seleniumPer100g ?? 0,
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
