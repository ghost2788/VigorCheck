import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ConcentricProgressRings } from "../../components/ConcentricProgressRings";
import { ThemedText } from "../../components/ThemedText";
import { TodayMealsCard } from "../../components/TodayMealsCard";
import { WellnessAccordionList } from "../../components/WellnessAccordionList";
import { WellnessLegend } from "../../components/WellnessLegend";
import {
  getAtAGlanceMessage,
  getClampedProgressPercent,
  getDisplayedRingProgress,
  getNutritionCoverageDescriptor,
  getTargetRelativeBarPercent,
} from "../../lib/domain/homeInsight";
import { useTheme } from "../../lib/theme/ThemeProvider";

function formatCompactNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatTargetRelativePercent(target: number, value: number) {
  return formatPercent(
    getTargetRelativeBarPercent({
      target,
      value,
    })
  );
}

function formatNutritionLabel(key: string) {
  if (key === "vitaminC") {
    return "Vitamin C";
  }

  if (key === "vitaminD") {
    return "Vitamin D";
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatNutrientUnit(key: string) {
  if (key === "fiber") {
    return "g";
  }

  if (key === "vitaminD") {
    return "mcg";
  }

  return "mg";
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function InlinePercentRow({
  accentColor,
  leadingLabel,
  percentLabel,
  size = "xs",
  trailingLabel,
  variant = "secondary",
}: {
  accentColor: string;
  leadingLabel?: string;
  percentLabel: string;
  size?: "xs" | "sm" | "md";
  trailingLabel?: string;
  variant?: "primary" | "secondary" | "tertiary" | "muted";
}) {
  return (
    <View style={styles.inlineMetricRow}>
      {leadingLabel ? (
        <ThemedText size={size} variant={variant}>
          {leadingLabel}
        </ThemedText>
      ) : null}
      <ThemedText size={size} style={{ color: accentColor }}>
        {percentLabel}
      </ThemedText>
      {trailingLabel ? (
        <ThemedText size={size} variant={variant}>
          {trailingLabel}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const dashboard = useQuery(api.dashboard.today);
  const logHydration = useMutation(api.hydration.logQuickAdd);

  if (dashboard === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading today&apos;s dashboard...
        </ThemedText>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.missingCard}>
          <ThemedText size="sm" style={styles.missingTitle}>
            Finish setup
          </ThemedText>
          <ThemedText variant="secondary" style={styles.missingBody}>
            Your profile is required before Home can calculate targets and meal totals.
          </ThemedText>
          <Button label="Open setup" onPress={() => router.replace("/")} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.topRow}>
        <ThemedText variant="tertiary" size="xs">
          {dashboard.dateKey}
        </ThemedText>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, { backgroundColor: theme.metricNutrition }]} />
          <ThemedText size="xs" style={{ color: theme.metricNutrition }}>
            {dashboard.timeZone}
          </ThemedText>
        </View>
      </View>

      <View style={styles.heroCopy}>
        <ThemedText size="xl" style={styles.heroTitle}>
          Daily wellness
        </ThemedText>
      </View>

      <View style={styles.heroStage}>
        <ConcentricProgressRings
          rings={[
            {
              color: theme.metricCalories,
              diameter: 236,
              progress: getDisplayedRingProgress(dashboard.wellness.rings.calories),
              strokeWidth: 8,
            },
            {
              color: theme.metricProtein,
              diameter: 198,
              progress: getDisplayedRingProgress(dashboard.wellness.rings.protein),
              strokeWidth: 8,
            },
            {
              color: theme.metricHydration,
              diameter: 160,
              progress: getDisplayedRingProgress(dashboard.wellness.rings.hydration),
              strokeWidth: 8,
            },
            {
              color: theme.metricNutrition,
              diameter: 122,
              progress: getDisplayedRingProgress(dashboard.wellness.rings.nutrition),
              strokeWidth: 8,
            },
          ]}
          size={236}
        >
          <ThemedText size="hero">{dashboard.wellness.score}</ThemedText>
        </ConcentricProgressRings>
      </View>

      <View style={styles.legendSection}>
        <WellnessLegend
          items={[
            { color: theme.metricCalories, label: "Calories" },
            { color: theme.metricProtein, label: "Protein" },
            { color: theme.metricHydration, label: "Hydration" },
            { color: theme.metricNutrition, label: "Nutrition" },
          ]}
        />
      </View>

      <Card style={styles.insightCard}>
        <View>
          <ThemedText variant="tertiary" size="xs" style={styles.insightEyebrow}>
            Today at a glance
          </ThemedText>
          <ThemedText size="sm">
            {getAtAGlanceMessage({
              biggestGapKey: dashboard.wellness.biggestGapKey,
              calorieProgressPercent: dashboard.cards.calories.rawProgressPercent,
            })}
          </ThemedText>
        </View>
      </Card>

      <WellnessAccordionList
        items={[
          {
            accentColor: theme.metricCalories,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Meals driving the most calorie load today.
                </ThemedText>
                {dashboard.cards.calories.contributors.map((meal) => (
                  <View key={meal.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{meal.label}</ThemedText>
                      <InlinePercentRow
                        accentColor={theme.metricCalories}
                        leadingLabel={`${meal.value} kcal`}
                        percentLabel={`(${formatTargetRelativePercent(
                          dashboard.cards.calories.target,
                          meal.value
                        )})`}
                        size="xs"
                        variant="tertiary"
                      />
                    </View>
                    <View
                      style={[
                        styles.sourceBar,
                        { backgroundColor: hexToRgba(theme.metricCalories, 0.12) },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceFill,
                          {
                            backgroundColor: theme.metricCalories,
                            width: `${getTargetRelativeBarPercent({
                              target: dashboard.cards.calories.target,
                              value: meal.value,
                            })}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ),
            headerPercentLabel: `(${formatPercent(dashboard.cards.calories.rawProgressPercent)})`,
            key: "calories",
            summary: `${dashboard.cards.calories.consumed} / ${dashboard.cards.calories.target} kcal`,
            title: "Calories",
          },
          {
            accentColor: theme.metricProtein,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Meals doing the most protein work today.
                </ThemedText>
                {dashboard.cards.protein.contributors.map((meal) => (
                  <View key={meal.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{meal.label}</ThemedText>
                      <InlinePercentRow
                        accentColor={theme.metricProtein}
                        leadingLabel={`${meal.value}g protein`}
                        percentLabel={`(${formatTargetRelativePercent(
                          dashboard.cards.protein.target,
                          meal.value
                        )})`}
                        size="xs"
                        variant="tertiary"
                      />
                    </View>
                    <View
                      style={[
                        styles.sourceBar,
                        { backgroundColor: hexToRgba(theme.metricProtein, 0.12) },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceFill,
                          {
                            backgroundColor: theme.metricProtein,
                            width: `${getTargetRelativeBarPercent({
                              target: dashboard.cards.protein.target,
                              value: meal.value,
                            })}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ),
            headerPercentLabel: `(${formatPercent(dashboard.cards.protein.rawProgressPercent)})`,
            key: "protein",
            summary: `${dashboard.cards.protein.consumed} / ${dashboard.cards.protein.target} g`,
            title: "Protein",
          },
          {
            accentColor: theme.metricHydration,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Water logs, newest first.
                </ThemedText>
                {dashboard.cards.hydration.entries.length === 0 ? (
                  <ThemedText variant="secondary">No hydration logged yet today.</ThemedText>
                ) : (
                  dashboard.cards.hydration.entries.map((entry) => (
                    <View key={entry.id} style={styles.sourceRow}>
                      <View style={styles.sourceCopy}>
                        <View style={styles.inlineMetaRow}>
                          <InlinePercentRow
                            accentColor={theme.metricHydration}
                            leadingLabel={`${entry.amountOz} oz`}
                            percentLabel={`(${formatTargetRelativePercent(
                              dashboard.cards.hydration.targetCups,
                              entry.amountCups
                            )})`}
                            size="xs"
                            variant="tertiary"
                          />
                          <ThemedText variant="tertiary" size="xs">
                            {new Date(entry.timestamp).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.sourceBar,
                          { backgroundColor: hexToRgba(theme.metricHydration, 0.12) },
                        ]}
                      >
                        <View
                          style={[
                            styles.sourceFill,
                          {
                            backgroundColor: theme.metricHydration,
                            width: `${getTargetRelativeBarPercent({
                              target: dashboard.cards.hydration.targetCups,
                              value: entry.amountCups,
                            })}%`,
                          },
                        ]}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            ),
            headerActionLabel: "+",
            headerPercentLabel: `(${formatPercent(dashboard.cards.hydration.rawProgressPercent)})`,
            key: "hydration",
            onHeaderActionPress: () => {
              void logHydration({ amountOz: 8 });
            },
            summary: `${formatCompactNumber(
              dashboard.cards.hydration.consumedCups
            )} / ${formatCompactNumber(dashboard.cards.hydration.targetCups)} cups`,
            title: "Hydration",
          },
          {
            accentColor: theme.metricNutrition,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Coverage reflects foods with tracked nutrients.
                </ThemedText>
                {dashboard.cards.nutrition.nutrients.map((nutrient) => (
                  <View key={nutrient.key} style={styles.nutrientRow}>
                    <View style={styles.nutrientHeader}>
                      <InlinePercentRow
                        accentColor={theme.metricNutrition}
                        leadingLabel={formatNutritionLabel(nutrient.key)}
                        percentLabel={`(${formatPercent(nutrient.percent)})`}
                        size="sm"
                        variant="primary"
                      />
                      <ThemedText variant="tertiary" size="xs">
                        {formatCompactNumber(nutrient.consumed)} / {formatCompactNumber(nutrient.target)}{" "}
                        {formatNutrientUnit(nutrient.key)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.sourceBar,
                        { backgroundColor: hexToRgba(theme.metricNutrition, 0.12) },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceFill,
                          {
                            backgroundColor: theme.metricNutrition,
                            width: `${getClampedProgressPercent(nutrient.percent)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}

                <View style={styles.nutritionMeals}>
                  {dashboard.cards.nutrition.contributors.map((meal) => (
                    <View key={meal.id} style={styles.sourceRow}>
                      <View style={styles.sourceCopy}>
                        <ThemedText size="sm">{meal.label}</ThemedText>
                        <ThemedText variant="tertiary" size="xs">
                          {meal.topNutrients.length > 0
                            ? meal.topNutrients.map((key) => formatNutritionLabel(key)).join(" • ")
                            : "Tracked, but low contribution"}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ),
            headerPercentLabel: `(${formatPercent(dashboard.cards.nutrition.coveragePercent)})`,
            key: "nutrition",
            summary: getNutritionCoverageDescriptor(dashboard.cards.nutrition.coveragePercent),
            title: "Nutrition",
          },
        ]}
      />

      <View style={styles.mealsSection}>
        <TodayMealsCard
          emptyLabel="No meals logged yet today. Use Log to start your first entry."
          meals={dashboard.meals}
          title="Today&apos;s meals"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardInsight: {
    lineHeight: 20,
    marginBottom: 14,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  heroCopy: {
    marginBottom: 18,
  },
  inlineMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineMetricRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  heroStage: {
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    lineHeight: 30,
    maxWidth: 280,
  },
  insightCard: {
    marginBottom: 14,
    paddingVertical: 14,
  },
  insightEyebrow: {
    marginBottom: 6,
  },
  loadingLabel: {
    marginTop: 12,
  },
  legendSection: {
    marginBottom: 16,
  },
  mealsSection: {
    marginTop: 18,
  },
  missingBody: {
    marginBottom: 18,
  },
  missingCard: {
    width: "100%",
  },
  missingTitle: {
    marginBottom: 10,
  },
  nutrientHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  nutrientRow: {
    marginBottom: 12,
  },
  nutritionMeals: {
    gap: 12,
    marginTop: 8,
  },
  sourceBar: {
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  sourceCopy: {
    flex: 1,
    paddingRight: 12,
  },
  sourceFill: {
    borderRadius: 999,
    height: "100%",
  },
  sourceRow: {
    marginBottom: 12,
  },
  statusChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
});
