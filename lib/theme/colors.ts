export type ThemeMode = "dark" | "light";
export type ThemePaletteId = "default";

export type ThemeTokens = {
  metricCalories: string;
  metricCarbs: string;
  metricFat: string;
  metricHydration: string;
  metricHydrationSupport: string;
  metricNutrition: string;
  metricNutritionSupport: string;
  metricProtein: string;
  background: string;
  backgroundGradient: [string, string, string, string];
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  card: string;
  cardBorder: string;
  accent1: string;
  accent1Start: string;
  accent2: string;
  accent2Start: string;
  accent3: string;
  accent3Start: string;
  ringTrack: string;
  tabBarBg: string;
  surfaceStrong: string;
  surfaceSoft: string;
  shadow: string;
  outline: string;
};

export const palettes: Record<ThemePaletteId, Record<ThemeMode, ThemeTokens>> = {
  default: {
    dark: {
      background: "#1a1814",
      backgroundGradient: ["#1a1814", "#15131a", "#171518", "#1a1715"],
      text: "#e8e0d4",
      textSecondary: "rgba(255,255,255,0.45)",
      textTertiary: "rgba(255,255,255,0.28)",
      textMuted: "rgba(255,255,255,0.16)",
      card: "rgba(255,255,255,0.035)",
      cardBorder: "rgba(255,255,255,0.08)",
      accent1: "#5ebaa9",
      accent1Start: "#4db8a4",
      accent2: "#c4a46c",
      accent2Start: "#b8965a",
      accent3: "#78a0c8",
      accent3Start: "#6a9ec0",
      metricCalories: "#d8c49a",
      metricCarbs: "#78a0c8",
      metricFat: "#d38a3a",
      metricProtein: "#5ebaa9",
      metricHydration: "#5ea7c6",
      metricHydrationSupport: "#5ea7c6",
      metricNutrition: "#a59a63",
      metricNutritionSupport: "#a59a63",
      ringTrack: "rgba(255,255,255,0.035)",
      tabBarBg: "rgba(20,18,16,0.96)",
      surfaceStrong: "rgba(255,255,255,0.05)",
      surfaceSoft: "rgba(255,255,255,0.025)",
      shadow: "rgba(0,0,0,0.4)",
      outline: "rgba(255,255,255,0.06)",
    },
    light: {
      background: "#ece7df",
      backgroundGradient: ["#f5f2ed", "#f0eee8", "#f3f1ec", "#ece7df"],
      text: "#2a2520",
      textSecondary: "rgba(42,37,32,0.56)",
      textTertiary: "rgba(42,37,32,0.38)",
      textMuted: "rgba(42,37,32,0.22)",
      card: "rgba(255,255,255,0.8)",
      cardBorder: "rgba(68,55,37,0.12)",
      accent1: "#3a9e8a",
      accent1Start: "#319380",
      accent2: "#b8965a",
      accent2Start: "#a8873e",
      accent3: "#6090c0",
      accent3Start: "#5082b4",
      metricCalories: "#c2aa78",
      metricCarbs: "#6090c0",
      metricFat: "#bb7427",
      metricProtein: "#3a9e8a",
      metricHydration: "#4a8db1",
      metricHydrationSupport: "#4a8db1",
      metricNutrition: "#97864a",
      metricNutritionSupport: "#97864a",
      ringTrack: "rgba(68,55,37,0.08)",
      tabBarBg: "rgba(245,242,237,0.97)",
      surfaceStrong: "rgba(255,255,255,0.88)",
      surfaceSoft: "rgba(255,255,255,0.82)",
      shadow: "rgba(91,71,44,0.08)",
      outline: "rgba(68,55,37,0.08)",
    },
  },
};

export const colors = palettes.default;
