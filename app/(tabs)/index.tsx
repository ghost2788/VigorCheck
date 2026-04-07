import React from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ConcentricProgressRings } from "../../components/ConcentricProgressRings";
import { HistoryTimelineEntryCard } from "../../components/HistoryTimelineEntryCard";
import { NutrientProgressRows } from "../../components/NutrientProgressRows";
import { ThemedText } from "../../components/ThemedText";
import { useSubscription } from "../../lib/billing/SubscriptionProvider";
import { WellnessAccordionList } from "../../components/WellnessAccordionList";
import { WellnessLegend } from "../../components/WellnessLegend";
import {
  getAtAGlanceMessage,
  getDisplayedRingProgress,
  getNutritionCoverageDetailCopy,
  getNutritionCoverageDescriptor,
  getTargetRelativeBarPercent,
} from "../../lib/domain/homeInsight";
import { buildExpandedNutrientProgressRows } from "../../lib/domain/nutrientProgress";
import { useOnboardingFlow } from "../../lib/onboarding/OnboardingFlowProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";
import {
  getHomeCaloriesShellWarningAccent,
  resolveHomeAccordionWarmShellState,
  resolveHomeCaloriesShellState,
} from "../../lib/ui/homeAccordionShellPresentation";

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

function renderContributorMeta({
  accentColor,
  contributor,
  leadingLabel,
  percentLabel,
}: {
  accentColor: string;
  contributor: {
    kind: "meal" | "supplement";
    servingLabel?: string;
  };
  leadingLabel: string;
  percentLabel: string;
}) {
  if (contributor.kind === "supplement") {
    return (
      <View style={styles.contributorMetaStack}>
        <ThemedText size="xs" variant="tertiary">
          {contributor.servingLabel}
        </ThemedText>
        <InlinePercentRow
          accentColor={accentColor}
          leadingLabel={leadingLabel}
          percentLabel={percentLabel}
          size="xs"
          variant="tertiary"
        />
      </View>
    );
  }

  return (
    <InlinePercentRow
      accentColor={accentColor}
      leadingLabel={leadingLabel}
      percentLabel={percentLabel}
      size="xs"
      variant="tertiary"
    />
  );
}

