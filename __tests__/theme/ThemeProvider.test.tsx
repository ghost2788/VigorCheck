import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { colors } from "../../lib/theme/colors";
import {
  THEME_PREFERENCE_STORAGE_KEY,
  ThemeProvider,
  useTheme,
} from "../../lib/theme/ThemeProvider";

const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

function ThemeProbe() {
  const { mode, paletteId, setThemePreference, theme, themePreference } = useTheme();

  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="palette">{paletteId}</Text>
      <Text testID="theme-preference">{themePreference}</Text>
      <Text testID="background">{theme.background}</Text>
      <Text testID="accent">{theme.accent1}</Text>
      <Pressable onPress={() => setThemePreference("light")} testID="set-light">
        <Text>set-light</Text>
      </Pressable>
      <Pressable onPress={() => setThemePreference("dark")} testID="set-dark">
        <Text>set-dark</Text>
      </Pressable>
    </>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    asyncStorage.getItem.mockResolvedValue(null);
    asyncStorage.setItem.mockResolvedValue(undefined);
  });

  it("defaults to dark when no stored preference exists and preserves paletteId", async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
    });

    expect(getByTestId("mode").props.children).toBe("dark");
    expect(getByTestId("palette").props.children).toBe("default");
    expect(getByTestId("theme-preference").props.children).toBe("dark");
    expect(getByTestId("background").props.children).toBe(colors.dark.background);
    expect(getByTestId("accent").props.children).toBe(colors.dark.accent1);
  });

  it("hydrates a stored light preference", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("light");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId("mode").props.children).toBe("light");
    });

    expect(getByTestId("theme-preference").props.children).toBe("light");
    expect(getByTestId("background").props.children).toBe(colors.light.background);
    expect(getByTestId("accent").props.children).toBe(colors.light.accent1);
  });

  it("hydrates a stored dark preference", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("dark");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
    });

    expect(getByTestId("mode").props.children).toBe("dark");
    expect(getByTestId("theme-preference").props.children).toBe("dark");
  });

  it("falls back to dark for an invalid stored preference and overwrites it", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("sepia");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId("mode").props.children).toBe("dark");
    });

    await waitFor(() => {
      expect(asyncStorage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY, "dark");
    });
  });

  it("updates the preference and persists it", async () => {
    asyncStorage.getItem.mockResolvedValueOnce("dark");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
    });

    asyncStorage.setItem.mockClear();

    fireEvent.press(getByTestId("set-light"));

    await waitFor(() => {
      expect(getByTestId("mode").props.children).toBe("light");
    });

    expect(getByTestId("theme-preference").props.children).toBe("light");

    await waitFor(() => {
      expect(asyncStorage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY, "light");
    });
  });

  it("does not write the default dark preference before hydration completes", async () => {
    const deferred = createDeferred<string | null>();
    asyncStorage.getItem.mockReturnValueOnce(deferred.promise);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(asyncStorage.setItem).not.toHaveBeenCalled();

    deferred.resolve(null);

    await waitFor(() => {
      expect(asyncStorage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY, "dark");
    });
  });

  it("supports an explicit initial theme preference without hydrating storage", () => {
    const { getByTestId } = render(
      <ThemeProvider initialThemePreference="light">
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(getByTestId("mode").props.children).toBe("light");
    expect(getByTestId("theme-preference").props.children).toBe("light");
    expect(asyncStorage.getItem).not.toHaveBeenCalled();
    expect(asyncStorage.setItem).not.toHaveBeenCalled();
  });
});
