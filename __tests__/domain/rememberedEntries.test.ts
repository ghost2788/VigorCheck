import {
  buildRememberedEntryFavoriteTogglePatch,
  buildRememberedEntryFingerprint,
  getRememberedEntrySummary,
  getRememberedMealSummaryTotals,
  getLegacyHydrationShortcutInitialFavoritedState,
  getRememberedEntryFavoritedAtSeed,
  isSeededHydrationShortcutSignature,
  resolveHydrationDisplayLabel,
  shouldUsePinnedFavoriteOrdering,
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

  it("uses last used time as the initial pin order seed for legacy favorited rows", () => {
    expect(
      getRememberedEntryFavoritedAtSeed({
        favorited: true,
        favoritedAt: undefined,
        lastUsedAt: 456,
      })
    ).toBe(456);
  });

  it("keeps an existing pin order timestamp when one already exists", () => {
    expect(
      getRememberedEntryFavoritedAtSeed({
        favorited: true,
        favoritedAt: 789,
        lastUsedAt: 456,
      })
    ).toBe(789);
  });

  it("does not seed a pin timestamp for non-favorited rows", () => {
    expect(
      getRememberedEntryFavoritedAtSeed({
        favorited: false,
        favoritedAt: undefined,
        lastUsedAt: 456,
      })
    ).toBeUndefined();
  });

  it("dual-writes lastUsedAt while pinned ordering migration is not yet live", () => {
    expect(
      buildRememberedEntryFavoriteTogglePatch({
        currentFavorited: false,
        migrationVersion: 1,
        now: 123,
      })
    ).toEqual({
      favorited: true,
      favoritedAt: 123,
      lastUsedAt: 123,
    });
  });

  it("writes only the pin timestamp after pinned favorite ordering is live", () => {
    expect(
      buildRememberedEntryFavoriteTogglePatch({
        currentFavorited: false,
        migrationVersion: 2,
        now: 123,
      })
    ).toEqual({
      favorited: true,
      favoritedAt: 123,
    });
  });

  it("turns pinned ordering on once migration version 2 is reached", () => {
    expect(shouldUsePinnedFavoriteOrdering(undefined)).toBe(false);
    expect(shouldUsePinnedFavoriteOrdering(1)).toBe(false);
    expect(shouldUsePinnedFavoriteOrdering(2)).toBe(true);
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

  it("formats meal summaries with meal type, calories, and protein", () => {
    expect(
      getRememberedEntrySummary({
        mealType: "breakfast",
        replayKind: "meal_only",
        totalCalories: 420,
        totalProtein: 18,
      })
    ).toBe("Breakfast • 420 cal • 18g protein");
  });

  it("formats meal and hydration summaries as meal-focused nutrition summaries", () => {
    expect(
      getRememberedEntrySummary({
        beverageKind: "water",
        mealType: "lunch",
        replayKind: "meal_and_hydration",
        totalCalories: 610,
        totalProtein: 37,
      })
    ).toBe("Lunch • 610 cal • 37g protein");
  });

  it("formats water-only hydration summaries without repeating ounces", () => {
    expect(
      getRememberedEntrySummary({
        beverageKind: "water",
        replayKind: "hydration_only",
      })
    ).toBe("Hydration");
  });

  it("formats non-water hydration summaries as drink", () => {
    expect(
      getRememberedEntrySummary({
        beverageKind: "drink",
        replayKind: "hydration_only",
      })
    ).toBe("Drink");
  });

  it("rounds meal summary metrics to whole numbers", () => {
    expect(
      getRememberedEntrySummary({
        mealType: "snack",
        replayKind: "meal_only",
        totalCalories: 220.4,
        totalProtein: 30.2,
      })
    ).toBe("Snack • 220 cal • 30g protein");
  });

  it("aggregates calories and protein totals from remembered meal snapshots", () => {
    expect(
      getRememberedMealSummaryTotals({
        items: [
          createStructuredMealSnapshot().meal.items[0],
          {
            ...createStructuredMealSnapshot().meal.items[0],
            foodName: "Greek yogurt",
            nutrition: {
              ...createStructuredMealSnapshot().meal.items[0].nutrition,
              calories: 123.6,
              protein: 14.4,
            },
          },
        ],
        mealType: "lunch",
      })
    ).toEqual({
      totalCalories: 543.6,
      totalProtein: 42.4,
    });
  });
});
