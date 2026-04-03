import {
  createBarcodeDraftItem,
  createEmptyNutrition,
  NutritionFields,
  ScanDraftItem,
} from "./scan";

type OpenFoodFactsNutriments = Record<string, number | string | undefined>;

type OpenFoodFactsProduct = {
  brands?: string;
  nutriments?: OpenFoodFactsNutriments;
  product_name?: string;
  product_quantity?: number;
  product_quantity_unit?: string;
  quantity?: string;
  serving_quantity?: number;
  serving_size?: string;
};

type PortionBasis =
  | {
      amount: number;
      label: string;
      per: "serving";
    }
  | {
      amount: number;
      label: string;
      per: "100g";
    };

const SUPPORTED_BARCODE_TYPES = new Set(["ean13", "upc_a"]);

const GRAM_BASED_KEYS = new Set(["carbohydrates", "fat", "fiber", "proteins", "sugars"]);
const MILLIGRAM_BASED_KEYS = new Set([
  "calcium",
  "iron",
  "magnesium",
  "niacin",
  "phosphorus",
  "potassium",
  "sodium",
  "vitamin-c",
  "vitamin-e",
  "zinc",
]);
const MICROGRAM_BASED_KEYS = new Set([
  "folates",
  "vitamin-a",
  "vitamin-b12",
  "vitamin-b6",
  "vitamin-b9",
  "vitamin-d",
  "vitamin-k",
]);

const NUTRIMENT_KEY_MAP: Array<{
  aliases: string[];
  target: keyof NutritionFields;
}> = [
  { aliases: ["proteins"], target: "protein" },
  { aliases: ["carbohydrates"], target: "carbs" },
  { aliases: ["fat"], target: "fat" },
  { aliases: ["fiber"], target: "fiber" },
  { aliases: ["sugars"], target: "sugar" },
  { aliases: ["sodium"], target: "sodium" },
  { aliases: ["vitamin-a"], target: "vitaminA" },
  { aliases: ["vitamin-c"], target: "vitaminC" },
  { aliases: ["vitamin-d"], target: "vitaminD" },
  { aliases: ["vitamin-e"], target: "vitaminE" },
  { aliases: ["vitamin-k"], target: "vitaminK" },
  { aliases: ["vitamin-b6"], target: "b6" },
  { aliases: ["vitamin-b12"], target: "b12" },
  { aliases: ["folates", "vitamin-b9"], target: "folate" },
  { aliases: ["vitamin-b1"], target: "thiamin" },
  { aliases: ["vitamin-pp", "niacin"], target: "niacin" },
  { aliases: ["vitamin-b2"], target: "riboflavin" },
  { aliases: ["calcium"], target: "calcium" },
  { aliases: ["iron"], target: "iron" },
  { aliases: ["potassium"], target: "potassium" },
  { aliases: ["magnesium"], target: "magnesium" },
  { aliases: ["zinc"], target: "zinc" },
  { aliases: ["phosphorus"], target: "phosphorus" },
];

function roundValue(value: number) {
  return Math.round(value);
}

function inferExpectedUnit(key: string) {
  if (GRAM_BASED_KEYS.has(key)) {
    return "g";
  }

  if (MILLIGRAM_BASED_KEYS.has(key)) {
    return "mg";
  }

  if (MICROGRAM_BASED_KEYS.has(key)) {
    return "ug";
  }

  return null;
}

function normalizeUnit(value: unknown, fallbackKey: string) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();

    if (normalized === "µg" || normalized === "mcg") {
      return "ug";
    }

    if (normalized === "mg" || normalized === "g" || normalized === "ug") {
      return normalized;
    }
  }

  return inferExpectedUnit(fallbackKey);
}

function convertUnit({
  expectedUnit,
  unit,
  value,
}: {
  expectedUnit: "g" | "mg" | "ug";
  unit: string | null;
  value: number;
}) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalizedUnit = unit ?? expectedUnit;

  if (normalizedUnit === expectedUnit) {
    return value;
  }

  if (expectedUnit === "g") {
    if (normalizedUnit === "mg") {
      return value / 1000;
    }

    if (normalizedUnit === "ug") {
      return value / 1_000_000;
    }
  }

  if (expectedUnit === "mg") {
    if (normalizedUnit === "g") {
      return value * 1000;
    }

    if (normalizedUnit === "ug") {
      return value / 1000;
    }
  }

  if (expectedUnit === "ug") {
    if (normalizedUnit === "g") {
      return value * 1_000_000;
    }

    if (normalizedUnit === "mg") {
      return value * 1000;
    }
  }

  return null;
}

function parseLeadingAmount(value?: string) {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|mL|oz)\b/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const unit = match[2].toLowerCase();

  if (unit === "oz") {
    return {
      amount: amount * 28.3495,
      display: `${roundValue(amount)} oz`,
    };
  }

  return {
    amount,
    display: `${roundValue(amount)} ${unit === "ml" ? "ml" : "g"}`,
  };
}

