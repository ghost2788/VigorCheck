import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, View } from "react-native";
import { AiTextMealCard } from "../../components/AiTextMealCard";
import { Button } from "../../components/Button";
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
  const scrollViewRef = useRef<ScrollView>(null);
  const dashboard = useQuery(api.dashboard.today);
  const shortcuts = useQuery(api.hydrationShortcuts.listForCurrentUser);
  const ensureSeeded = useMutation(api.hydrationShortcuts.ensureSeeded);
  const createShortcut = useMutation(api.hydrationShortcuts.createShortcut);
  const logShortcut = useMutation(api.hydrationShortcuts.logShortcut);
  const logManualMeal = useMutation(api.meals.logManual);
  const { isPreparing, scanLauncherError, startScan } = useScanLauncher();
  const {
    barcodeFallback,
    clearBarcodeFallback,
    dismissJob,
    enqueueTextJob,
    getJobsForOrigin,
    jobs,
    openReviewJob,
    retryJob,
  } = useScanFlow();
  const [quickAddExpansionSignal, setQuickAddExpansionSignal] = useState(0);

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
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        ref={scrollViewRef}
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
            onBarcodePress={() => router.push("/scan/barcode")}
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
            allJobs={jobs}
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
            quickAddExpansionSignal={quickAddExpansionSignal}
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

      <Modal
        animationType="slide"
        onRequestClose={clearBarcodeFallback}
        transparent
        visible={Boolean(barcodeFallback)}
      >
        <View style={styles.modalScrim}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <ThemedText size="sm" style={styles.modalTitle}>
              Barcode not matched
            </ThemedText>
            <ThemedText size="sm" variant="secondary" style={styles.modalCopy}>
              {barcodeFallback?.message ??
                "This barcode could not be matched to a complete product right now."}
            </ThemedText>
            {barcodeFallback ? (
              <View
                style={[
                  styles.codePill,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <ThemedText size="sm">{barcodeFallback.code}</ThemedText>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Button label="Scan again" onPress={() => {
                clearBarcodeFallback();
                router.push("/scan/barcode");
              }} />
              <Button
                label="Open quick add"
                onPress={() => {
                  clearBarcodeFallback();
                  setQuickAddExpansionSignal((current) => current + 1);
                  scrollViewRef.current?.scrollTo({ animated: true, y: 320 });
                }}
                variant="secondary"
              />
              <Button label="Cancel" onPress={clearBarcodeFallback} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  codePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalActions: {
    gap: 10,
  },
  modalCopy: {
    lineHeight: 20,
    marginBottom: 12,
  },
  modalScrim: {
    backgroundColor: "rgba(0,0,0,0.54)",
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  modalSheet: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  modalTitle: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 20,
  },
});
