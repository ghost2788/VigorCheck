import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { palettes, ThemeMode, ThemePaletteId, ThemeTokens } from "./colors";

type ThemeContextValue = {
  paletteId: ThemePaletteId;
  theme: ThemeTokens;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  paletteId: "default",
  theme: palettes.default.dark,
  mode: "dark",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === "light" ? "light" : "dark";
  const paletteId: ThemePaletteId = "default";

  const value = useMemo(
    () => ({
      paletteId,
      theme: palettes[paletteId][mode],
      mode,
    }),
    [mode, paletteId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
