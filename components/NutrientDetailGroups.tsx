import React from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";
import { NutrientDetailGroup } from "../lib/domain/nutrients";
import { useTheme } from "../lib/theme/ThemeProvider";

function formatNutrientValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
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
                percent={nutrient.percent}
                target={nutrient.target}
                unit={nutrient.unit}
                value={nutrient.value}
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
  percent,
  target,
  unit,
  value,
}: {
  accentColor: string;
  label: string;
  percent: number;
  target: number;
  unit: string;
  value: number;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <ThemedText>{label}</ThemedText>
        <ThemedText size="sm" style={{ color: accentColor }}>
          {formatPercent(percent)}
        </ThemedText>
      </View>
      <ThemedText size="xs" variant="secondary">
        {formatNutrientValue(value)} / {formatNutrientValue(target)} {unit}
      </ThemedText>
      <View style={[styles.track, { backgroundColor: theme.surfaceSoft }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: accentColor,
              width: `${clampPercent(percent)}%`,
            },
          ]}
        />
      </View>
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
  fill: {
    borderRadius: 999,
    height: "100%",
  },
  groupCard: {
    gap: 12,
  },
  groupRows: {
    gap: 12,
  },
  row: {
    gap: 6,
    paddingBottom: 12,
  },
  rowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stack: {
    gap: 10,
  },
  track: {
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
});
