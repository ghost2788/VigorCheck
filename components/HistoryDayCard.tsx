import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  formatHistoryDateLabel,
  HistoryDaySummary,
} from "../lib/domain/history";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type HistoryDayCardProps = {
  summary: HistoryDaySummary;
  onPress: () => void;
};

export function HistoryDayCard({ summary, onPress }: HistoryDayCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card
          style={[
            styles.card,
            {
              borderColor: pressed ? theme.accent1 : theme.cardBorder,
              opacity: pressed ? 0.96 : 1,
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText size="lg">{formatHistoryDateLabel(summary.dateKey)}</ThemedText>

            <View
              style={[
                styles.scorePill,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <ThemedText size="lg" variant="accent1">
                {summary.wellnessScore}
              </ThemedText>
              <ThemedText size="sm" variant="secondary">
                / 100
              </ThemedText>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <ThemedText
                size="xs"
                style={{ color: theme.metricCalories }}
                testID="history-day-card-calories-label"
              >
                Calories
              </ThemedText>
              <ThemedText size="sm">{summary.calories} kcal</ThemedText>
            </View>
            <View style={styles.metric}>
              <ThemedText
                size="xs"
                style={{ color: theme.metricProtein }}
                testID="history-day-card-protein-label"
              >
                Protein
              </ThemedText>
              <ThemedText size="sm">{summary.protein}g protein</ThemedText>
            </View>
            <View style={styles.metric}>
              <ThemedText
                size="xs"
                style={{ color: theme.metricCarbs }}
                testID="history-day-card-carbs-label"
              >
                Carbs
              </ThemedText>
              <ThemedText size="sm">{summary.carbs}g carbs</ThemedText>
            </View>
            <View style={styles.metric}>
              <ThemedText
                size="xs"
                style={{ color: theme.metricFat }}
                testID="history-day-card-fat-label"
              >
                Fat
              </ThemedText>
              <ThemedText size="sm">{summary.fat}g fat</ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText size="sm" variant="secondary">
              {summary.footerLabel}
            </ThemedText>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  footer: {
    marginTop: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metric: {
    minWidth: "45%",
  },
  metricRow: {
    columnGap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  scorePill: {
    alignItems: "baseline",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
