import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ReminderSummaryItem } from "../lib/domain/profileSettings";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ProfileReminderSummaryProps = {
  items: ReminderSummaryItem[];
  onPress: () => void;
  windowLabel: string;
};

export function ProfileReminderSummary({
  items,
  onPress,
  windowLabel,
}: ProfileReminderSummaryProps) {
  const { theme } = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <ThemedText size="lg" style={styles.title}>
            Notifications
          </ThemedText>
          <View style={styles.actionRow}>
            <ThemedText size="sm" variant="accent1">
              Edit
            </ThemedText>
            <Ionicons color={theme.accent1} name="chevron-forward" size={16} />
          </View>
        </View>

        {items.map((item) => (
          <View key={item.label} style={styles.reminderRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: item.enabled ? theme.accent1 : theme.textMuted,
                },
              ]}
            />
            <ThemedText
              size="sm"
              style={styles.reminderLabel}
              variant={item.enabled ? "primary" : "tertiary"}
            >
              {item.label}
            </ThemedText>
            <ThemedText size="sm" variant="secondary">
              {item.enabled ? "On" : "Off"}
            </ThemedText>
          </View>
        ))}

        <View style={[styles.windowRow, { borderTopColor: theme.cardBorder }]}>
          <ThemedText size="sm" variant="tertiary">
            {windowLabel}
          </ThemedText>
        </View>
      </Card>
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
    gap: 0,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  reminderLabel: {
    flex: 1,
  },
  reminderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
  },
  windowRow: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
});
