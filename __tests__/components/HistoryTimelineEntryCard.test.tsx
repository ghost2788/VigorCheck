import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";

describe("HistoryTimelineEntryCard", () => {
  it("renders pill-style edit and delete actions", () => {
    const { getByTestId } = render(
      <HistoryTimelineEntryCard
        entry={{
          calories: 320,
          carbs: 34,
          entryMethod: "photo_scan",
          entryMethodLabel: "FoodScan",
          fat: 9,
          id: "meal-1",
          itemCount: 2,
          kind: "meal",
          label: "Breakfast scan (2 items)",
          mealType: "breakfast",
          protein: 23,
          timestamp: Date.parse("2026-03-29T19:00:00.000Z"),
        }}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(
      StyleSheet.flatten(getByTestId("history-timeline-edit-button").props.style).borderRadius
    ).toBe(999);
    expect(
      StyleSheet.flatten(getByTestId("history-timeline-delete-button").props.style).borderRadius
    ).toBe(999);
    expect(
      StyleSheet.flatten(getByTestId("history-timeline-delete-button").props.style).borderWidth
    ).toBe(1);
  });
});
