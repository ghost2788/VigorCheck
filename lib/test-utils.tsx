import React from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { ThemeProvider } from "./theme/ThemeProvider";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react-native";
export { customRender as render };
