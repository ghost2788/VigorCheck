import React from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { ThemePreference, ThemeProvider } from "./theme/ThemeProvider";

type CustomRenderOptions = RenderOptions & {
  hydrateTheme?: boolean;
  initialThemePreference?: ThemePreference;
};

const customRender = (
  ui: React.ReactElement,
  {
    hydrateTheme = false,
    initialThemePreference = "dark",
    ...options
  }: CustomRenderOptions = {}
) => {
  function AllProviders({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider
        initialThemePreference={hydrateTheme ? undefined : initialThemePreference}
      >
        {children}
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: AllProviders, ...options });
};

export * from "@testing-library/react-native";
export { customRender as render };
