import {
  buildProvisionalSupplementFingerprint,
  buildStrongSupplementFingerprint,
  normalizeSupplementActiveIngredients,
  pickSupplementMergeSurvivor,
  supplementNutritionFieldKeys,
} from "../../lib/domain/supplements";

describe("supplement fingerprints", () => {
  it("exposes the full supplement nutrition key list for strict schemas", () => {
    expect(supplementNutritionFieldKeys).toContain("b12");
    expect(supplementNutritionFieldKeys).toContain("vitaminK");
    expect(supplementNutritionFieldKeys).toContain("protein");
    expect(supplementNutritionFieldKeys).toHaveLength(29);
  });

  it("includes nutrition in the strong fingerprint so label variants do not false-merge", () => {
    const activeIngredients = normalizeSupplementActiveIngredients([
      {
        amount: 65,
        name: "Iron",
        unit: "mg",
      },
    ]);

    const left = buildStrongSupplementFingerprint({
      activeIngredients,
      nutritionProfile: {
        iron: 65,
      },
      productName: "Nature Made Iron",
      servingLabel: "1 tablet",
    });
    const right = buildStrongSupplementFingerprint({
      activeIngredients,
      nutritionProfile: {
        iron: 45,
      },
      productName: "Nature Made Iron",
      servingLabel: "1 tablet",
    });

    expect(left).not.toBe(right);
  });

  it("uses a weaker provisional fingerprint for legacy rows without active ingredients", () => {
    expect(
      buildProvisionalSupplementFingerprint({
        nutritionProfile: {
          iron: 65,
        },
        productName: "Nature Made Iron",
        servingLabel: "1 tablet",
      })
    ).toBeTruthy();
  });
});

describe("supplement merge survivor selection", () => {
  it("prefers strong active rows over provisional rows", () => {
    expect(
      pickSupplementMergeSurvivor([
        {
          _creationTime: 10,
          fingerprintKind: "provisional",
          id: "legacy-row",
          status: "active",
        },
        {
          _creationTime: 20,
          fingerprintKind: "strong",
          id: "scanned-row",
          status: "active",
        },
      ])
    ).toBe("scanned-row");
  });

  it("prefers active rows over archived rows before falling back to age", () => {
    expect(
      pickSupplementMergeSurvivor([
        {
          _creationTime: 10,
          fingerprintKind: "strong",
          id: "archived-row",
          status: "archived",
        },
        {
          _creationTime: 20,
          fingerprintKind: "strong",
          id: "active-row",
          status: "active",
        },
      ])
    ).toBe("active-row");
  });
});
