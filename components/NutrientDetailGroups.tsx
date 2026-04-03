import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";
import { NutrientDetailGroup } from "../lib/domain/nutrients";
import { useTheme } from "../lib/theme/ThemeProvider";

function formatNutrientValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function NutrientDetailGroups({
  accentColor,
  groups,
}: {
  accentColor: string;
  groups?: NutrientDetailGroup[];
}) {
  return (
    <View style={styles.stack}>
      {(groups ?? []).map((group) => (
        <Card key={group.id} style={styles.groupCard}>
          <ThemedText size="sm" style={{ color: accentColor }}>
            {group.title}
          </ThemedText>
          <View style={styles.groupRows}>
            {group.nutrients.map((nutrient) => (
              <NutrientValueRow
                accentColor={accentColor}
                key={nutrient.key}
                label={nutrient.label}
                value={`${formatNutrientValue(nutrient.value)} ${nutrient.unit}`}
              />
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

function NutrientValueRow({
  accentColor,
  label,
  value,
}: {
  accentColor: string;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText variant="secondary">{label}</ThemedText>
      <ThemedText size="sm" style={{ color: accentColor }}>
        {value}
      </ThemedText>
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    bottom: 0,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  groupCard: {
    gap: 12,
  },
  groupRows: {
    gap: 10,
  },
  row: {
    gap: 8,
    paddingBottom: 10,
  },
  stack: {
    gap: 10,
  },
});
