import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatHistoryTimeLabel, HistoryTimelineEntry } from "../lib/domain/history";
import { useTheme } from "../lib/theme/ThemeProvider";
import { NutrientProgressRows } from "./NutrientProgressRows";
import { ThemedText } from "./ThemedText";

type MacroTargets = {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
};

type MacroCoverageHighlight = {
  key: keyof MacroTargets;
  label: string;
  percent: number;
  percentLabel: string;
  rawPercent: number;
};

type HistoryTimelineEntryCardProps = {
  entry: HistoryTimelineEntry;
  isExpanded: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onToggle: () => void;
  targets: MacroTargets;
};

function formatCollapsedMacroSummary(entry: Extract<HistoryTimelineEntry, { kind: "meal" }>) {
  const parts = [
    entry.protein > 0 ? `${entry.protein}p` : null,
    entry.carbs > 0 ? `${entry.carbs}c` : null,
    entry.fat > 0 ? `${entry.fat}f` : null,
  ].filter((part): part is string => part !== null);

  return parts.length ? parts.join(" / ") : null;
}

function formatInsightPercent(percent: number, rawPercent: number) {
  if (percent === 0 && rawPercent > 0) {
    return "<1%";
  }

  return `${percent}%`;
}

function buildMacroCoverageHighlights(
  entry: Extract<HistoryTimelineEntry, { kind: "meal" }>,
  targets: MacroTargets
): MacroCoverageHighlight[] {
  const macroOrder: Array<keyof MacroTargets> = ["calories", "protein", "carbs", "fat"];
  const macros: Array<{ key: keyof MacroTargets; label: string; target: number; value: number }> = [
    {
      key: "calories",
      label: "calories",
      target: targets.calories,
      value: entry.calories,
    },
    {
      key: "protein",
      label: "protein",
      target: targets.protein,
      value: entry.protein,
    },
    {
      key: "carbs",
      label: "carbs",
      target: targets.carbs,
      value: entry.carbs,
    },
    {
      key: "fat",
      label: "fat",
      target: targets.fat,
      value: entry.fat,
    },
  ];

  return macros
    .map((macro) => {
      const rawPercent =
        Number.isFinite(macro.target) && macro.target > 0 ? (macro.value / macro.target) * 100 : 0;
      const percent =
        Number.isFinite(macro.target) && macro.target > 0 ? Math.round(rawPercent) : 0;

      return {
        key: macro.key,
        label: macro.label,
        percent,
        percentLabel: formatInsightPercent(percent, rawPercent),
        rawPercent,
      };
    })
    .filter((macro) => macro.rawPercent > 0)
    .sort((left, right) => {
      if (right.rawPercent !== left.rawPercent) {
        return right.rawPercent - left.rawPercent;
      }

      return macroOrder.indexOf(left.key) - macroOrder.indexOf(right.key);
    })
    .slice(0, 2);
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
      : entry.kind === "supplement"
        ? theme.metricNutrition
      : entry.entryMethod === "photo_scan"
        ? theme.accent2
        : entry.entryMethod === "ai_text"
          ? theme.accent1
          : theme.textTertiary;
  const mealMacroSummary = entry.kind === "meal" ? formatCollapsedMacroSummary(entry) : null;
  const insightHighlights = entry.kind === "meal" ? buildMacroCoverageHighlights(entry, targets) : [];
  const insightColorByKey: Record<keyof MacroTargets, string> = {
    calories: theme.metricCalories,
    carbs: theme.accent1,
    fat: theme.accent2,
    protein: theme.metricProtein,
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.contentWrap}>
        <Pressable onPress={onToggle} style={styles.collapsed} testID="history-timeline-entry-toggle">
          <View style={styles.topRow}>
            <ThemedText numberOfLines={1} size="md" style={styles.entryTitle}>
              {entry.label}
            </ThemedText>
            <ThemedText size="sm" style={styles.calLabel}>
              {entry.kind === "hydration" ? `${entry.amountOz} oz` : `${entry.calories} cal`}
            </ThemedText>
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
              {entry.kind === "hydration"
                ? "Hydration"
                : entry.kind === "supplement"
                  ? entry.servingLabel
                  : entry.entryMethodLabel}
            </ThemedText>
            <ThemedText size="xs" variant="muted">
              ·
            </ThemedText>
            <ThemedText size="xs" variant="tertiary">
              {formatHistoryTimeLabel(entry.timestamp)}
            </ThemedText>
            {entry.kind === "meal" && mealMacroSummary ? (
              <>
                <ThemedText size="xs" variant="muted">
                  ·
                </ThemedText>
                <ThemedText size="xs" variant="muted">
                  {mealMacroSummary}
                </ThemedText>
              </>
            ) : null}
            {entry.kind === "hydration" ? (
              <>
                <ThemedText size="xs" variant="muted">
                  ·
                </ThemedText>
                <ThemedText size="xs" variant="tertiary">
                  {entry.amountCups.toFixed(1)} cups
                </ThemedText>
              </>
            ) : null}
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={[styles.expanded, { borderTopColor: theme.cardBorder }]}>
            {entry.kind === "meal" || entry.kind === "supplement" ? (
              <>
                {entry.kind === "meal" && insightHighlights.length ? (
                  <ThemedText
                    size="xs"
                    style={styles.insight}
                    testID="history-timeline-insight"
                    variant="secondary"
                  >
                    This meal covered{" "}
                    {insightHighlights.map((highlight, index) => (
                      <React.Fragment key={highlight.key}>
                        {index > 0 ? " and " : null}
                        <ThemedText
                          size="xs"
                          style={{ color: insightColorByKey[highlight.key] }}
                          testID={`history-timeline-insight-percent-${highlight.key}`}
                        >
                          {highlight.percentLabel}
                        </ThemedText>
                        {" of your daily "}
                        {highlight.label}
                      </React.Fragment>
                    ))}
                    .
                  </ThemedText>
                ) : null}

                <NutrientProgressRows
                  getAccentColor={(row) => {
                    if (row.key === "calories") {
                      return theme.metricCalories;
                    }

                    if (row.key === "protein") {
                      return theme.metricProtein;
                    }

                    if (row.key === "carbs") {
                      return theme.accent1;
                    }

                    if (row.key === "fat") {
                      return theme.accent2;
                    }

                    return theme.metricNutrition;
                  }}
                  presentationMode="plain"
                  rows={entry.nutritionRows}
                  showDividers={false}
                />
              </>
            ) : null}

            {onEdit || onDelete ? (
              <View
                style={[
                  styles.actionRow,
                  entry.kind === "meal" || entry.kind === "supplement"
                    ? {
                        borderTopColor: theme.cardBorder,
                        borderTopWidth: 1,
                        marginTop: 14,
                        paddingTop: 12,
                      }
                    : undefined,
                ]}
              >
                {onEdit ? (
                  <Pressable onPress={onEdit} testID="history-timeline-edit-button">
                    <ThemedText size="xs" style={[styles.actionLink, { color: theme.accent1 }]}>
                      {entry.kind === "hydration" ? "Edit" : "Edit meal"}
                    </ThemedText>
                  </Pressable>
                ) : (
                  <View />
                )}
                {onDelete ? (
                  <Pressable onPress={onDelete} testID="history-timeline-delete-button">
                    <ThemedText size="xs" style={[styles.actionLink, { color: destructiveText }]}>
                      Delete
                    </ThemedText>
                  </Pressable>
                ) : (
                  <View />
                )}
              </View>
            ) : null}
          </View>
        ) : null}
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
    columnGap: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
