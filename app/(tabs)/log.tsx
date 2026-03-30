import React, { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { AiTextMealCard } from "../../components/AiTextMealCard";
import { Card } from "../../components/Card";
import { RememberedHydrationShortcutsCard } from "../../components/RememberedHydrationShortcutsCard";
import { ScanEntryActions } from "../../components/ScanEntryActions";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { getDefaultMealType } from "../../lib/domain/meals";
import { useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { useScanLauncher } from "../../lib/scan/useScanLauncher";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { AnalysisQueueList } from "../../components/AnalysisQueueList";

export default function LogScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const dashboard = useQuery(api.dashboard.today);
  const shortcuts = useQuery(api.hydrationShortcuts.listForCurrentUser);
  const ensureSeeded = useMutation(api.hydrationShortcuts.ensureSeeded);
  const createShortcut = useMutation(api.hydrationShortcuts.createShortcut);
  const logShortcut = useMutation(api.hydrationShortcuts.logShortcut);
  const logManualMeal = useMutation(api.meals.logManual);
  const { isPreparing, scanLauncherError, startScan } = useScanLauncher();
  const { dismissJob, enqueueTextJob, getJobsForOrigin, jobs, openReviewJob, retryJob } = useScanFlow();

  const scanJobs = getJobsForOrigin("scan");
  const textJobs = getJobsForOrigin("text");

  useEffect(() => {
    if (dashboard && shortcuts && shortcuts.length === 0) {
      void ensureSeeded({});
    }
  }, [dashboard, ensureSeeded, shortcuts]);

  if (dashboard === undefined || shortcuts === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
        <ThemedText variant="secondary" style={styles.loadingLabel}>
          Loading your log...
        </ThemedText>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.card}>
          <ThemedText size="sm" style={styles.cardTitle}>
            Finish setup first
          </ThemedText>
          <ThemedText variant="secondary" style={styles.cardBody}>
            Logging is ready, but it needs your profile and targets before meals can be saved.
          </ThemedText>
          <ThemedText size="sm" variant="secondary">
            Open setup from the root screen, save your profile, then come back here.
          </ThemedText>
        </Card>
      </View>
    );
  }

  const rememberedShortcuts = shortcuts.map((shortcut) => ({
    calories: shortcut.calories,
    carbs: shortcut.carbs,
    category: shortcut.category,
    defaultAmountOz: shortcut.defaultAmountOz,
    fat: shortcut.fat,
    id: shortcut._id,
    label: shortcut.label,
    lastUsedAt: shortcut.lastUsedAt,
    logMode: shortcut.logMode,
    mealType: shortcut.mealType,
    micronutrients: shortcut.nutritionProfile,
    pinned: shortcut.pinned,
    protein: shortcut.protein,
  }));

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemedText size="xl" style={styles.title}>
        Log
      </ThemedText>

      <View style={styles.section}>
        <ScanEntryActions
          error={scanLauncherError}
          isPreparing={isPreparing}
          onCameraPress={() => void startScan("camera")}
          onLibraryPress={() => void startScan("library")}
          title="Scan a meal"
        >
          <AnalysisQueueList
            allJobs={jobs}
            jobs={scanJobs}
            onDismiss={dismissJob}
            onOpenReview={(jobId) => {
              openReviewJob(jobId);
              router.push("/scan/review");
            }}
            onRetry={retryJob}
          />
        </ScanEntryActions>
      </View>

      <View style={styles.section}>
        <AiTextMealCard
          jobs={textJobs}
          onDismissJob={dismissJob}
          onOpenReview={(jobId) => {
            openReviewJob(jobId);
            router.push("/scan/review");
          }}
          onQuickAddSubmit={async (values) => {
            await logManualMeal(values);
          }}
          onRetryJob={retryJob}
          onSubmitDescription={async (description) => {
            enqueueTextJob({
              description,
              mealType: getDefaultMealType(),
            });
          }}
          allJobs={jobs}
        />
      </View>

      <View style={styles.section}>
        <RememberedHydrationShortcutsCard
          onCreateShortcut={async (input) => {
            await createShortcut(input);
          }}
          onLogShortcut={async (shortcutId) => {
            await logShortcut({ shortcutId });
          }}
          shortcuts={rememberedShortcuts}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  calorieLine: {
    marginBottom: 20,
  },
  card: {
    width: "100%",
  },
  cardBody: {
    marginBottom: 18,
  },
  cardTitle: {
    marginBottom: 8,
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
    paddingTop: 26,
  },
  loadingLabel: {
    marginTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 20,
  },
});
