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

type CollapsedMetaPresentation = {
  detailSegments: string[];
  pillLabel: string;
};

type QuantityChipPresentation = {
  label: string;
  labelTestId?: string;
  maxWidth?: number;
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

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCollapsedMetaPresentation(entry: HistoryTimelineEntry): CollapsedMetaPresentation {
  if (entry.kind === "hydration") {
    return {
      detailSegments: [formatHistoryTimeLabel(entry.timestamp), `${entry.amountCups.toFixed(1)} cups`],
      pillLabel: "Hydration",
    };
  }

  if (entry.kind === "supplement") {
    return {
      detailSegments: [
        formatHistoryTimeLabel(entry.timestamp),
        ...(entry.calories > 0 ? [`${entry.calories} cal`] : []),
      ],
      pillLabel: "Supplement",
    };
  }

  const mealMacroSummary = formatCollapsedMacroSummary(entry);

  return {
    detailSegments: [formatHistoryTimeLabel(entry.timestamp), ...(mealMacroSummary ? [mealMacroSummary] : [])],
    pillLabel: entry.entryMethodLabel,
  };
}

function buildQuantityChipPresentation(entry: HistoryTimelineEntry): QuantityChipPresentation {
  if (entry.kind === "hydration") {
    return { label: `${entry.amountOz} oz` };
  }

  if (entry.kind === "supplement") {
    return {
      label: entry.servingLabel,
      labelTestId: "history-timeline-quantity-chip-label-supplement",
      maxWidth: 144,
    };
  }

  return { label: `${entry.calories} cal` };
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

function MetaSeparator({ color }: { color: string }) {
  return <View style={[styles.metaSeparator, { backgroundColor: color }]} />;
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
  const collapsedMeta = buildCollapsedMetaPresentation(entry);
  const quantityChip = buildQuantityChipPresentation(entry);
  const insightHighlights = entry.kind === "meal" ? buildMacroCoverageHighlights(entry, targets) : [];
  const insightColorByKey: Record<keyof MacroTargets, string> = {
    calories: theme.metricCalories,
    carbs: theme.accent1,
    fat: theme.accent2,
    protein: theme.metricProtein,
  };
  const quantityChipColor = entry.kind === "meal" ? theme.metricCalories : accentColor;
  const detailEyebrow =
    entry.kind === "meal" ? "Meal impact" : entry.kind === "supplement" ? "Supplement details" : "Hydration log";

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.contentWrap}>
        <Pressable onPress={onToggle} style={styles.collapsed} testID="history-timeline-entry-toggle">
          <View style={styles.topRow}>
            <ThemedText
              numberOfLines={1}
              size="md"
              style={styles.entryTitle}
              testID="history-timeline-title"
            >
              {entry.label}
            </ThemedText>
            <View
              style={[
                styles.quantityChip,
                {
                  backgroundColor: hexToRgba(quantityChipColor, mode === "light" ? 0.1 : 0.14),
                  borderColor: hexToRgba(quantityChipColor, mode === "light" ? 0.16 : 0.22),
                },
                entry.kind === "supplement" && quantityChip.maxWidth
                  ? { maxWidth: quantityChip.maxWidth }
                  : null,
              ]}
              testID={`history-timeline-quantity-chip-${entry.kind}`}
            >
              <ThemedText
                numberOfLines={1}
                size="xs"
                style={[styles.quantityChipLabel, { color: quantityChipColor }]}
                testID={quantityChip.labelTestId}
              >
                {quantityChip.label}
              </ThemedText>
            </View>
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
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: hexToRgba(accentColor, mode === "light" ? 0.08 : 0.12),
                  borderColor: hexToRgba(accentColor, mode === "light" ? 0.14 : 0.2),
                },
              ]}
            >
              <ThemedText size="xs" style={[styles.metaPillLabel, { color: accentColor }]}>
                {collapsedMeta.pillLabel}
              </ThemedText>
            </View>
            {collapsedMeta.detailSegments.map((segment, index) => (
              <React.Fragment key={`${entry.id}-${segment}-${index}`}>
                {index > 0 ? <MetaSeparator color={theme.textMuted} /> : null}
                <ThemedText
                  size="xs"
                  style={index === collapsedMeta.detailSegments.length - 1 ? styles.metaEmphasis : null}
                  variant={index === collapsedMeta.detailSegments.length - 1 ? "secondary" : "tertiary"}
                >
                  {segment}
                </ThemedText>
              </React.Fragment>
            ))}
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={[styles.expanded, { borderTopColor: theme.cardBorder }]}>
            <View
              style={[
                styles.detailPanel,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
              testID="history-timeline-detail-panel"
            >
              <ThemedText size="xs" style={styles.detailEyebrow} variant="tertiary">
                {detailEyebrow}
              </ThemedText>
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

              {entry.kind === "meal" || entry.kind === "supplement" ? (
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
              ) : (
                <View style={styles.hydrationMetrics}>
                  <View style={styles.hydrationMetric}>
                    <ThemedText size="xs" variant="tertiary">
                      Amount
                    </ThemedText>
                    <ThemedText size="sm">{entry.amountOz} oz</ThemedText>
                  </View>
                  <View style={styles.hydrationMetric}>
                    <ThemedText size="xs" variant="tertiary">
                      Equivalent
                    </ThemedText>
                    <ThemedText size="sm">{entry.amountCups.toFixed(1)} cups</ThemedText>
                  </View>
                </View>
              )}
            </View>

            {onEdit || onDelete ? (
              <View
                style={[
                  styles.actionRow,
                  {
                    borderTopColor: theme.cardBorder,
                    borderTopWidth: 1,
                    marginTop: 14,
                    paddingTop: 12,
                  },
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
  card: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  chevron: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    flexShrink: 0,
    height: 10,
    marginRight: 2,
    width: 10,
  },
  collapsed: {
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  contentWrap: {
    flex: 1,
    minWidth: 0,
  },
  detailEyebrow: {
    letterSpacing: 0.9,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailPanel: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  entryTitle: {
    flex: 1,
    fontWeight: "600",
    marginRight: 10,
    minWidth: 0,
  },
  expanded: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hydrationMetric: {
    flex: 1,
    gap: 4,
  },
  hydrationMetrics: {
    columnGap: 12,
    flexDirection: "row",
  },
  insight: {
    lineHeight: 18,
    marginBottom: 12,
  },
  metaEmphasis: {
    fontWeight: "500",
  },
  metaPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 22,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metaRow: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
  },
  metaSeparator: {
    borderRadius: 999,
    height: 3,
    marginHorizontal: 2,
    width: 3,
  },
  quantityChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: "center",
    marginRight: 8,
    maxWidth: "45%",
    minHeight: 28,
    minWidth: 0,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quantityChipLabel: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
