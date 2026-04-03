import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { createEmptyNutrition } from "../../lib/domain/scan";
import { ScanReviewItemCard } from "../../components/ScanReviewItemCard";

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
  portionLabel: "1 serving from label",
  source: "barcode_catalog" as const,
};

describe("ScanReviewItemCard", () => {
  it("renders a collapsed summary and delegates expansion", () => {
    const onToggleExpand = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <ScanReviewItemCard
        expanded={false}
        item={baseItem}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={onToggleExpand}
      />
    );

    expect(getByTestId("scan-review-item-item-1-collapsed-content")).toBeTruthy();
    expect(queryByTestId("scan-review-item-item-1-expanded-content")).toBeNull();

    fireEvent.press(getByTestId("scan-review-toggle-item-1"));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it("keeps prep options hidden until the prep toggle is opened", () => {
    const { getByTestId, queryByText } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    expect(queryByText("grilled")).toBeNull();

    fireEvent.press(getByTestId("scan-review-prep-toggle-item-1"));

    expect(getByTestId("scan-review-prep-options-item-1")).toBeTruthy();
    expect(queryByText("grilled")).toBeTruthy();
  });

  it("uses a multiline name input so long names keep their leading words visible", () => {
    const { getByTestId, getByText } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    expect(getByTestId("scan-review-name-input-item-1").props.multiline).toBe(true);
    expect(getByTestId("scan-review-nutrition-grid-item-1")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(getByText("Carbs")).toBeTruthy();
    expect(getByText("Fiber")).toBeTruthy();
  });

  it("left-aligns the action row under the source label", () => {
    const { getByTestId } = render(
      <ScanReviewItemCard
        expanded
        item={baseItem}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        onToggleExpand={jest.fn()}
      />
    );

    const actionRow = getByTestId("scan-review-actions-item-1");
    expect(StyleSheet.flatten(actionRow.props.style).justifyContent).toBe("flex-start");
  });
});
