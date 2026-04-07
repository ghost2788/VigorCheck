import {
  getClampedProgressFillPercent,
  getRenderableProgressRatio,
  shouldShowStaticReward,
} from "../../lib/ui/nutrientProgressPresentation";
import { NutrientProgressRow } from "../../lib/domain/nutrientProgress";

function buildRow(overrides: Partial<NutrientProgressRow> = {}): NutrientProgressRow {
  return {
    goalKind: "goal",
    key: "protein",
    label: "Protein",
    percent: 100,
    progressRatio: 1,
    rowKind: "macro",
    target: 150,
    unit: "g",
    value: 150,
    ...overrides,
  };
}

describe("shouldShowStaticReward", () => {
  it.each([
    ["completed goal row rewards", buildRow(), true],
    [
      "completed nutrient goal row rewards",
      buildRow({ key: "fiber", label: "Fiber", rowKind: "nutrient" }),
      true,
    ],
    [
      "calories soft maximum stays plain",
      buildRow({
        goalKind: "soft_maximum",
        key: "calories",
        label: "Calories",
        percent: 100,
        progressRatio: 1,
        target: 2000,
        unit: "kcal",
        value: 2000,
      }),
      false,
    ],
    [
      "maximum rows stay plain above target",
      buildRow({
        goalKind: "maximum",
        key: "sodium",
        label: "Sodium",
        percent: 120,
        progressRatio: 1.2,
        rowKind: "nutrient",
        target: 2300,
        unit: "mg",
        value: 2760,
      }),
      false,
    ],
    [
      "zero-target rows stay default",
      buildRow({
        percent: 0,
        progressRatio: 0,
        target: 0,
        value: 8,
      }),
      false,
    ],
  ])("returns %s", (_label, row, expected) => {
    expect(shouldShowStaticReward(row)).toBe(expected);
  });
});

describe("legacy timeline row fallbacks", () => {
  it("derives a usable progress ratio when the runtime row is missing progressRatio", () => {
    const legacyRow = {
      goalKind: "goal",
      key: "protein",
      label: "Protein",
      percent: 100,
      target: 150,
      unit: "g",
      value: 150,
    } as unknown as NutrientProgressRow;

    expect(getRenderableProgressRatio(legacyRow)).toBe(1);
    expect(shouldShowStaticReward(legacyRow)).toBe(true);
  });
});

describe("getClampedProgressFillPercent", () => {
  it.each([
    [0, 0],
    [0.42, 42],
    [1, 100],
    [1.46, 100],
  ])("clamps %s to %s", (ratio, expected) => {
    expect(getClampedProgressFillPercent(ratio)).toBe(expected);
  });
});
