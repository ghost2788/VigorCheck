import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";
import { NutrientProgressRow } from "../../lib/domain/nutrientProgress";
import { palettes } from "../../lib/theme/colors";

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

const MEAL_ENTRY = {
  calories: 320,
  carbs: 34,
  entryMethod: "photo_scan" as const,
  entryMethodLabel: "FoodScan",
  fat: 9,
  id: "meal-1",
  itemCount: 2,
  kind: "meal" as const,
  label: "Breakfast scan (2 items)",
  mealType: "breakfast" as const,
  protein: 23,
  nutritionRows: [
    buildNutritionRow({
      key: "calories",
      label: "Calories",
      percent: 16,
      target: 2000,
      unit: "kcal",
      value: 320,
    }),
    buildNutritionRow({
      key: "protein",
      label: "Protein",
      percent: 15,
      target: 150,
      unit: "g",
      value: 23,
    }),
    buildNutritionRow({
      key: "carbs",
      label: "Carbs",
      percent: 17,
      target: 200,
      unit: "g",
      value: 34,
    }),
    buildNutritionRow({
      key: "fat",
      label: "Fat",
      percent: 13,
      target: 67,
      unit: "g",
      value: 9,
    }),
    buildNutritionRow({
      key: "niacin",
      label: "Niacin",
      percent: 100,
      target: 16,
      unit: "mg",
      value: 16,
    }),
  ],
  timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
};

const TARGETS = {
  calories: 2000,
  carbs: 200,
  fat: 67,
  protein: 150,
};

