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
import { WellnessAccordionList } from "../../components/WellnessAccordionList";
import { WellnessLegend } from "../../components/WellnessLegend";
import {
  getNutritionCoverageDetailCopy,
  getNutritionCoverageDescriptor,
  getTargetRelativeBarPercent,
} from "../../lib/domain/homeInsight";
import { buildExpandedNutrientProgressRows } from "../../lib/domain/nutrientProgress";
import { buildHomeRingPresentation } from "../../lib/domain/homeRingPresentation";
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

function buildTargetHeaderIndicator({
  accentColor,
  percentLabel,
  shellState,
}: {
  accentColor: string;
  percentLabel: string;
  shellState: ReturnType<typeof resolveHomeCaloriesShellState>;
}) {
  const headerPercentLabel =
    shellState === "warning" ? (
      <ThemedText size="sm" style={{ color: accentColor }}>
        ({percentLabel})
      </ThemedText>
    ) : (
      `(${percentLabel})`
    );
  const headerBadge =
    shellState === "warning" ? (
      <View
        style={[
          styles.homeHeaderBadge,
          {
            backgroundColor: hexToRgba(accentColor, 0.12),
            borderColor: hexToRgba(accentColor, 0.16),
          },
        ]}
      >
        <ThemedText size="xs" style={{ color: accentColor }}>
          Over target
        </ThemedText>
      </View>
    ) : null;

  return {
    headerBadge,
    headerPercentLabel,
  };
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
  const deleteSupplementLog = useMutation(api.supplements.deleteLog);
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
  const carbsShellState = resolveHomeCaloriesShellState(
    dashboard.cards.carbs.target > 0 ? dashboard.cards.carbs.consumed / dashboard.cards.carbs.target : 0
  );
  const fatShellState = resolveHomeCaloriesShellState(
    dashboard.cards.fat.target > 0 ? dashboard.cards.fat.consumed / dashboard.cards.fat.target : 0
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
  const carbsPercentLabel = `${dashboard.cards.carbs.rawProgressPercent}%`;
  const fatPercentLabel = `${dashboard.cards.fat.rawProgressPercent}%`;
  const hydrationPercentLabel = `${dashboard.cards.hydration.rawProgressPercent}%`;
  const nutritionPercentLabel = `${dashboard.cards.nutrition.coveragePercent}%`;
  const caloriesHeader = buildTargetHeaderIndicator({
    accentColor: caloriesWarningAccent,
    percentLabel: caloriesPercentLabel,
    shellState: caloriesShellState,
  });
  const carbsHeader = buildTargetHeaderIndicator({
    accentColor: caloriesWarningAccent,
    percentLabel: carbsPercentLabel,
    shellState: carbsShellState,
  });
  const fatHeader = buildTargetHeaderIndicator({
    accentColor: caloriesWarningAccent,
    percentLabel: fatPercentLabel,
    shellState: fatShellState,
  });
  const ringPresentation = buildHomeRingPresentation({
    carbsShellState,
    caloriesShellState,
    dashboard,
    fatShellState,
  });
  const ringLayout = {
    calories: {
      color: theme.metricCalories,
      diameter: 236,
      strokeWidth: 8,
    },
    carbs: {
      color: theme.metricCarbs,
      diameter: 160,
      strokeWidth: 8,
    },
    fat: {
      color: theme.metricFat,
      diameter: 122,
      strokeWidth: 8,
    },
    protein: {
      color: theme.metricProtein,
      diameter: 198,
      strokeWidth: 8,
    },
  } as const;

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

      <View style={styles.heroCopy}>
        <ThemedText size="xl" style={styles.heroTitle}>
          {dashboard.displayName ? `${dashboard.displayName}'s Daily Score` : "Daily Score"}
        </ThemedText>
      </View>

      <View style={styles.heroStage}>
        <ConcentricProgressRings
          rings={ringPresentation.rings.map((ring) => ({
            ...ringLayout[ring.id],
            id: ring.id,
            progress: ring.progress,
            rewardGlow: ring.rewardGlow,
          }))}
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
            { color: theme.metricCarbs, label: "Carbs" },
            { color: theme.metricFat, label: "Fat" },
          ]}
        />
      </View>

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
            headerBadge:
              caloriesHeader.headerBadge ? (
                <View testID="home-calories-header-badge">{caloriesHeader.headerBadge}</View>
              ) : null,
            headerPercentLabel:
              caloriesShellState === "warning" ? (
                <View testID="home-calories-header-percent">
                  {caloriesHeader.headerPercentLabel}
                </View>
              ) : (
                caloriesHeader.headerPercentLabel
              ),
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
            accentColor: theme.metricCarbs,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Top contributors today.
                </ThemedText>
                {dashboard.cards.carbs.contributors.map((contributor) => (
                  <View key={contributor.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{contributor.label}</ThemedText>
                      {renderContributorMeta({
                        accentColor: theme.metricCarbs,
                        contributor,
                        leadingLabel: `${contributor.value}g carbs`,
                        percentLabel: `(${formatTargetRelativePercent(
                          dashboard.cards.carbs.target,
                          contributor.value
                        )})`,
                      })}
                    </View>
                    <View
                      style={[
                        styles.sourceBar,
                        { backgroundColor: hexToRgba(theme.metricCarbs, 0.12) },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceFill,
                          {
                            backgroundColor: theme.metricCarbs,
                            width: `${getTargetRelativeBarPercent({
                              target: dashboard.cards.carbs.target,
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
            headerBadge: carbsHeader.headerBadge,
            headerPercentLabel: carbsHeader.headerPercentLabel,
            key: "carbs",
            shellEffect: {
              accentColor: theme.metricCarbs,
              state: carbsShellState,
              warningColor: caloriesWarningAccent,
            },
            summary: `${dashboard.cards.carbs.consumed} / ${dashboard.cards.carbs.target} g`,
            title: "Carbs",
          },
          {
            accentColor: theme.metricFat,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  Top contributors today.
                </ThemedText>
                {dashboard.cards.fat.contributors.map((contributor) => (
                  <View key={contributor.id} style={styles.sourceRow}>
                    <View style={styles.sourceCopy}>
                      <ThemedText size="sm">{contributor.label}</ThemedText>
                      {renderContributorMeta({
                        accentColor: theme.metricFat,
                        contributor,
                        leadingLabel: `${contributor.value}g fat`,
                        percentLabel: `(${formatTargetRelativePercent(
                          dashboard.cards.fat.target,
                          contributor.value
                        )})`,
                      })}
                    </View>
                    <View
                      style={[
                        styles.sourceBar,
                        { backgroundColor: hexToRgba(theme.metricFat, 0.12) },
                      ]}
                    >
                      <View
                        style={[
                          styles.sourceFill,
                          {
                            backgroundColor: theme.metricFat,
                            width: `${getTargetRelativeBarPercent({
                              target: dashboard.cards.fat.target,
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
            headerBadge: fatHeader.headerBadge,
            headerPercentLabel: fatHeader.headerPercentLabel,
            key: "fat",
            shellEffect: {
              accentColor: theme.metricFat,
              state: fatShellState,
              warningColor: caloriesWarningAccent,
            },
            summary: `${dashboard.cards.fat.consumed} / ${dashboard.cards.fat.target} g`,
            title: "Fat",
          },
          {
            accentColor: theme.metricHydrationSupport,
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
                          { backgroundColor: hexToRgba(theme.metricHydrationSupport, 0.12) },
                        ]}
                      >
                        <View
                          style={[
                            styles.sourceFill,
                            {
                              backgroundColor: theme.metricHydrationSupport,
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
              accentColor: theme.metricHydrationSupport,
              state: hydrationShellState,
            },
            summary: `${formatCompactNumber(
              dashboard.cards.hydration.consumedCups
            )} / ${formatCompactNumber(dashboard.cards.hydration.targetCups)} cups`,
            title: "Hydration",
          },
          {
            accentColor: theme.metricNutritionSupport,
            detail: (
              <View>
                <ThemedText variant="secondary" style={styles.cardInsight}>
                  {getNutritionCoverageDetailCopy()}
                </ThemedText>
                  <NutrientProgressRows
                    accentColor={theme.metricNutritionSupport}
                    presentationMode="plain"
                    rows={homeNutritionRows}
                  />
              </View>
            ),
            headerPercentLabel: `(${nutritionPercentLabel})`,
            key: "nutrition",
            shellEffect: {
              accentColor: theme.metricNutritionSupport,
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
                  : entry.kind === "supplement"
                    ? () => {
                        Alert.alert(
                          "Delete supplement log",
                          "This will remove the saved supplement entry.",
                          [
                            { style: "cancel", text: "Cancel" },
                            {
                              onPress: () => {
                                void deleteSupplementLog({ logId: entry.id as never });
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
});
