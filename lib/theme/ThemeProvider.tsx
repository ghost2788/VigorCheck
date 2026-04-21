import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { palettes, ThemeMode, ThemePaletteId, ThemeTokens } from "./colors";

export type ThemePreference = "dark" | "light";

export const THEME_PREFERENCE_STORAGE_KEY = "vigorcheck:theme-preference";

type ThemeContextValue = {
  paletteId: ThemePaletteId;
  theme: ThemeTokens;
  mode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const DEFAULT_PALETTE_ID: ThemePaletteId = "default";
const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

const ThemeContext = createContext<ThemeContextValue>({
  paletteId: DEFAULT_PALETTE_ID,
  theme: palettes.default.dark,
  mode: DEFAULT_THEME_PREFERENCE,
  themePreference: DEFAULT_THEME_PREFERENCE,
  setThemePreference: () => undefined,
});

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "dark" || value === "light";
}

export function ThemeProvider({
  children,
  initialThemePreference,
}: {
  children: React.ReactNode;
  initialThemePreference?: ThemePreference;
}) {
  const paletteId = DEFAULT_PALETTE_ID;
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    initialThemePreference ?? DEFAULT_THEME_PREFERENCE
  );
  const [isHydrated, setIsHydrated] = useState(Boolean(initialThemePreference));
  const persistedPreferenceRef = useRef<ThemePreference | null>(initialThemePreference ?? null);

  useEffect(() => {
    if (initialThemePreference) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);

        if (cancelled) {
          return;
        }

        if (isThemePreference(storedPreference)) {
          persistedPreferenceRef.current = storedPreference;
          setThemePreferenceState(storedPreference);
          return;
        }

        if (storedPreference !== null) {
          persistedPreferenceRef.current = DEFAULT_THEME_PREFERENCE;
          setThemePreferenceState(DEFAULT_THEME_PREFERENCE);
          await AsyncStorage.setItem(
            THEME_PREFERENCE_STORAGE_KEY,
            DEFAULT_THEME_PREFERENCE
          );
          return;
        }

        persistedPreferenceRef.current = null;
        setThemePreferenceState(DEFAULT_THEME_PREFERENCE);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialThemePreference]);

  useEffect(() => {
    if (initialThemePreference || !isHydrated || persistedPreferenceRef.current === themePreference) {
      return;
    }

    persistedPreferenceRef.current = themePreference;
    void AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, themePreference);
  }, [initialThemePreference, isHydrated, themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
  }, []);

  const mode: ThemeMode = themePreference;

  const value = useMemo(
    () => ({
      paletteId,
      theme: palettes[paletteId][mode],
      mode,
      themePreference,
      setThemePreference,
    }),
    [mode, paletteId, setThemePreference, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
