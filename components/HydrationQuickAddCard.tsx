import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type HydrationQuickAddCardProps = {
  onQuickAdd: (amountOz: number) => void;
  title?: string;
};

const OPTIONS = [8, 16, 24];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HydrationQuickAddCard({
  onQuickAdd,
  title = "Water shortcuts",
}: HydrationQuickAddCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <ThemedText size="sm" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.actions}>
        {OPTIONS.map((amountOz) => (
          <Pressable
            accessibilityRole="button"
            key={amountOz}
            onPress={() => onQuickAdd(amountOz)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: hexToRgba(theme.metricHydration, pressed ? 0.22 : 0.14),
                borderColor: hexToRgba(theme.metricHydration, 0.32),
              },
            ]}
          >
            <ThemedText size="sm" style={{ color: theme.metricHydration }}>
              +{amountOz} oz
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  title: {
    marginBottom: 14,
  },
});
