import {
  getActiveRingSegments,
  getRingStrokeDashoffset,
  normalizeProgress,
} from "../../lib/domain/progress";

describe("progress helpers", () => {
  it("treats zero progress as an empty ring", () => {
    const radius = 100;
    const circumference = 2 * Math.PI * radius;

    expect(normalizeProgress(0)).toBe(0);
    expect(getRingStrokeDashoffset(0, radius)).toBeCloseTo(circumference, 5);
  });

  it("clamps invalid progress values into the 0 to 100 range", () => {
    const radius = 40;

    expect(normalizeProgress(-18)).toBe(0);
    expect(normalizeProgress(143)).toBe(100);
    expect(getActiveRingSegments(143, 48)).toBe(48);
    expect(getRingStrokeDashoffset(100, radius)).toBeCloseTo(0, 5);
  });
});
