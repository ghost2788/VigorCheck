import { colors } from "../../lib/theme/colors";

const requiredKeys = [
  "background",
  "backgroundGradient",
  "text",
  "textSecondary",
  "textTertiary",
  "textMuted",
  "card",
  "cardBorder",
  "accent1",
  "accent1Start",
  "accent2",
  "accent2Start",
  "accent3",
  "accent3Start",
  "metricCalories",
  "metricProtein",
  "metricHydration",
  "metricNutrition",
  "ringTrack",
  "tabBarBg",
] as const;

describe("color tokens", () => {
  it("dark mode has all required keys", () => {
    for (const key of requiredKeys) {
      expect(colors.dark[key]).toBeDefined();
    }
  });

  it("light mode has all required keys", () => {
    for (const key of requiredKeys) {
      expect(colors.light[key]).toBeDefined();
    }
  });

  it("dark and light have the same keys", () => {
    const darkKeys = Object.keys(colors.dark).sort();
    const lightKeys = Object.keys(colors.light).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it("background gradients have 4 stops", () => {
    expect(colors.dark.backgroundGradient).toHaveLength(4);
    expect(colors.light.backgroundGradient).toHaveLength(4);
  });
});
