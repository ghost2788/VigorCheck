import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../../components/Card";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";
import { NutrientDetailGroups } from "../../components/NutrientDetailGroups";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { formatHistoryDateLabel } from "../../lib/domain/history";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function HistoryDayDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const deleteMeal = useMutation(api.meals.deleteMeal);
  const deleteHydrationLog = useMutation(api.hydration.deleteLog);
  const params = useLocalSearchParams<{ dateKey?: string }>();
  const dateKey = typeof params.dateKey === "string" ? params.dateKey : null;
  const detail = useQuery(api.history.dayDetail, dateKey ? { dateKey } : "skip");

  if (!dateKey || detail === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm" style={styles.emptyTitle}>
            Day not found
          </ThemedText>
          <ThemedText variant="secondary" style={styles.emptyBody}>
            This date does not have any saved meals or hydration entries yet.
          </ThemedText>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 26) }]}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <View style={styles.headerRow}>
        <ThemedText size="xl" style={styles.title}>
          {formatHistoryDateLabel(detail.dateKey)}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
          testID="history-day-detail-back-button"
        >
          <ThemedText size="xs" variant="secondary">
            Back
          </ThemedText>
        </Pressable>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <ThemedText
            size="hero"
            style={[styles.summaryScore, { color: theme.accent1 }]}
            testID="history-day-detail-score"
          >
            {detail.summary.wellnessScore}
          </ThemedText>
          <ThemedText size="lg" variant="secondary">
            / 100
          </ThemedText>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricCalories }}
              testID="history-day-detail-calories-label"
            >
              Calories
            </ThemedText>
            <ThemedText size="sm">{detail.summary.calories} kcal</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricProtein }}
              testID="history-day-detail-protein-label"
            >
              Protein
            </ThemedText>
            <ThemedText size="sm">{detail.summary.protein}g</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricHydration }}
              testID="history-day-detail-hydration-label"
            >
              Hydration
            </ThemedText>
            <ThemedText size="sm">{detail.summary.hydrationCups.toFixed(1)} cups</ThemedText>
          </View>
          <View style={styles.summaryMetric}>
            <ThemedText
              size="xs"
              style={{ color: theme.metricNutrition }}
              testID="history-day-detail-nutrition-label"
            >
              Nutrition
            </ThemedText>
            <ThemedText size="sm">{detail.summary.nutritionCoveragePercent}%</ThemedText>
          </View>
        </View>
      </Card>

      <NutrientDetailGroups
        accentColor={theme.metricNutrition}
        groups={detail.summary.nutrientGroups}
      />

      {detail.timeline.map((entry) => (
        <HistoryTimelineEntryCard
          entry={entry}
          key={`${entry.kind}-${entry.id}`}
          onDelete={() => {
            if (entry.kind === "hydration") {
              Alert.alert("Delete hydration log", "This will remove the saved hydration entry.", [
                { style: "cancel", text: "Cancel" },
                {
                  style: "destructive",
                  text: "Delete",
                  onPress: () => {
                    void deleteHydrationLog({ logId: entry.id as never });
                  },
                },
              ]);
              return;
            }

            Alert.alert("Delete meal", "This will remove the saved meal and all of its items.", [
              { style: "cancel", text: "Cancel" },
              {
                style: "destructive",
                text: "Delete",
                onPress: () => {
                  void deleteMeal({ mealId: entry.id as never });
                },
              },
            ]);
          }}
          onEdit={() => {
            if (entry.kind === "hydration") {
              router.push(`/history/hydration/${entry.id}`);
              return;
            }

            router.push(`/history/meals/${entry.id}`);
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 74,
    paddingHorizontal: 14,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  emptyBody: {
    marginTop: 8,
  },
  emptyCard: {
    width: "100%",
  },
  emptyTitle: {},
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  summaryCard: {
    marginBottom: 18,
  },
  summaryGrid: {
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  summaryHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryMetric: {
    minWidth: "45%",
  },
  summaryScore: {
    marginRight: 6,
  },
  title: {
    flex: 1,
    marginRight: 12,
  },
});
