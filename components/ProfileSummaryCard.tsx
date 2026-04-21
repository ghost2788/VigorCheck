import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SummaryItem } from "../lib/domain/profileSettings";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ProfileSummaryCardProps = {
  actionLabel?: string;
  items: SummaryItem[];
  onPress?: () => void;
  title: string;
};

export function ProfileSummaryCard({
  actionLabel,
  items,
  onPress,
  title,
}: ProfileSummaryCardProps) {
  const { theme } = useTheme();

  const content = (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText size="lg" style={styles.title}>
          {title}
        </ThemedText>

        {actionLabel ? (
          <View style={styles.actionRow}>
            <ThemedText size="sm" variant="accent1">
              {actionLabel}
            </ThemedText>
            <Ionicons color={theme.accent1} name="chevron-forward" size={16} />
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <ThemedText size="xs" variant="tertiary" style={styles.label}>
              {item.label}
            </ThemedText>
            <ThemedText size="sm">{item.value}</ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginLeft: 16,
  },
  card: {
    gap: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  item: {
    gap: 4,
    minWidth: "47%",
  },
  label: {
    marginBottom: 2,
  },
  title: {
    flex: 1,
  },
});
