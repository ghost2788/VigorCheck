import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatHistoryTimeLabel, HistoryTimelineEntry } from "../lib/domain/history";
import { useTheme } from "../lib/theme/ThemeProvider";
import { NutrientSourceTagList } from "./NutrientSourceTagList";
import { ThemedText } from "./ThemedText";

type MacroTargets = {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
};

type HistoryTimelineEntryCardProps = {
  entry: HistoryTimelineEntry;
  isExpanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  targets: MacroTargets;
};

function formatCompactNumber(value: number) {
  if (value >= 1000) {
    return value.toLocaleString();
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function MacroProgressBar({
  color,
  label,
  target,
  unit,
  value,
}: {
  color: string;
  label: string;
  target: number;
  unit: string;
  value: number;
}) {
  const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <ThemedText size="xs" variant="tertiary">
          {label}
        </ThemedText>
        <ThemedText size="xs" variant="secondary">
          {value} / {formatCompactNumber(target)} {unit} ({percent}%)
        </ThemedText>
      </View>
      <View style={[styles.barTrack, { backgroundColor: hexToRgba(color, 0.12) }]}>
        <View style={[styles.barFill, { backgroundColor: color, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

export function HistoryTimelineEntryCard({
  entry,
  isExpanded,
  onDelete,
  onEdit,
  onToggle,
  targets,
}: HistoryTimelineEntryCardProps) {
  const { mode, theme } = useTheme();
  const destructiveText = mode === "light" ? "#A85B52" : "#B86A62";

  const accentColor =
    entry.kind === "hydration"
      ? theme.accent3
      : entry.entryMethod === "photo_scan"
        ? theme.accent2
        : entry.entryMethod === "ai_text"
          ? theme.accent1
          : theme.textTertiary;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Content wrapper */}
      <View style={styles.contentWrap}>
        {/* Collapsed header - always visible, pressable */}
        <Pressable onPress={onToggle} style={styles.collapsed} testID="history-timeline-entry-toggle">
          <View style={styles.topRow}>
            <ThemedText size="md" style={styles.entryTitle} numberOfLines={1}>
              {entry.label}
            </ThemedText>
            <ThemedText size="sm" style={styles.calLabel}>
              {entry.kind === "hydration" ? `${entry.amountOz} oz` : `${entry.calories} cal`}
            </ThemedText>
            {/* Chevron */}
            <View
              style={[
                styles.chevron,
                {
                  borderColor: theme.textTertiary,
                  transform: [{ rotate: isExpanded ? "-135deg" : "45deg" }],
                },
              ]}
            />
          </View>
          <View style={styles.metaRow}>
            <ThemedText size="xs" variant="tertiary">
              {entry.kind === "hydration" ? "Hydration" : entry.entryMethodLabel}
            </ThemedText>
            <ThemedText size="xs" variant="muted">
              ·
            </ThemedText>
            <ThemedText size="xs" variant="tertiary">
              {formatHistoryTimeLabel(entry.timestamp)}
            </ThemedText>
            {entry.kind === "meal" && (
              <>
                <ThemedText size="xs" variant="muted">
                  ·
                </ThemedText>
                <ThemedText size="xs" variant="muted">
                  {entry.protein}p / {entry.carbs}c / {entry.fat}f
                </ThemedText>
              </>
            )}
            {entry.kind === "hydration" && (
              <>
                <ThemedText size="xs" variant="muted">
                  ·
                </ThemedText>
                <ThemedText size="xs" variant="tertiary">
                  {entry.amountCups.toFixed(1)} cups
                </ThemedText>
              </>
            )}
          </View>
        </Pressable>

        {/* Expanded detail - only when open */}
        {isExpanded && (
          <View style={[styles.expanded, { borderTopColor: theme.cardBorder }]}>
            {entry.kind === "meal" && (
              <>
                {/* Insight line */}
                <ThemedText size="xs" variant="secondary" style={styles.insight}>
                  This meal covered{" "}
                  {Math.round((entry.calories / targets.calories) * 100)}% of your daily
                  calories and{" "}
                  {Math.round((entry.protein / targets.protein) * 100)}% of protein.
                </ThemedText>

                {/* Progress bars */}
                <View style={styles.barGroup}>
                  <MacroProgressBar
                    color={theme.metricCalories}
                    label="Calories"
                    target={targets.calories}
                    unit="kcal"
                    value={entry.calories}
                  />
                  <MacroProgressBar
                    color={theme.metricProtein}
                    label="Protein"
                    target={targets.protein}
                    unit="g"
                    value={entry.protein}
                  />
                  <MacroProgressBar
                    color={theme.accent1}
                    label="Carbs"
                    target={targets.carbs}
                    unit="g"
                    value={entry.carbs}
                  />
                  <MacroProgressBar
                    color={theme.accent2}
                    label="Fat"
                    target={targets.fat}
                    unit="g"
                    value={entry.fat}
                  />
                </View>

                {/* Nutrient source tags */}
                <NutrientSourceTagList sources={entry.topNutrientSources} />
              </>
            )}

            {/* Action links */}
            <View
              style={[
                styles.actionRow,
                entry.kind === "meal"
                  ? {
                      borderTopWidth: 1,
                      borderTopColor: theme.cardBorder,
                      paddingTop: 12,
                      marginTop: 14,
                    }
                  : undefined,
              ]}
            >
              <Pressable onPress={onEdit} testID="history-timeline-edit-button">
                <ThemedText
                  size="xs"
                  style={[styles.actionLink, { color: theme.accent1 }]}
                >
                  {entry.kind === "hydration" ? "Edit" : "Edit meal"}
                </ThemedText>
              </Pressable>
              <Pressable onPress={onDelete} testID="history-timeline-delete-button">
                <ThemedText
                  size="xs"
                  style={[styles.actionLink, { color: destructiveText }]}
                >
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    width: 4,
  },
  actionLink: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barFill: {
    borderRadius: 999,
    height: "100%",
  },
  barGroup: {
    gap: 10,
    marginBottom: 14,
  },
  barHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barRow: {
    gap: 4,
  },
  barTrack: {
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  calLabel: {
    fontWeight: "600",
    marginRight: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  chevron: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    height: 10,
    width: 10,
  },
  collapsed: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contentWrap: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    flex: 1,
    fontWeight: "500",
    marginRight: 10,
  },
  expanded: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  insight: {
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
