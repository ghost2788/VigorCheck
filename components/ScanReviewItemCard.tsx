import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScanDraftItem, scaleDraftItem } from "../lib/domain/scan";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

const PREP_METHOD_OPTIONS = ["grilled", "baked", "fried", "steamed", "raw", "mixed"] as const;

type ScanReviewItemCardProps = {
  item: ScanDraftItem;
  onChange: (item: ScanDraftItem) => void;
  onRemove: () => void;
};

function Pill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? theme.surfaceStrong : theme.surfaceSoft,
          borderColor: active ? theme.accent1 : theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" variant={active ? "accent1" : "secondary"}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ScanReviewItemCard({ item, onChange, onRemove }: ScanReviewItemCardProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <ThemedText size="xs" variant="tertiary">
            {item.source === "usda" ? "USDA" : item.source === "manual" ? "Manual" : "AI estimate"}
          </ThemedText>
          <ThemedText size="xs" variant="muted">
            {item.confidence}
          </ThemedText>
        </View>
        <Pressable onPress={onRemove}>
          <ThemedText size="xs" variant="accent2">
            Remove
          </ThemedText>
        </Pressable>
      </View>

      <TextInput
        onChangeText={(value) => onChange({ ...item, name: value })}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.nameInput,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
            color: theme.text,
          },
        ]}
        value={item.name}
      />

      <View style={styles.multiplierRow}>
        <View>
          <ThemedText size="xs" variant="tertiary">
            Portion estimate
          </ThemedText>
          <ThemedText size="sm">
            {item.portionLabel} | {item.estimatedGrams}g
          </ThemedText>
        </View>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onChange(scaleDraftItem(item, item.multiplier - 0.25))}
            style={styles.stepperButton}
          >
            <ThemedText size="sm">-</ThemedText>
          </Pressable>
          <ThemedText size="sm">{item.multiplier.toFixed(2)}x</ThemedText>
          <Pressable
            onPress={() => onChange(scaleDraftItem(item, item.multiplier + 0.25))}
            style={styles.stepperButton}
          >
            <ThemedText size="sm">+</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.prepRow}>
        {PREP_METHOD_OPTIONS.map((option) => (
          <Pill
            active={item.prepMethod === option}
            key={option}
            label={option}
            onPress={() => onChange({ ...item, prepMethod: item.prepMethod === option ? undefined : option })}
          />
        ))}
      </View>

      <View style={styles.macroRow}>
        <ThemedText size="sm">{item.nutrition.calories} cal</ThemedText>
        <ThemedText size="sm" variant="secondary">
          P {item.nutrition.protein} | C {item.nutrition.carbs} | F {item.nutrition.fat}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  badges: {
    columnGap: 10,
    flexDirection: "row",
  },
  card: {
    marginBottom: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  macroRow: {
    columnGap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  multiplierRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  nameInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  prepRow: {
    columnGap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    rowGap: 8,
  },
  stepper: {
    alignItems: "center",
    columnGap: 10,
    flexDirection: "row",
  },
  stepperButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
