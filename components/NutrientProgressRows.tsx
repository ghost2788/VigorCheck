import React from "react";
import { StyleSheet, View } from "react-native";
import { NutrientProgressRow } from "../lib/domain/nutrientProgress";
import { useTheme } from "../lib/theme/ThemeProvider";
import {
  getClampedProgressFillPercent,
  getRenderableProgressRatio,
  shouldShowStaticReward,
} from "../lib/ui/nutrientProgressPresentation";
import { ThemedText } from "./ThemedText";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPercent(row: NutrientProgressRow) {
  if (row.percent === 0 && row.value > 0 && row.target > 0) {
    return "<1%";
  }

  return `${row.percent}%`;
}

function formatNutrientValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function mixHexWithWhite(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const mixChannel = (value: number) => Math.round(value + (255 - value) * amount);
  return `rgb(${mixChannel(r)}, ${mixChannel(g)}, ${mixChannel(b)})`;
}

export function NutrientProgressRows({
  accentColor,
  getAccentColor,
  presentationMode = "plain",
  rows,
  showDividers = true,
}: {
  accentColor?: string;
  getAccentColor?: (row: NutrientProgressRow) => string;
  presentationMode?: "plain" | "static_reward_only";
  rows: NutrientProgressRow[];
  showDividers?: boolean;
}) {
  return (
    <>
      {rows.map((row, index) => (
        <NutrientProgressRowItem
          accentColor={accentColor}
          getAccentColor={getAccentColor}
          index={index}
          key={row.key}
          presentationMode={presentationMode}
          row={row}
          showDividers={showDividers}
        />
      ))}
    </>
  );
}

function NutrientProgressRowItem({
  accentColor,
  getAccentColor,
  index,
  presentationMode,
  row,
  showDividers,
}: {
  accentColor?: string;
  getAccentColor?: (row: NutrientProgressRow) => string;
  index: number;
  presentationMode: "plain" | "static_reward_only";
  row: NutrientProgressRow;
  showDividers: boolean;
}) {
  const { mode, theme } = useTheme();
  const resolvedAccentColor = getAccentColor?.(row) ?? accentColor ?? theme.metricNutrition;
  const compactCopyStyle = !showDividers ? styles.copyCompact : null;
  const compactRowStyle = !showDividers
    ? [styles.rowCompact, index === 0 ? styles.rowCompactFirst : null]
    : null;
  const fillWidth = `${getClampedProgressFillPercent(getRenderableProgressRatio(row))}%` as const;
  const rewardLabelColor = mixHexWithWhite(resolvedAccentColor, mode === "light" ? 0.18 : 0.36);
  const showRewardStyles =
    presentationMode === "static_reward_only" && shouldShowStaticReward(row);
  const shellStyle = showRewardStyles
    ? [
        styles.rowShell,
        {
          backgroundColor: hexToRgba(resolvedAccentColor, 0.1),
          borderColor: hexToRgba(resolvedAccentColor, 0.14),
        },
      ]
    : null;

  const content = (
    <>
      <View style={[styles.copy, compactCopyStyle]}>
        <ThemedText size="sm">{row.label}</ThemedText>
        <View style={styles.valueCluster}>
          {showRewardStyles ? (
            <View
              style={[
                styles.rewardPill,
                {
                  backgroundColor: hexToRgba(resolvedAccentColor, 0.16),
                  borderColor: hexToRgba(resolvedAccentColor, 0.18),
                },
              ]}
              testID={`nutrient-progress-reward-pill-${row.key}`}
            >
              <ThemedText size="xs" style={{ color: rewardLabelColor }}>
                {formatPercent(row)}
              </ThemedText>
            </View>
          ) : (
            <ThemedText size="sm" style={{ color: resolvedAccentColor }}>
              {formatPercent(row)}
            </ThemedText>
          )}
        </View>
      </View>
      <ThemedText size="xs" variant="secondary">
        {formatNutrientValue(row.value)} / {formatNutrientValue(row.target)} {row.unit}
      </ThemedText>
      <View style={[styles.track, { backgroundColor: hexToRgba(resolvedAccentColor, 0.12) }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: resolvedAccentColor,
              width: fillWidth,
            },
          ]}
          testID={`nutrient-progress-fill-${row.key}`}
        />
        {showRewardStyles ? (
          <View
            style={[
              styles.rewardEndcap,
              {
                backgroundColor: rewardLabelColor,
                borderColor: hexToRgba(resolvedAccentColor, 0.18),
              },
            ]}
          />
        ) : null}
      </View>
    </>
  );

  return (
    <View style={[styles.row, compactRowStyle]} testID={`nutrient-progress-row-${row.key}`}>
      {showRewardStyles ? <View style={shellStyle}>{content}</View> : content}
      {showDividers ? (
        <View
          style={[styles.divider, { backgroundColor: theme.cardBorder }]}
          testID={`nutrient-progress-divider-${row.key}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  copyCompact: {
    marginBottom: 6,
  },
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
  rewardEndcap: {
    borderRadius: 999,
    borderWidth: 1,
    height: 8,
    position: "absolute",
    right: -1,
    top: -1,
    width: 8,
  },
  rewardPill: {
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  row: {
    marginTop: 12,
    paddingBottom: 12,
    position: "relative",
  },
  rowCompact: {
    marginTop: 10,
    paddingBottom: 0,
  },
  rowCompactFirst: {
    marginTop: 0,
  },
  rowShell: {
    borderColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: -10,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: "relative",
  },
  track: {
    borderRadius: 999,
    height: 6,
    marginTop: 6,
    overflow: "hidden",
  },
  valueCluster: {
    alignItems: "center",
    columnGap: 8,
    flexDirection: "row",
  },
});
