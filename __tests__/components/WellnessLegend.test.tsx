import React from "react";
import { render } from "../../lib/test-utils";
import { WellnessLegend } from "../../components/WellnessLegend";

describe("WellnessLegend", () => {
  it("renders the four wellness labels in the approved order", () => {
    const { getAllByTestId } = render(
      <WellnessLegend
        items={[
          { color: "#d8c49a", label: "Calories" },
          { color: "#5ebaa9", label: "Protein" },
          { color: "#78a0c8", label: "Hydration" },
          { color: "#c4a46c", label: "Nutrition" },
        ]}
      />
    );

    expect(getAllByTestId("wellness-legend-label").map((node) => node.props.children)).toEqual([
      "Calories",
      "Protein",
      "Hydration",
      "Nutrition",
    ]);
  });
});
