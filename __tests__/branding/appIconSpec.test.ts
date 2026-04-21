import {
  APP_ICON_BACKGROUND,
  APP_ICON_DOT_COUNT,
  APP_ICON_GLOW_OPACITY,
  APP_ICON_RINGS,
  buildAppIconRingLayouts,
  getAppIconDotAngle,
} from "../../lib/branding/appIconSpec";

describe("appIconSpec", () => {
  it("keeps the approved icon spec values locked to the dashboard ring identity", () => {
    expect(APP_ICON_BACKGROUND).toEqual({
      end: "#15131a",
      start: "#1a1814",
    });
    expect(APP_ICON_DOT_COUNT).toBe(48);
    expect(APP_ICON_GLOW_OPACITY).toBe(0.15);
    expect(APP_ICON_RINGS).toEqual([
      { color: "#d8c49a", dotSizeRatio: 0.02, id: "calories", radiusRatio: 0.4 },
      { color: "#5ebaa9", dotSizeRatio: 0.018, id: "protein", radiusRatio: 0.31 },
      { color: "#78a0c8", dotSizeRatio: 0.015, id: "carbs", radiusRatio: 0.22 },
      { color: "#d38a3a", dotSizeRatio: 0.013, id: "fat", radiusRatio: 0.13 },
    ]);
  });

  it("positions each ring as 48 evenly spaced dots starting at 12 oclock", () => {
    const [caloriesRing] = buildAppIconRingLayouts(200);

    expect(getAppIconDotAngle(0)).toBe(-90);
    expect(getAppIconDotAngle(12)).toBe(0);
    expect(getAppIconDotAngle(24)).toBe(90);
    expect(getAppIconDotAngle(36)).toBe(180);

    expect(caloriesRing.dots).toHaveLength(48);
    expect(caloriesRing.dots[0]).toMatchObject({
      centerX: 100,
      color: "#d8c49a",
      index: 0,
      size: 4,
    });
    expect(caloriesRing.dots[0].centerY).toBeCloseTo(20, 5);
    expect(caloriesRing.dots[12].centerX).toBeCloseTo(180, 5);
    expect(caloriesRing.dots[12].centerY).toBeCloseTo(100, 5);
    expect(caloriesRing.dots[24].centerX).toBeCloseTo(100, 5);
    expect(caloriesRing.dots[24].centerY).toBeCloseTo(180, 5);
  });
});
