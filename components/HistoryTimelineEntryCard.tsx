import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatHistoryTimeLabel, HistoryTimelineEntry } from "../lib/domain/history";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { NutrientSourceTagList } from "./NutrientSourceTagList";
import { ThemedText } from "./ThemedText";

type HistoryTimelineEntryCardProps = {
  entry: HistoryTimelineEntry;
  onDelete: () => void;
  onEdit: () => void;
};

export function HistoryTimelineEntryCard({
  entry,
  onDelete,
  onEdit,
}: HistoryTimelineEntryCardProps) {
  const { mode, theme } = useTheme();
  const destructiveBorder =
    mode === "light" ? "rgba(168, 91, 82, 0.24)" : "rgba(184, 106, 98, 0.24)";
  const destructiveSurface =
    mode === "light" ? "rgba(168, 91, 82, 0.08)" : "rgba(184, 106, 98, 0.08)";
  const destructiveText = mode === "light" ? "#A85B52" : "#B86A62";

  const badgeVariant =
    entry.kind === "hydration"
      ? "accent3"
      : entry.entryMethod === "photo_scan"
        ? "accent2"
        : entry.entryMethod === "ai_text"
          ? "accent1"
          : "secondary";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="xs" variant={badgeVariant}>
            {entry.kind === "hydration" ? "Hydration" : entry.entryMethodLabel}
          </ThemedText>
        </View>
        <ThemedText size="sm" variant="secondary">
          {formatHistoryTimeLabel(entry.timestamp)}
        </ThemedText>
      </View>

      <ThemedText size="md" style={styles.title}>
        {entry.label}
      </ThemedText>

      <View style={styles.metaRow}>
        {entry.kind === "hydration" ? (
          <>
            <ThemedText size="sm">{entry.amountOz} oz</ThemedText>
            <ThemedText size="sm" variant="secondary">
              {entry.amountCups.toFixed(1)} cups
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText size="sm">{entry.calories} cal</ThemedText>
            <ThemedText size="sm" variant="muted">
              {entry.protein}p / {entry.carbs}c / {entry.fat}f
            </ThemedText>
          </>
        )}
      </View>

      {entry.kind === "meal" ? <NutrientSourceTagList sources={entry.topNutrientSources} /> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
          testID="history-timeline-edit-button"
        >
          <ThemedText size="sm">Edit</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={[
            styles.actionButton,
            {
              backgroundColor: destructiveSurface,
              borderColor: destructiveBorder,
            },
          ]}
          testID="history-timeline-delete-button"
        >
          <ThemedText size="sm" style={{ color: destructiveText }}>
            Delete
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actions: {
    columnGap: 10,
    flexDirection: "row",
    marginTop: 14,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaRow: {
    columnGap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    marginBottom: 10,
  },
});
