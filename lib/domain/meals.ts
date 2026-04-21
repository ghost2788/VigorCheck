export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

export const MEAL_TYPE_OPTIONS: Array<{ label: string; value: MealType }> = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
  { label: "Drink", value: "drink" },
];

const DRINK_NAME_PATTERNS = [
  /\bwater\b/,
  /\bcoffee\b/,
  /\bcold brew\b/,
  /\blatte\b/,
  /\bespresso\b/,
  /\btea\b/,
  /\bmatcha\b/,
  /\bkombucha\b/,
  /\bjuice\b/,
  /\bsmoothie\b/,
  /\bshake\b/,
  /\bprotein shake\b/,
  /\bsoda\b/,
  /\bcola\b/,
  /\benergy drink\b/,
  /\belectrolyte drink\b/,
  /\bsports drink\b/,
  /\bbeverage\b/,
];

const DRINK_CATEGORY_PATTERNS = [
  /\bbeverages\b/,
  /\bwaters?\b/,
  /\bcoffees?\b/,
  /\bteas?\b/,
  /\bkombuchas?\b/,
  /\bjuices?\b/,
  /\bsmoothies?\b/,
  /\bsoft[-\s]?drinks?\b/,
  /\benergy[-\s]?drinks?\b/,
  /\bsports[-\s]?drinks?\b/,
  /\belectrolyte[-\s]?drinks?\b/,
  /\bprotein[-\s]?drinks?\b/,
  /\bprotein[-\s]?shakes?\b/,
];

function normalizeClassificationText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[_:/-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDrinkLikeName(name?: string) {
  const normalized = normalizeClassificationText(name);

  if (!normalized) {
    return false;
  }

  return DRINK_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isDrinkLikeBarcodeProduct(productName?: string, categoriesTags?: string[]) {
  const normalizedCategories = (categoriesTags ?? []).map((tag) => normalizeClassificationText(tag));

  if (
    normalizedCategories.some((tag) =>
      DRINK_CATEGORY_PATTERNS.some((pattern) => pattern.test(tag))
    )
  ) {
    return true;
  }

  return isDrinkLikeName(productName);
}

export function resolveDraftMealType(args: {
  categoriesTags?: string[];
  itemNames?: string[];
  productName?: string;
  seedMealType: MealType;
  source: "barcode" | "photo" | "text";
}): MealType {
  if (args.source === "barcode") {
    return isDrinkLikeBarcodeProduct(args.productName, args.categoriesTags)
      ? "drink"
      : args.seedMealType;
  }

  const itemNames = (args.itemNames ?? []).map((name) => name.trim()).filter(Boolean);

  if (itemNames.length === 0) {
    return args.seedMealType;
  }

  return itemNames.every((name) => isDrinkLikeName(name)) ? "drink" : args.seedMealType;
}

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
