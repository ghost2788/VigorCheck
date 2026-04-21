import React from "react";
import { Text } from "react-native";
import { render } from "../../lib/test-utils";
import { Card } from "../../components/Card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(
      <Card>
        <Text>Card content</Text>
      </Card>
    );

    expect(getByText("Card content")).toBeTruthy();
  });

  it("accepts custom style", () => {
    const { getByTestId } = render(
      <Card testID="card" style={{ marginTop: 20 }}>
        <Text>Styled</Text>
      </Card>
    );

    const card = getByTestId("card");
    const flattened = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style)
      : card.props.style;

    expect(flattened.marginTop).toBe(20);
  });
});
