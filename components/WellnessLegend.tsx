import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type WellnessLegendItem = {
  color: string;
  label: string;
};

type WellnessLegendProps = {
  items: WellnessLegendItem[];
};

export function WellnessLegend({ items }: WellnessLegendProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <ThemedText
            testID="wellness-legend-label"
            variant="secondary"
            size="sm"
            style={[styles.label, { color: theme.textSecondary }]}
          >
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    columnGap: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: 8,
  },
  dot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  label: {
    textTransform: "none",
  },
  legendItem: {
    alignItems: "center",
    columnGap: 7,
    flexDirection: "row",
  },
});