describe("HistoryTimelineEntryCard", () => {
  it("renders collapsed state with title and calories", () => {
    const { getByText, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={false}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Breakfast scan (2 items)")).toBeTruthy();
    expect(getByText("320 cal")).toBeTruthy();
    // Edit/Delete should NOT be visible when collapsed
    expect(queryByText("Edit meal")).toBeNull();
    expect(queryByText("Delete")).toBeNull();
  });

  it("renders expanded state with unified nutrition rows and actions", () => {
    const { getByText, queryByTestId, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Calories")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(getByText("Carbs")).toBeTruthy();
    expect(getByText("Fat")).toBeTruthy();
    expect(getByText("Niacin")).toBeTruthy();
    expect(queryByText("Vitamin D 13mcg")).toBeNull();
    expect(queryByTestId("nutrient-progress-divider-calories")).toBeNull();
    expect(queryByTestId("nutrient-progress-divider-niacin")).toBeNull();
    expect(queryByTestId("nutrient-progress-reward-pill-niacin")).toBeNull();
    expect(getByText("Edit meal")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });

  it("calls onToggle when collapsed header is pressed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={false}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={onToggle}
        targets={TARGETS}
      />
    );

    fireEvent.press(getByTestId("history-timeline-entry-toggle"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit and onDelete when action links are pressed", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={true}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    fireEvent.press(getByTestId("history-timeline-edit-button"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId("history-timeline-delete-button"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders hydration entry with oz and cups", () => {
    const { getByText, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          amountCups: 2.0,
          amountOz: 16,
          id: "hydration-1",
          kind: "hydration",
          label: "Water",
          timestamp: Date.parse("2026-03-29T14:00:00.000Z"),
        }}
        isExpanded={false}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Water")).toBeTruthy();
    expect(getByText("16 oz")).toBeTruthy();
    expect(getByText("2.0 cups")).toBeTruthy();
    expect(getByText("Hydration")).toBeTruthy();
    // No progress bars for hydration
    expect(queryByText("Calories")).toBeNull();
  });

  it("renders hydration expanded state with Edit (not Edit meal)", () => {
    const { getByText, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          amountCups: 2.0,
          amountOz: 16,
          id: "hydration-1",
          kind: "hydration",
          label: "Water",
          timestamp: Date.parse("2026-03-29T14:00:00.000Z"),
        }}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
    expect(queryByText("Edit meal")).toBeNull();
    // No progress bars for hydration
    expect(queryByText("Calories")).toBeNull();
  });

  it("renders supplement entries with serving copy and a delete-only expanded state", () => {
    const { getByText, queryByTestId, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          calories: 10,
          carbs: 0,
          fat: 1,
          id: "supplement-log-1",
          kind: "supplement",
          label: "Vitamin D3",
          nutritionRows: [
            buildNutritionRow({
              key: "calories",
              label: "Calories",
              percent: 1,
              target: 2000,
              unit: "kcal",
              value: 10,
            }),
            buildNutritionRow({
              key: "vitaminD",
              label: "Vitamin D",
              percent: 167,
              target: 15,
              unit: "mcg",
              value: 25,
            }),
          ],
          protein: 0,
          servingLabel: "1 softgel",
          timestamp: Date.parse("2026-03-29T14:00:00.000Z"),
        }}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={undefined}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Vitamin D3")).toBeTruthy();
    expect(getByText("1 softgel")).toBeTruthy();
    expect(getByText("Vitamin D")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
    expect(queryByText("Edit")).toBeNull();
    expect(queryByText("Edit meal")).toBeNull();
    expect(queryByTestId("history-timeline-edit-button")).toBeNull();
  });

  it("hides the action row when neither edit nor delete is provided", () => {
    const { getByText, queryByText, queryByTestId } = render(
      <HistoryTimelineEntryCard
        entry={{
          calories: 10,
          carbs: 0,
          fat: 1,
          id: "supplement-log-1",
          kind: "supplement",
          label: "Vitamin D3",
          nutritionRows: [
            buildNutritionRow({
              key: "vitaminD",
              label: "Vitamin D",
              percent: 167,
              target: 15,
              unit: "mcg",
              value: 25,
            }),
          ],
          protein: 0,
          servingLabel: "1 softgel",
          timestamp: Date.parse("2026-03-29T14:00:00.000Z"),
        }}
        isExpanded={true}
        onDelete={undefined}
        onEdit={undefined}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("Vitamin D3")).toBeTruthy();
    expect(queryByText("Delete")).toBeNull();
    expect(queryByText("Edit")).toBeNull();
    expect(queryByText("Edit meal")).toBeNull();
    expect(queryByTestId("history-timeline-edit-button")).toBeNull();
    expect(queryByTestId("history-timeline-delete-button")).toBeNull();
  });

  it("suppresses zero macro fragments in collapsed meal metadata", () => {
    const { getByText, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          ...MEAL_ENTRY,
          carbs: 2,
          fat: 0,
          protein: 0,
        }}
        isExpanded={false}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByText("2c")).toBeTruthy();
    expect(queryByText("23p / 34c / 9f")).toBeNull();
    expect(queryByText("0p / 2c / 0f")).toBeNull();
  });

  it("omits the collapsed macro separator when all meal macros are zero", () => {
    const { queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          ...MEAL_ENTRY,
          carbs: 0,
          fat: 0,
          protein: 0,
        }}
        isExpanded={false}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(queryByText("0p / 0c / 0f")).toBeNull();
  });

  it("shows <1% for tiny nonzero nutrition coverage instead of 0%", () => {
    const { getAllByText, queryByText } = render(
      <HistoryTimelineEntryCard
        entry={{
          ...MEAL_ENTRY,
          calories: 2,
          carbs: 0,
          fat: 0,
          nutritionRows: [
            buildNutritionRow({
              key: "calories",
              label: "Calories",
              percent: 0,
              target: 2723,
              unit: "kcal",
              value: 2,
            }),
            buildNutritionRow({
              key: "sodium",
              label: "Sodium",
              percent: 0,
              target: 2300,
              unit: "mg",
              value: 5,
            }),
          ],
          protein: 0,
        }}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getAllByText("<1%")).toHaveLength(3);
    expect(queryByText("0%")).toBeNull();
  });

  it("describes the top two covered macros and colors those percentages by macro", () => {
    const { getByTestId, queryByTestId } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    expect(getByTestId("history-timeline-insight")).toBeTruthy();
    expect(queryByTestId("history-timeline-insight-percent-protein")).toBeNull();

    const carbsPercent = getByTestId("history-timeline-insight-percent-carbs");
    const caloriesPercent = getByTestId("history-timeline-insight-percent-calories");

    expect(carbsPercent.props.children).toBe("17%");
    expect(caloriesPercent.props.children).toBe("16%");
    expect(StyleSheet.flatten(carbsPercent.props.style).color).toBe(palettes.default.dark.accent1);
    expect(StyleSheet.flatten(caloriesPercent.props.style).color).toBe(
      palettes.default.dark.metricCalories
    );
  });
});
