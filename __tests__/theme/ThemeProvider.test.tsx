import React from "react";
import * as ReactNative from "react-native";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { colors } from "../../lib/theme/colors";
import { ThemeProvider, useTheme } from "../../lib/theme/ThemeProvider";

function ThemeConsumer() {
  const { theme, mode, paletteId } = useTheme();

  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="palette">{paletteId}</Text>
      <Text testID="background">{theme.background}</Text>
      <Text testID="accent">{theme.accent1}</Text>
    </>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("provides dark theme when the system is dark", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId("mode").props.children).toBe("dark");
    expect(getByTestId("palette").props.children).toBe("default");
    expect(getByTestId("background").props.children).toBe(colors.dark.background);
    expect(getByTestId("accent").props.children).toBe(colors.dark.accent1);
  });

  it("provides light theme when the system is light", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId("mode").props.children).toBe("light");
    expect(getByTestId("palette").props.children).toBe("default");
    expect(getByTestId("background").props.children).toBe(colors.light.background);
    expect(getByTestId("accent").props.children).toBe(colors.light.accent1);
  });

  it("defaults to dark when the system preference is unavailable", () => {
    jest
      .spyOn(ReactNative, "useColorScheme")
      .mockReturnValue(undefined as unknown as ReactNative.ColorSchemeName);

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(getByTestId("mode").props.children).toBe("dark");
  });
});
