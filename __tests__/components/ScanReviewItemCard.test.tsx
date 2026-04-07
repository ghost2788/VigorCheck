import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { createEmptyNutrition } from "../../lib/domain/scan";
import { NutrientProgressRow } from "../../lib/domain/nutrientProgress";
import { ScanReviewItemCard } from "../../components/ScanReviewItemCard";

function buildNutritionRow(
  overrides: Pick<NutrientProgressRow, "key" | "label" | "percent" | "target" | "unit" | "value">
): NutrientProgressRow {
  const macroKeys = new Set(["calories", "protein", "carbs", "fat"]);
  const maximumKeys = new Set(["sodium", "sugar"]);

  return {
    goalKind: overrides.key === "calories" ? "soft_maximum" : maximumKeys.has(overrides.key) ? "maximum" : "goal",
    progressRatio: overrides.target > 0 ? overrides.value / overrides.target : 0,
    rowKind: macroKeys.has(overrides.key) ? "macro" : "nutrient",
    ...overrides,
  };
}

const baseItem = {
  baseEstimatedGrams: 40,
  baseNutrition: {
    ...createEmptyNutrition(),
    calories: 190,
    carbs: 6,
    fat: 5,
    protein: 4,
  },
  confidence: "high" as const,
  estimatedGrams: 40,
  id: "item-1",
  multiplier: 1,
  name: "Peanut Butter Dark Chocolate",
  normalizedName: "peanut butter dark chocolate",
  nutrition: {
    ...createEmptyNutrition(),
    calories: 190,
    carbs: 6,
    fat: 5,
    protein: 4,
  },
  portionUnit: "g" as const,
  portionLabel: "1 sandwich",
  source: "barcode_catalog" as const,
};

const nutritionRows: NutrientProgressRow[] = [
  buildNutritionRow({
    key: "calories",
    label: "Calories",
    percent: 10,
    target: 2000,
    unit: "kcal",
    value: 190,
  }),
  buildNutritionRow({
    key: "protein",
    label: "Protein",
    percent: 3,
    target: 150,
    unit: "g",
    value: 4,
  }),
  buildNutritionRow({
    key: "carbs",
    label: "Carbs",
    percent: 2,
    target: 250,
    unit: "g",
    value: 6,
  }),
  buildNutritionRow({
    key: "fat",
    label: "Fat",
    percent: 7,
    target: 67,
    unit: "g",
    value: 5,
  }),
];

describe("ScanReviewItemCard", () => {
  it("renders a collapsed summary and delegates expansion", () => {
    const onToggleExpand = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <ScanReviewItemCard
        expanded={false}
        item={baseItem}
        mealType="snack"
        nutritionRows={nutritionRows}
        onChange={jest.fn()}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={onToggleExpand}
      />
    );

    expect(getByTestId("scan-review-header-toggle-item-1")).toBeTruthy();
    expect(getByTestId("scan-review-item-item-1-collapsed-content")).toBeTruthy();
    expect(queryByTestId("scan-review-item-item-1-expanded-content")).toBeNull();
    expect(getByText("Peanut Butter Dark Chocolate")).toBeTruthy();
    expect(getByText("190 cal")).toBeTruthy();
    expect(getByText("Barcode")).toBeTruthy();
    expect(getByText("1 sandwich")).toBeTruthy();
    expect(getByText("4p / 6c / 5f")).toBeTruthy();

    fireEvent.press(getByTestId("scan-review-header-toggle-item-1"));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it("keeps a multiline rename field and renders one unified nutrition stack", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        mealType="snack"
        nutritionRows={[
          ...nutritionRows,
          buildNutritionRow({
            key: "niacin",
            label: "Niacin",
            percent: 100,
            target: 16,
            unit: "mg",
            value: 16,
          }),
        ]}
        onChange={jest.fn()}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    expect(getByTestId("scan-review-name-input-item-1").props.multiline).toBe(true);
    expect(queryByTestId("scan-review-macro-rows-item-1")).toBeNull();
    expect(queryByTestId("scan-review-detail-rows-item-1")).toBeNull();
    expect(getByText("Calories")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(getByText("Carbs")).toBeTruthy();
    expect(getByText("Fat")).toBeTruthy();
    expect(getByText("Niacin")).toBeTruthy();
    expect(queryByTestId("nutrient-progress-reward-pill-niacin")).toBeNull();
  });

  it("renders direct meal-type and prep-method pills", () => {
    const { getByTestId, getByText } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        mealType="lunch"
        nutritionRows={nutritionRows}
        onChange={jest.fn()}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    expect(getByTestId("scan-review-meal-type-pills-item-1")).toBeTruthy();
    expect(getByTestId("scan-review-prep-options-item-1")).toBeTruthy();
    expect(getByText("Lunch")).toBeTruthy();
    expect(getByText("Grilled")).toBeTruthy();
    expect(getByText("Mixed")).toBeTruthy();
  });

  it("changes meal type from the in-card pill row", () => {
    const onMealTypeChange = jest.fn();
    const { getByTestId } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        mealType="snack"
        nutritionRows={nutritionRows}
        onChange={jest.fn()}
        onMealTypeChange={onMealTypeChange}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    fireEvent.press(getByTestId("scan-review-meal-type-pill-item-1-drink"));
    expect(onMealTypeChange).toHaveBeenCalledWith("drink");
  });

  it("uses low-emphasis text actions spaced across the footer", () => {
    const { getByTestId } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        mealType="snack"
        nutritionRows={nutritionRows}
        onChange={jest.fn()}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    const actionRow = getByTestId("scan-review-actions-item-1");
    expect(StyleSheet.flatten(actionRow.props.style).justifyContent).toBe("space-between");
  });

  it("shows the cleaned-up drink serving row with metric and imperial volume", () => {
    const drinkItem = {
      ...baseItem,
      estimatedGrams: 250,
      nutrition: {
        ...createEmptyNutrition(),
        calories: 113,
        carbs: 28,
        niacin: 8,
        sodium: 100,
      },
      portionLabel: "1 serving from label (1 can (250 ml))",
      portionUnit: "ml" as const,
    };

    const { getByText, queryByText } = render(
      <ScanReviewItemCard
        expanded
        item={drinkItem}
        mealType="drink"
        nutritionRows={[
          buildNutritionRow({
            key: "calories",
            label: "Calories",
            percent: 6,
            target: 2000,
            unit: "kcal",
            value: 113,
          }),
          buildNutritionRow({
            key: "carbs",
            label: "Carbs",
            percent: 11,
            target: 250,
            unit: "g",
            value: 28,
          }),
          buildNutritionRow({
            key: "niacin",
            label: "Niacin",
            percent: 50,
            target: 16,
            unit: "mg",
            value: 8,
          }),
        ]}
        onChange={jest.fn()}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    expect(getByText("1 can")).toBeTruthy();
    expect(getByText("250 ml (8.4 fl oz)")).toBeTruthy();
    expect(getByText("1x")).toBeTruthy();
    expect(queryByText(/^250 ml$/)).toBeNull();
  });

  it("increments and decrements the serving stepper by whole servings", () => {
    const onChange = jest.fn();

    const { getByTestId } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        mealType="snack"
        nutritionRows={nutritionRows}
        onChange={onChange}
        onMealTypeChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    fireEvent.press(getByTestId("scan-review-stepper-increment-item-1"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ multiplier: 2 }));

    fireEvent.press(getByTestId("scan-review-stepper-decrement-item-1"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ multiplier: 1 }));
  });
});
