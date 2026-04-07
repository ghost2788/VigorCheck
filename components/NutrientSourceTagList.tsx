import React from "react";
import { StyleSheet, View } from "react-native";
import { NutrientSourceTag } from "../lib/domain/nutrients";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type NutrientSourceTagListProps = {
  sources?: NutrientSourceTag[];
};

function formatTagValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function NutrientSourceTagList({ sources = [] }: NutrientSourceTagListProps) {
  const { theme } = useTheme();

  if (sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {sources.map((source) => (
        <View
          key={source.key}
          style={[
            styles.tag,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="xs">
            {source.label} {formatTagValue(source.value)}
            {source.unit}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
