import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}

export function Button({ label, onPress, variant = "primary", style }: ButtonProps) {
  const { theme } = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary
            ? `rgba(${hexToRgb(theme.accent1)}, ${pressed ? "0.2" : "0.14"})`
            : theme.card,
          borderColor: isPrimary ? `rgba(${hexToRgb(theme.accent1)}, 0.24)` : theme.cardBorder,
          opacity: pressed ? 0.94 : 1,
        },
        style,
      ]}
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
