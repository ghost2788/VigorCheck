import React from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "../../lib/test-utils";
import { ConcentricProgressRings } from "../../components/ConcentricProgressRings";

describe("ConcentricProgressRings", () => {
  it("renders static track and active dots with optional per-dot reward glow halos", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <ConcentricProgressRings
        rings={[
          {
            color: "#E88B5A",
            diameter: 120,
            id: "calories",
            progress: 75,
            rewardGlow: true,
            strokeWidth: 8,
          },
        ]}
        size={120}
      >
        <Text>25</Text>
      </ConcentricProgressRings>
    );

    expect(getByTestId("concentric-ring-layer-calories")).toBeTruthy();
    expect(getByTestId("concentric-ring-track-layer-calories")).toBeTruthy();
    expect(getByTestId("concentric-ring-active-layer-calories")).toBeTruthy();
    expect(getByTestId("concentric-ring-track-segment-calories-0")).toBeTruthy();
    expect(getByTestId("concentric-ring-active-segment-calories-0")).toBeTruthy();
    expect(queryByTestId("concentric-ring-aura-layer-calories")).toBeNull();
    expect(queryByTestId("concentric-ring-aura-segment-calories-0")).toBeNull();
    expect(getByTestId("concentric-ring-reward-glow-calories")).toBeTruthy();
    expect(getByTestId("concentric-ring-reward-glow-segment-calories-0")).toBeTruthy();
    expect(getByTestId("concentric-ring-center-content")).toBeTruthy();
    expect(getByText("25")).toBeTruthy();

    const activeLayerStyle = StyleSheet.flatten(
      getByTestId("concentric-ring-active-layer-calories").props.style
    );
    const activeSegmentStyle = StyleSheet.flatten(
      getByTestId("concentric-ring-active-segment-calories-0").props.style
    );
    const rewardGlowSegmentStyle = StyleSheet.flatten(
      getByTestId("concentric-ring-reward-glow-segment-calories-0").props.style
    );
    const trackSegmentStyle = StyleSheet.flatten(
      getByTestId("concentric-ring-track-segment-calories-0").props.style
    );

    expect(activeLayerStyle?.transform).toBeUndefined();
    expect(trackSegmentStyle?.elevation ?? 0).toBe(0);
    expect(trackSegmentStyle?.shadowOpacity ?? 0).toBe(0);
    expect(trackSegmentStyle?.width).toBe(activeSegmentStyle?.width);
    expect(activeSegmentStyle?.backgroundColor).toBe("#E88B5A");
    expect((rewardGlowSegmentStyle?.width as number) - (activeSegmentStyle?.width as number)).toBe(
      4
    );
    expect(rewardGlowSegmentStyle?.backgroundColor).toBe("rgba(232, 139, 90, 0.24)");
  });

  it("keeps non-Home usages free of reward glow UI by default", () => {
    const { getByTestId, queryByTestId } = render(
      <ConcentricProgressRings
        rings={[
          {
            color: "#4BAE9C",
            diameter: 96,
            id: "hero-protein",
            progress: 100,
            strokeWidth: 10,
          },
        ]}
        size={96}
      >
        <Text>core</Text>
      </ConcentricProgressRings>
    );

    expect(getByTestId("concentric-ring-layer-hero-protein")).toBeTruthy();
    expect(queryByTestId("concentric-ring-reward-glow-hero-protein")).toBeNull();
  });
});
