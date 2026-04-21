import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { useReducedMotionPreference } from "../../lib/ui/useReducedMotionPreference";
import { WellnessAccordionList } from "../../components/WellnessAccordionList";

jest.mock("../../lib/ui/useReducedMotionPreference", () => ({
  useReducedMotionPreference: jest.fn(),
}));

const mockUseReducedMotionPreference = jest.mocked(useReducedMotionPreference);

function collectPropsWithKey(node: unknown, key: string, result: Record<string, unknown>[] = []) {
  if (!node) {
    return result;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectPropsWithKey(child, key, result));
    return result;
  }

  if (typeof node === "object") {
    const record = node as {
      children?: unknown;
      props?: Record<string, unknown>;
    };

    if (record.props && Object.prototype.hasOwnProperty.call(record.props, key)) {
      result.push(record.props);
    }

    collectPropsWithKey(record.children, key, result);
  }

  return result;
}

describe("WellnessAccordionList", () => {
  beforeEach(() => {
    mockUseReducedMotionPreference.mockReturnValue(false);
  });

  it("starts collapsed and only keeps one card open at a time", () => {
    const { getByText, queryByText } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Breakfast Plate</Text>,
            headerPercentLabel: "(90%)",
            key: "calories",
            summary: (
              <View>
                <Text>1,800 / 2,000 kcal</Text>
              </View>
            ),
            title: "Calories",
          },
          {
            accentColor: "#78a0c8",
            detail: <Text>16 oz logged</Text>,
            headerPercentLabel: "(50%)",
            key: "hydration",
            summary: (
              <View>
                <Text>2 / 4 cups</Text>
              </View>
            ),
            title: "Hydration",
          },
        ]}
      />
    );

    expect(queryByText("Breakfast Plate")).toBeNull();
    expect(queryByText("16 oz logged")).toBeNull();

    fireEvent.press(getByText("Calories"));

    expect(getByText("Breakfast Plate")).toBeTruthy();
    expect(queryByText("16 oz logged")).toBeNull();

    fireEvent.press(getByText("Hydration"));

    expect(queryByText("Breakfast Plate")).toBeNull();
    expect(getByText("16 oz logged")).toBeTruthy();
  });

  it("runs a header action without toggling the card", () => {
    const onActionPress = jest.fn();
    const { getByText, queryByText } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#78a0c8",
            detail: <Text>Hydration detail</Text>,
            headerActionLabel: "+water",
            headerPercentLabel: "(50%)",
            key: "hydration",
            onHeaderActionPress: onActionPress,
            summary: (
              <View>
                <Text>2 / 4 cups</Text>
              </View>
            ),
            title: "Hydration",
          },
        ]}
      />
    );

    fireEvent.press(getByText("+water"));

    expect(onActionPress).toHaveBeenCalledTimes(1);
    expect(queryByText("Hydration detail")).toBeNull();
  });

  it("renders split summary content without dropping the inline percent", () => {
    const { getByText } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Breakfast Plate</Text>,
            headerPercentLabel: "(11%)",
            key: "calories",
            summary: (
              <View>
                <Text>320 / 3030 kcal</Text>
              </View>
            ),
            title: "Calories",
          },
        ]}
      />
    );

    expect(getByText("320 / 3030 kcal")).toBeTruthy();
    expect(getByText("(11%)")).toBeTruthy();
  });

  it("renders a custom ReactNode header percent label", () => {
    const { getByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Breakfast Plate</Text>,
            headerPercentLabel: <Text testID="custom-header-percent">{"(>100%)"}</Text>,
            key: "calories",
            summary: (
              <View>
                <Text>2001 / 2000 kcal</Text>
              </View>
            ),
            title: "Calories",
          },
        ]}
      />
    );

    expect(getByTestId("custom-header-percent")).toBeTruthy();
  });

  it("treats the header badge as part of the accordion trigger", () => {
    const { getByText, queryByText } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories detail</Text>,
            headerBadge: <Text>Over target</Text>,
            headerPercentLabel: "(105%)",
            key: "calories",
            summary: "2,101 / 2,000 kcal",
            title: "Calories",
          },
        ]}
      />
    );

    expect(queryByText("Calories detail")).toBeNull();

    fireEvent.press(getByText("Over target"));

    expect(getByText("Calories detail")).toBeTruthy();
  });

  it("renders the first warm Heat Chamber tier with mid-shell chamber geometry and no active motion layers", () => {
    const { getByTestId, queryByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warm_1",
            },
            summary: "1,950 / 2,000 kcal",
            title: "Calories",
          },
          {
            accentColor: "#78a0c8",
            detail: <Text>Hydration detail</Text>,
            key: "hydration",
            summary: "2 / 4 cups",
            title: "Hydration",
          },
        ]}
      />
    );

    const cardStyle = StyleSheet.flatten(getByTestId("wellness-accordion-card-calories").props.style);

    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-chamber-core-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-ember-calories")).toBeNull();
    expect(cardStyle.backgroundColor).toBe("rgba(216, 196, 154, 0.03)");
    expect(cardStyle.borderColor).toBe("rgba(216, 196, 154, 0.12)");
    expect(queryByTestId("wellness-accordion-shell-layer-hydration")).toBeNull();
  });

  it("renders the second warm Heat Chamber tier with stronger warmth and no sweep", () => {
    const { getByTestId, queryByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warm_2",
            },
            summary: "1,650 / 2,000 kcal",
            title: "Calories",
          },
        ]}
      />
    );

    const cardStyle = StyleSheet.flatten(getByTestId("wellness-accordion-card-calories").props.style);

    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();
    expect(cardStyle.backgroundColor).toBe("rgba(216, 196, 154, 0.045)");
    expect(cardStyle.borderColor).toBe("rgba(216, 196, 154, 0.16)");
  });

  it("renders the third warm Heat Chamber tier with the full warm motion set before warning", () => {
    const { getByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warm_3",
            },
            summary: "1,995 / 2,000 kcal",
            title: "Calories",
          },
        ]}
      />
    );

    const cardStyle = StyleSheet.flatten(getByTestId("wellness-accordion-card-calories").props.style);

    expect(getByTestId("wellness-accordion-shell-chamber-core-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories")).toBeTruthy();
    expect(cardStyle.backgroundColor).toBe("rgba(216, 196, 154, 0.06)");
    expect(cardStyle.borderColor).toBe("rgba(216, 196, 154, 0.22)");
  });

  it("keeps the default Heat Chamber state quiet without active heat layers", () => {
    const { getByTestId, queryByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "default",
            },
            summary: "1,400 / 2,723 kcal",
            title: "Calories",
          },
        ]}
      />
    );

    const cardStyle = StyleSheet.flatten(getByTestId("wellness-accordion-card-calories").props.style);

    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-default-top-veil-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-default-lower-glow-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-band-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-ember-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-warning-field-calories")).toBeNull();
    expect(queryByTestId("wellness-accordion-shell-warning-pulse-calories")).toBeNull();
    expect(cardStyle.backgroundColor).toBe("rgba(255,255,255,0.035)");
    expect(cardStyle.borderColor).toBe("rgba(255,255,255,0.08)");
  });

  it("renders Heat Chamber warning layers and warning container styling", () => {
    const { getByTestId, queryByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warning",
              warningColor: "#d17a6e",
            },
            summary: "2,101 / 2,000 kcal",
            title: "Calories",
          },
        ]}
      />
    );

    const cardStyle = StyleSheet.flatten(getByTestId("wellness-accordion-card-calories").props.style);

    expect(getByTestId("wellness-accordion-shell-chamber-core-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-layer-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-warning-field-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-warning-pulse-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();
    expect(cardStyle.backgroundColor).toBe("rgba(209, 122, 110, 0.08)");
    expect(cardStyle.borderColor).toBe("rgba(209, 122, 110, 0.24)");
  });

  it("keeps static Heat Chamber styling while disabling motion layers under reduced motion", () => {
    mockUseReducedMotionPreference.mockReturnValue(true);

    const { getByTestId, queryByTestId } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Calories detail</Text>,
            key: "calories",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warm_3",
            },
            summary: "1,980 / 2,000 kcal",
            title: "Calories",
          },
          {
            accentColor: "#d17a6e",
            detail: <Text>Calories warning detail</Text>,
            key: "calories-warning",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warning",
              warningColor: "#d17a6e",
            },
            summary: "2,101 / 2,000 kcal",
            title: "Calories warning",
          },
        ]}
      />
    );

    expect(getByTestId("wellness-accordion-shell-heat-band-calories")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-heat-sweep-calories")).toBeNull();

    expect(getByTestId("wellness-accordion-shell-heat-band-calories-warning")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-ember-calories-warning")).toBeTruthy();
    expect(getByTestId("wellness-accordion-shell-warning-field-calories-warning")).toBeTruthy();
    expect(queryByTestId("wellness-accordion-shell-warning-pulse-calories-warning")).toBeNull();
  });

  it("uses explicit stop opacity in shell gradients to avoid opaque Android bands", () => {
    const { toJSON } = render(
      <WellnessAccordionList
        items={[
          {
            accentColor: "#d8c49a",
            detail: <Text>Calories detail</Text>,
            key: "calories-default",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "default",
            },
            summary: "1,400 / 2,723 kcal",
            title: "Calories default",
          },
          {
            accentColor: "#d8c49a",
            detail: <Text>Calories near target detail</Text>,
            key: "calories-near",
            shellEffect: {
              accentColor: "#d8c49a",
              state: "warm_3",
            },
            summary: "1,995 / 2,000 kcal",
            title: "Calories near",
          },
        ]}
      />
    );

    const stopProps = collectPropsWithKey(toJSON(), "stopColor");

    expect(stopProps.length).toBeGreaterThan(0);
    expect(
      stopProps.some(
        (props) => typeof props.stopColor === "string" && props.stopColor.startsWith("rgba(")
      )
    ).toBe(false);
    expect(
      stopProps.some(
        (props) => typeof props.stopOpacity === "number" && props.stopOpacity >= 0 && props.stopOpacity < 1
      )
    ).toBe(true);
  });
});