function getPackageFallback(product: OpenFoodFactsProduct): PortionBasis | null {
  const quantityFromText = parseLeadingAmount(product.quantity);

  if (quantityFromText) {
    return {
      amount: roundValue(quantityFromText.amount),
      label: `1 package fallback (${quantityFromText.display})`,
      per: "100g",
    };
  }

  if (typeof product.product_quantity === "number" && Number.isFinite(product.product_quantity) && product.product_quantity > 0) {
    const unit = typeof product.product_quantity_unit === "string" ? product.product_quantity_unit.toLowerCase() : "g";
    const display = `${roundValue(product.product_quantity)} ${unit === "ml" ? "ml" : "g"}`;
    const amount = unit === "ml" ? product.product_quantity : product.product_quantity;

    return {
      amount: roundValue(amount),
      label: `1 package fallback (${display})`,
      per: "100g",
    };
  }

  return null;
}

function getPortionBasis(product: OpenFoodFactsProduct): PortionBasis {
  if (
    typeof product.serving_quantity === "number" &&
    Number.isFinite(product.serving_quantity) &&
    product.serving_quantity > 0
  ) {
    const servingSize = product.serving_size?.trim();
    return {
      amount: roundValue(product.serving_quantity),
      label: servingSize
        ? `1 serving from label (${servingSize})`
        : `1 serving from label (${roundValue(product.serving_quantity)} g)`,
      per: "serving",
    };
  }

  const packageFallback = getPackageFallback(product);

  if (packageFallback) {
    return packageFallback;
  }

  return {
    amount: 100,
    label: "100 g fallback serving",
    per: "100g",
  };
}

function getNumericNutriment(nutriments: OpenFoodFactsNutriments, key: string) {
  const value = nutriments[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNutrimentValue({
  amount,
  aliases,
  nutriments,
  per,
}: {
  amount: number;
  aliases: string[];
  nutriments: OpenFoodFactsNutriments;
  per: "100g" | "serving";
}) {
  for (const alias of aliases) {
    if (alias === "energy-kcal") {
      const direct = getNumericNutriment(nutriments, `${alias}_${per}`);

      if (direct !== null) {
        return per === "100g" ? (direct * amount) / 100 : direct;
      }

      if (per === "serving") {
        const per100g = getNumericNutriment(nutriments, `${alias}_100g`);

        if (per100g !== null) {
          return (per100g * amount) / 100;
        }

        const kilojouleServing = getNumericNutriment(nutriments, `energy-kj_${per}`);

        if (kilojouleServing !== null) {
          return kilojouleServing / 4.184;
        }

        const kilojoulePer100g = getNumericNutriment(nutriments, "energy-kj_100g");

        if (kilojoulePer100g !== null) {
          return ((kilojoulePer100g * amount) / 100) / 4.184;
        }
      }

      continue;
    }

    const unit = normalizeUnit(nutriments[`${alias}_unit`], alias);
    const expectedUnit = inferExpectedUnit(alias);
        const direct = getNumericNutriment(nutriments, `${alias}_${per}`);

    if (direct !== null) {
      const normalizedValue = per === "100g" ? (direct * amount) / 100 : direct;

      if (!expectedUnit) {
        return normalizedValue;
      }

      const converted = convertUnit({
        expectedUnit,
        unit,
        value: normalizedValue,
      });

      if (converted !== null) {
        return converted;
      }
    }

    if (per === "serving") {
      const per100g = getNumericNutriment(nutriments, `${alias}_100g`);

      if (per100g !== null) {
        const scaled = (per100g * amount) / 100;

        if (!expectedUnit) {
          return scaled;
        }

        const converted = convertUnit({
          expectedUnit,
          unit,
          value: scaled,
        });

        if (converted !== null) {
          return converted;
        }
      }
    }
  }

  return null;
}

function buildNutrition({
  amount,
  nutriments,
  per,
}: {
  amount: number;
  nutriments: OpenFoodFactsNutriments;
  per: "100g" | "serving";
}) {
  const nutrition = createEmptyNutrition();
  const calories = getNutrimentValue({
    amount,
    aliases: ["energy-kcal"],
    nutriments,
    per,
  });

  if (calories !== null) {
    nutrition.calories = roundValue(calories);
  }

  for (const config of NUTRIMENT_KEY_MAP) {
    const value = getNutrimentValue({
      amount,
      aliases: config.aliases,
      nutriments,
      per,
    });

    if (value !== null) {
      nutrition[config.target] = roundValue(value);
    }
  }

  return nutrition;
}

function hasMeaningfulCore(nutrition: NutritionFields) {
  return (
    nutrition.calories > 0 ||
    nutrition.protein > 0 ||
    nutrition.carbs > 0 ||
    nutrition.fat > 0
  );
}

export function isSupportedBarcodeType(type: string) {
  return SUPPORTED_BARCODE_TYPES.has(type.toLowerCase());
}

export function getSupportedBarcodeTypes() {
  return [...SUPPORTED_BARCODE_TYPES];
}

export function buildBarcodeDraftFromOpenFoodFactsProduct({
  code,
  product,
}: {
  code: string;
  product: OpenFoodFactsProduct;
}): ScanDraftItem | null {
  const name = product.product_name?.trim();
  const nutriments = product.nutriments;

  if (!name || !nutriments) {
    return null;
  }

  const portion = getPortionBasis(product);
  const nutrition = buildNutrition({
    amount: portion.amount,
    nutriments,
    per: portion.per,
  });

  if (!hasMeaningfulCore(nutrition)) {
    return null;
  }

  return createBarcodeDraftItem({
    barcodeValue: code,
    confidence: "high",
    estimatedGrams: portion.amount,
    name,
    nutrition,
    portionLabel: portion.label,
    prepMethod: undefined,
  });
}
