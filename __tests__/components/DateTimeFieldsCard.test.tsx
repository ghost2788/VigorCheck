import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { DateTimeFieldsCard } from "../../components/DateTimeFieldsCard";

describe("DateTimeFieldsCard", () => {
  it("uses a stronger md-sized card title", () => {
    const { getByTestId } = render(
      <DateTimeFieldsCard
        dateValue="2026-04-06"
        onDateChange={() => {}}
        onTimeChange={() => {}}
        timeValue="09:15"
      />
    );

    expect(StyleSheet.flatten(getByTestId("date-time-fields-card-title").props.style).fontSize).toBe(15);
  });
});
