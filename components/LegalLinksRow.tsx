import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { legalLinkOrder, legalLinks, openLegalLink } from "../lib/config/legalLinks";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

export function LegalLinksRow({
  style,
  testID,
  textVariant = "secondary",
}: {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  textVariant?: "secondary" | "tertiary";
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, style]} testID={testID}>
      {legalLinkOrder.map((key) => (
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          key={key}
          onPress={() => void openLegalLink(key)}
          testID={testID ? `${testID}-${key}` : undefined}
        >
          <ThemedText size="sm" style={{ color: theme.accent1 }} variant={textVariant}>
            {legalLinks[key].label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },
});
