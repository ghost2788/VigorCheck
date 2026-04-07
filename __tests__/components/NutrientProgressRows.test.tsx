import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import { NutrientProgressRows } from "../../components/NutrientProgressRows";

const ROWS = [
  {
    goalKind: "soft_maximum" as const,
    key: "calories",
    label: "Calories",
    percent: 12,
    progressRatio: 0.12,
    rowKind: "macro" as const,
    target: 2000,
    unit: "kcal",
    value: 240,
  },
  {
    goalKind: "goal" as const,
    key: "protein",
    label: "Protein",
    percent: 18,
    progressRatio: 0.18,
    rowKind: "macro" as const,
    target: 150,
    unit: "g",
    value: 27,
  },
];

describe("NutrientProgressRows", () => {
  it("uses tighter row spacing when dividers are disabled", () => {
    const { getByTestId } = render(<NutrientProgressRows rows={ROWS} showDividers={false} />);

    const firstRowStyle = StyleSheet.flatten(getByTestId("nutrient-progress-row-calories").props.style);
    const secondRowStyle = StyleSheet.flatten(getByTestId("nutrient-progress-row-protein").props.style);

    expect(firstRowStyle.marginTop).toBe(0);
    expect(firstRowStyle.paddingBottom).toBe(0);
    expect(secondRowStyle.marginTop).toBe(10);
    expect(secondRowStyle.paddingBottom).toBe(0);
  });

  it("stays plain by default even for completed rows", () => {
    const { queryByTestId } = render(
      <NutrientProgressRows
        rows={[
          {
            goalKind: "goal",
            key: "fat",
            label: "Fat",
            percent: 100,
            progressRatio: 1,
            rowKind: "macro",
            target: 80,
            unit: "g",
            value: 80,
          },
        ]}
        showDividers={false}
      />
    );

    expect(queryByTestId("nutrient-progress-reward-pill-fat")).toBeNull();
    expect(queryByTestId("nutrient-progress-sheen-fat")).toBeNull();
    expect(queryByTestId("nutrient-progress-status-fat")).toBeNull();
  });

  it("renders static finished styling only for goal rows in static_reward_only mode", () => {
    const { getByTestId, queryByTestId } = render(
      <NutrientProgressRows
        presentationMode="static_reward_only"
        rows={[
          {
            goalKind: "goal",
            key: "vitaminC",
            label: "Vitamin C",
            percent: 120,
            progressRatio: 1.2,
            rowKind: "nutrient",
            target: 90,
            unit: "mg",
            value: 108,
          },
        ]}
        showDividers={false}
      />
    );

    expect(getByTestId("nutrient-progress-reward-pill-vitaminC")).toBeTruthy();
    expect(queryByTestId("nutrient-progress-sheen-vitaminC")).toBeNull();
    expect(queryByTestId("nutrient-progress-status-vitaminC")).toBeNull();
  });

  it("does not reward maximum rows in static_reward_only mode", () => {
    const { queryByTestId } = render(
      <NutrientProgressRows
        presentationMode="static_reward_only"
        rows={[
          {
            goalKind: "maximum",
            key: "sodium",
            label: "Sodium",
            percent: 146,
            progressRatio: 1.46,
            rowKind: "nutrient",
            target: 2300,
            unit: "mg",
            value: 3358,
          },
        ]}
        showDividers={false}
      />
    );

    expect(queryByTestId("nutrient-progress-reward-pill-sodium")).toBeNull();
    expect(queryByTestId("nutrient-progress-status-sodium")).toBeNull();
    expect(queryByTestId("nutrient-progress-pulse-sodium")).toBeNull();
  });

  it("keeps text percent while clamping the visual fill width", () => {
    const { getByTestId, getByText } = render(
      <NutrientProgressRows
        presentationMode="plain"
        rows={[
          {
            goalKind: "maximum",
            key: "sodium",
            label: "Sodium",
            percent: 146,
            progressRatio: 1.46,
            rowKind: "nutrient",
            target: 2300,
            unit: "mg",
            value: 3358,
          },
        ]}
        showDividers={false}
      />
    );

    expect(getByText("146%")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("nutrient-progress-fill-sodium").props.style).width).toBe(
      "100%"
    );
  });

  it("keeps zero-target rows neutral with an empty visual fill", () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <NutrientProgressRows
        presentationMode="static_reward_only"
        rows={[
          {
            goalKind: "goal",
            key: "potassium",
            label: "Potassium",
            percent: 0,
            progressRatio: 0,
            rowKind: "nutrient",
            target: 0,
            unit: "mg",
            value: 320,
          },
        ]}
        showDividers={false}
      />
    );

    expect(getByText("0%")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("nutrient-progress-fill-potassium").props.style).width).toBe(
      "0%"
    );
    expect(queryByTestId("nutrient-progress-reward-pill-potassium")).toBeNull();
  });
});
