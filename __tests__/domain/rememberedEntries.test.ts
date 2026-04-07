import {
  buildRememberedEntryFingerprint,
  getLegacyHydrationShortcutInitialFavoritedState,
  isSeededHydrationShortcutSignature,
  resolveHydrationDisplayLabel,
  type RememberedEntrySnapshot,
} from "../../lib/domain/rememberedEntries";

function createStructuredMealSnapshot(
  overrides?: Partial<Extract<RememberedEntrySnapshot, { replayKind: "meal_only" }>>
): Extract<RememberedEntrySnapshot, { replayKind: "meal_only" }> {
  return {
    displayLabel: "Turkey sandwich",
    meal: {
      items: [
        {
          barcodeValue: undefined,
          foodName: "Turkey sandwich",
          nutrition: {
            b12: 0,
            b6: 0,
            calcium: 0,
            calories: 420,
            carbs: 31,
            choline: 0,
            copper: 0,
            fat: 16,
            fiber: 4,
            folate: 0,
            iron: 0,
            magnesium: 0,
            manganese: 0,
            niacin: 0,
            omega3: 0,
            phosphorus: 0,
            potassium: 0,
            protein: 28,
            riboflavin: 0,
            selenium: 0,
            sodium: 540,
            sugar: 5,
            thiamin: 0,
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            zinc: 0,
          },
          portionAmount: 185,
          portionUnit: "g",
          prepMethod: undefined,
          source: "manual",
          usdaFoodId: undefined,
        },
      ],
      mealType: "lunch",
    },
    replayKind: "meal_only",
    ...overrides,
  };
}

describe("rememberedEntries domain helpers", () => {
  it("keeps the same fingerprint for the same canonical structured payload when only labels differ", () => {
    const left = createStructuredMealSnapshot({ displayLabel: "Turkey sandwich" });
    const right = createStructuredMealSnapshot({ displayLabel: "My turkey sandwich" });

    expect(buildRememberedEntryFingerprint(left)).toBe(buildRememberedEntryFingerprint(right));
  });

  it("does not merge meals that differ in richer nutrition even if their core macros match", () => {
    const left = createStructuredMealSnapshot();
    const right = createStructuredMealSnapshot({
      meal: {
        items: [
          {
            ...left.meal.items[0],
            nutrition: {
              ...left.meal.items[0].nutrition,
              fiber: left.meal.items[0].nutrition.fiber + 3,
              sodium: left.meal.items[0].nutrition.sodium + 100,
            },
          },
        ],
        mealType: "lunch",
      },
    });

    expect(buildRememberedEntryFingerprint(left)).not.toBe(buildRememberedEntryFingerprint(right));
  });

  it("treats the exact unused built-in water shortcuts as seeded signatures", () => {
    expect(
      isSeededHydrationShortcutSignature({
        calories: 0,
        carbs: 0,
        category: "water",
        defaultAmountOz: 8,
        fat: 0,
        label: "Water 8 oz",
        logMode: "hydration_only",
        mealType: "drink",
        pinned: true,
        protein: 0,
      })
    ).toBe(true);
  });

  it("does not treat custom water shortcuts as seeded when the signature differs", () => {
    expect(
      isSeededHydrationShortcutSignature({
        calories: 0,
        carbs: 0,
        category: "water",
        defaultAmountOz: 8,
        fat: 0,
        label: "Office water bottle",
        logMode: "hydration_only",
        mealType: "drink",
        pinned: true,
        protein: 0,
      })
    ).toBe(false);
  });

  it("does not preserve legacy hydration shortcut pinned state as a favorite by default", () => {
    expect(getLegacyHydrationShortcutInitialFavoritedState()).toBe(false);
  });

  it("prefers an existing remembered hydration label when shortcutLabel is absent", () => {
    expect(
      resolveHydrationDisplayLabel({
        amountOz: 12,
        rememberedHydrationLabel: "Cold brew",
        shortcutLabel: undefined,
      })
    ).toBe("Cold brew");
  });

  it("falls back to a deterministic water label for plain hydration logs", () => {
    expect(
      resolveHydrationDisplayLabel({
        amountOz: 16,
        rememberedHydrationLabel: undefined,
        shortcutLabel: undefined,
      })
    ).toBe("Water 16 oz");
  });
});
