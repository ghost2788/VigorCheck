import {
  isDrinkLikeBarcodeProduct,
  isDrinkLikeName,
  resolveDraftMealType,
} from "../../lib/domain/meals";

describe("meal drink classification", () => {
  it("detects beverage-like item names", () => {
    expect(isDrinkLikeName("GT's Synergy Trilogy Kombucha")).toBe(true);
    expect(isDrinkLikeName("Cold brew coffee")).toBe(true);
    expect(isDrinkLikeName("Chicken burrito bowl")).toBe(false);
  });

  it("classifies barcode products from category tags first", () => {
    expect(
      isDrinkLikeBarcodeProduct("Synergy Trilogy", ["en:beverages", "en:kombuchas"])
    ).toBe(true);
  });

  it("falls back to the product name when barcode categories are missing", () => {
    expect(
      resolveDraftMealType({
        categoriesTags: undefined,
        productName: "Fairlife Protein Shake",
        seedMealType: "snack",
        source: "barcode",
      })
    ).toBe("drink");
  });

  it("keeps the seed meal type when a barcode name is ambiguous", () => {
    expect(
      resolveDraftMealType({
        categoriesTags: undefined,
        productName: "Trilogy",
        seedMealType: "snack",
        source: "barcode",
      })
    ).toBe("snack");
  });

  it("only flips photo/text drafts when every detected item is drink-like", () => {
    expect(
      resolveDraftMealType({
        itemNames: ["coffee", "protein shake"],
        seedMealType: "breakfast",
        source: "text",
      })
    ).toBe("drink");

    expect(
      resolveDraftMealType({
        itemNames: ["coffee", "bagel"],
        seedMealType: "breakfast",
        source: "text",
      })
    ).toBe("breakfast");
  });
});