export default function HomeScreen() {
  const { mode, theme } = useTheme();
  const router = useRouter();
  const dashboard = useQuery(api.dashboard.today);
  const logHydration = useMutation(api.hydration.logQuickAdd);
  const deleteMeal = useMutation(api.meals.deleteMeal);
  const { accessState } = useSubscription();
  const { consumePostOnboardingHomeCTA, showPostOnboardingHomeCTA } = useOnboardingFlow();
  const [showCompletionCard, setShowCompletionCard] = React.useState(false);
  const [expandedEntryId, setExpandedEntryId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!showPostOnboardingHomeCTA) {
      return;
    }

    setShowCompletionCard(true);
    consumePostOnboardingHomeCTA();
  }, [consumePostOnboardingHomeCTA, showPostOnboardingHomeCTA]);

  React.useEffect(() => {
    if (!dashboard || expandedEntryId === null) {
      return;
    }

    if (!dashboard.entryTimeline.some((entry) => entry.id === expandedEntryId)) {
      setExpandedEntryId(null);
    }
  }, [dashboard, expandedEntryId]);

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

  const homeNutritionRows = buildExpandedNutrientProgressRows({
    detailGroups: dashboard.cards.nutrition.detailGroups,
  });
  const showViewDayLink =
    dashboard.entryTimeline.length > 0 || dashboard.cards.hydration.entries.length > 0;
  const caloriesProgressRatio =
    dashboard.cards.calories.target > 0
      ? dashboard.cards.calories.consumed / dashboard.cards.calories.target
      : 0;
  const caloriesShellState = resolveHomeCaloriesShellState(caloriesProgressRatio);
  const proteinShellState = resolveHomeAccordionWarmShellState(
    dashboard.cards.protein.target > 0
      ? dashboard.cards.protein.consumed / dashboard.cards.protein.target
      : 0
  );
  const hydrationShellState = resolveHomeAccordionWarmShellState(
    dashboard.cards.hydration.targetCups > 0
      ? dashboard.cards.hydration.consumedCups / dashboard.cards.hydration.targetCups
      : 0
  );
  const nutritionShellState = resolveHomeAccordionWarmShellState(
    dashboard.cards.nutrition.coverageRatio
  );
  const caloriesWarningAccent = getHomeCaloriesShellWarningAccent(mode);
  const caloriesPercentLabel = `${dashboard.cards.calories.rawProgressPercent}%`;
  const proteinPercentLabel = `${dashboard.cards.protein.rawProgressPercent}%`;
  const hydrationPercentLabel = `${dashboard.cards.hydration.rawProgressPercent}%`;
  const nutritionPercentLabel = `${dashboard.cards.nutrition.coveragePercent}%`;
  const caloriesHeaderPercentLabel =
    caloriesShellState === "warning" ? (
      <ThemedText
        size="sm"
        style={{ color: caloriesWarningAccent }}
        testID="home-calories-header-percent"
      >
        ({caloriesPercentLabel})
      </ThemedText>
    ) : (
      `(${caloriesPercentLabel})`
    );
  const caloriesHeaderBadge =
    caloriesShellState === "warning" ? (
      <View
        style={[
          styles.homeHeaderBadge,
          {
            backgroundColor: hexToRgba(caloriesWarningAccent, 0.12),
            borderColor: hexToRgba(caloriesWarningAccent, 0.16),
          },
        ]}
        testID="home-calories-header-badge"
      >
        <ThemedText size="xs" style={{ color: caloriesWarningAccent }}>
          Over target
        </ThemedText>
      </View>
    ) : null;

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

      {showCompletionCard ? (
        <Card style={styles.onboardingCard}>
          <ThemedText size="sm" style={styles.onboardingCardTitle}>
            Your plan is ready. Log your first meal to start filling today&apos;s rings.
          </ThemedText>
          <ThemedText variant="secondary" style={styles.onboardingCardBody}>
            Home is set up. Your first log will start bringing these targets to life.
          </ThemedText>
          <Button label="Log first meal" onPress={() => router.push("/(tabs)/log")} />
        </Card>
      ) : null}

      {accessState?.status === "trial" ? (
        <Card style={styles.trialCard}>
          <ThemedText size="sm" style={styles.onboardingCardTitle}>
            {accessState.daysRemaining} day{accessState.daysRemaining === 1 ? "" : "s"} left in your free trial
          </ThemedText>
          <ThemedText variant="secondary">
            Keep logging now. You can subscribe any time in Profile before the trial ends.
          </ThemedText>
        </Card>
      ) : null}

      <View style={styles.heroCopy}>
        <ThemedText size="xl" style={styles.heroTitle}>
          {dashboard.displayName ? `${dashboard.displayName}'s Daily Vigor` : "Daily Vigor"}
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
          <ThemedText size="md">
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
                  Top contributors today.
                </ThemedText>
                {dashboard.cards.calories.contributors.map((contributor) => (
                  <View key={contributor.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{contributor.label}</ThemedText>
                      {renderContributorMeta({
                        accentColor: theme.metricCalories,
                        contributor,
                        leadingLabel: `${contributor.value} kcal`,
                        percentLabel: `(${formatTargetRelativePercent(
                          dashboard.cards.calories.target,
                          contributor.value
                        )})`,
                      })}
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
                              value: contributor.value,
                            })}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ),
            headerBadge: caloriesHeaderBadge,
            headerPercentLabel: caloriesHeaderPercentLabel,
            key: "calories",
            shellEffect: {
              accentColor: theme.metricCalories,
              state: caloriesShellState,
              warningColor: caloriesWarningAccent,
            },
            summary: `${dashboard.cards.calories.consumed} / ${dashboard.cards.calories.target} kcal`,
            title: "Calories",
          },
          {
            accentColor: theme.metricProtein,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Top contributors today.
                </ThemedText>
                {dashboard.cards.protein.contributors.map((contributor) => (
                  <View key={contributor.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{contributor.label}</ThemedText>
                      {renderContributorMeta({
                        accentColor: theme.metricProtein,
                        contributor,
                        leadingLabel: `${contributor.value}g protein`,
                        percentLabel: `(${formatTargetRelativePercent(
                          dashboard.cards.protein.target,
                          contributor.value
                        )})`,
                      })}
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
                              value: contributor.value,
                            })}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ),
            headerPercentLabel: `(${proteinPercentLabel})`,
            key: "protein",
            shellEffect: {
              accentColor: theme.metricProtein,
              state: proteinShellState,
            },
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
            headerPercentLabel: `(${hydrationPercentLabel})`,
            key: "hydration",
            onHeaderActionPress: () => {
              void logHydration({ amountOz: 8 });
            },
            shellEffect: {
              accentColor: theme.metricHydration,
              state: hydrationShellState,
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
                  {getNutritionCoverageDetailCopy()}
                </ThemedText>
                <NutrientProgressRows
                  accentColor={theme.metricNutrition}
                  presentationMode="plain"
                  rows={homeNutritionRows}
                />
              </View>
            ),
            headerPercentLabel: `(${nutritionPercentLabel})`,
            key: "nutrition",
            shellEffect: {
              accentColor: theme.metricNutrition,
              state: nutritionShellState,
            },
            summary: getNutritionCoverageDescriptor(dashboard.cards.nutrition.coveragePercent),
            title: "Nutrition",
          },
        ]}
      />

      <View style={styles.mealsSection}>
        <View style={styles.mealsHeader}>
          <ThemedText size="sm">Today&apos;s entries</ThemedText>
          <View style={styles.mealsHeaderMeta}>
            <ThemedText size="sm" variant="secondary">
              {dashboard.entryTimeline.length} entr{dashboard.entryTimeline.length === 1 ? "y" : "ies"}
            </ThemedText>
            {showViewDayLink ? (
              <Pressable onPress={() => router.push(`/history/${dashboard.dateKey}`)}>
                <ThemedText size="xs" style={{ color: theme.accent1 }}>
                  View day
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {dashboard.entryTimeline.length === 0 ? (
          <ThemedText style={styles.emptyMealsCopy} variant="secondary">
            No meals, drinks, or supplements logged yet today. Use Log to start your first entry.
          </ThemedText>
        ) : (
          dashboard.entryTimeline.map((entry) => (
            <HistoryTimelineEntryCard
              entry={entry}
              isExpanded={expandedEntryId === entry.id}
              key={`${entry.kind}-${entry.id}`}
              onDelete={
                entry.kind === "meal"
                  ? () => {
                      Alert.alert(
                        "Delete meal",
                        "This will remove the saved meal and all of its items.",
                        [
                          { style: "cancel", text: "Cancel" },
                          {
                            onPress: () => {
                              void deleteMeal({ mealId: entry.id as never });
                            },
                            style: "destructive",
                            text: "Delete",
                          },
                        ]
                      );
                    }
                  : undefined
              }
              onEdit={entry.kind === "meal" ? () => {
                router.push(`/history/meals/${entry.id}`);
              } : undefined}
              onToggle={() =>
                setExpandedEntryId((current) => (current === entry.id ? null : entry.id))
              }
              targets={dashboard.targets}
            />
          ))
        )}
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
  contributorMetaStack: {
    gap: 2,
    marginTop: 4,
  },
  emptyMealsCopy: {
    marginTop: 8,
  },
  heroCopy: {
    marginBottom: 18,
  },
  heroStage: {
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    lineHeight: 30,
    maxWidth: 280,
  },
  homeHeaderBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  insightCard: {
    marginBottom: 14,
    paddingVertical: 14,
  },
  insightEyebrow: {
    marginBottom: 6,
  },
  legendSection: {
    marginBottom: 16,
  },
  loadingLabel: {
    marginTop: 12,
  },
  mealsSection: {
    marginTop: 18,
  },
  mealsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mealsHeaderMeta: {
    alignItems: "center",
    columnGap: 12,
    flexDirection: "row",
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
  onboardingCard: {
    marginBottom: 16,
  },
  onboardingCardBody: {
    marginBottom: 16,
  },
  onboardingCardTitle: {
    marginBottom: 10,
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
  trialCard: {
    marginBottom: 16,
  },
});
