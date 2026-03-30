import React from "react";
import { Text, View } from "react-native";
import { fireEvent, render } from "../../lib/test-utils";
import { WellnessAccordionList } from "../../components/WellnessAccordionList";

describe("WellnessAccordionList", () => {
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
});
