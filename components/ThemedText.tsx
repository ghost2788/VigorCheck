import React from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";

type Variant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "muted"
  | "accent1"
  | "accent2"
  | "accent3";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

type ThemedTextProps = TextProps & {
  variant?: Variant;
  size?: Size;
  style?: StyleProp<TextStyle>;
};

const sizeMap: Record<Size, TextStyle> = {
  xs: { fontSize: 11, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" },
  sm: { fontSize: 12, fontWeight: "600" },
  md: { fontSize: 15, fontWeight: "500" },
  lg: { fontSize: 18, fontWeight: "500" },
  xl: { fontSize: 28, fontWeight: "300", letterSpacing: -0.8 },
  hero: { fontSize: 64, fontWeight: "300", letterSpacing: -3.2 },
};

export function ThemedText({
  variant = "primary",
  size = "md",
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { theme } = useTheme();

  const colorMap: Record<Variant, string> = {
    primary: theme.text,
    secondary: theme.textSecondary,
    tertiary: theme.textTertiary,
    muted: theme.textMuted,
    accent1: theme.accent1,
    accent2: theme.accent2,
    accent3: theme.accent3,
  };

  return (
    <Text style={[styles.base, sizeMap[size], { color: colorMap[variant] }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: undefined,
  },
});
