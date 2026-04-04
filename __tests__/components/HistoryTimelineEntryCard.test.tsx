import React from "react";
import { fireEvent, render } from "../../lib/test-utils";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";

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
  timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
  topNutrientSources: [],
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

  it("renders expanded state with progress bars and actions", () => {
    const { getByText } = render(
      <HistoryTimelineEntryCard
        entry={MEAL_ENTRY}
        isExpanded={true}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onToggle={jest.fn()}
        targets={TARGETS}
      />
    );

    // Progress bar labels should be visible
    expect(getByText("Calories")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(getByText("Carbs")).toBeTruthy();
    expect(getByText("Fat")).toBeTruthy();
    // Action links should be visible
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
});
