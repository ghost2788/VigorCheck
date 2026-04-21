import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type ButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: "primary" | "secondary";
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}

export function Button({
  disabled = false,
  label,
  onPress,
  style,
  testID,
  variant = "primary",
}: ButtonProps) {
  const { theme } = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary
            ? `rgba(${hexToRgb(theme.accent1)}, ${pressed ? "0.2" : "0.14"})`
            : theme.card,
          borderColor: isPrimary ? `rgba(${hexToRgb(theme.accent1)}, 0.24)` : theme.cardBorder,
          opacity: disabled ? 0.45 : pressed ? 0.94 : 1,
        },
        style,
      ]}
      testID={testID}
    >
      <ThemedText variant={isPrimary ? "accent1" : "primary"} size="sm" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  label: {
    alignSelf: "stretch",
    letterSpacing: 0.8,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
