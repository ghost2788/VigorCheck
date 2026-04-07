import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useIsFocused, useRouter } from "expo-router";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, View } from "react-native";
import { AiTextMealCard } from "../../components/AiTextMealCard";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { MySupplementsCard } from "../../components/MySupplementsCard";
import { RememberedEntriesCard } from "../../components/RememberedEntriesCard";
import { ScanEntryActions } from "../../components/ScanEntryActions";
import { ThemedText } from "../../components/ThemedText";
import { api } from "../../convex/_generated/api";
import { getDefaultMealType } from "../../lib/domain/meals";
import { useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { useScanLauncher } from "../../lib/scan/useScanLauncher";
import { useTheme } from "../../lib/theme/ThemeProvider";
import { AnalysisQueueList } from "../../components/AnalysisQueueList";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LogScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);
  const dashboard = useQuery(api.dashboard.today);
  const supplementStack = useQuery(api.supplements.currentStack);
  const [favoriteLimit, setFavoriteLimit] = useState(4);
  const [recentLimit, setRecentLimit] = useState(4);
  const rememberedEntries = useQuery(api.rememberedEntries.listForCurrentUser, {
    favoriteLimit,
    recentLimit,
  });
  const ensureMigrated = useMutation(api.rememberedEntries.ensureMigrated);
  const ensureSupplementsReady = useMutation(api.supplements.ensureReady);
  const logRememberedEntry = useMutation(api.rememberedEntries.logRememberedEntry);
  const toggleFavorite = useMutation(api.rememberedEntries.toggleFavorite);
  const logSupplementToday = useMutation(api.supplements.logToday);
  const unlogSupplementToday = useMutation(api.supplements.unlogToday);
  const logManualMeal = useMutation(api.meals.logManual);
  const { isPreparing, scanLauncherError, startScan } = useScanLauncher();
  const {
    barcodeFallback,
    clearBarcodeFallback,
    clearReviewedSaveAnnouncement,
    dismissJob,
    enqueueTextJob,
    getJobsForOrigin,
    jobs,
    openReviewJob,
    reviewedSaveAnnouncement,
    retryJob,
  } = useScanFlow();
  const [quickAddExpansionSignal, setQuickAddExpansionSignal] = useState(0);

  const scanJobs = getJobsForOrigin("scan");
  const textJobs = getJobsForOrigin("text");

  useEffect(() => {
    if (dashboard) {
      void ensureMigrated({});
      void ensureSupplementsReady({});
    }
  }, [dashboard, ensureMigrated, ensureSupplementsReady]);

  useEffect(() => {
    if (!isFocused || !reviewedSaveAnnouncement) {
      return;
    }

    const timeout = setTimeout(() => {
      clearReviewedSaveAnnouncement();
    }, 1600);

    return () => clearTimeout(timeout);
  }, [clearReviewedSaveAnnouncement, isFocused, reviewedSaveAnnouncement?.id]);

  if (dashboard === undefined || supplementStack === undefined || rememberedEntries === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText size="xl" style={styles.title}>
          Log
        </ThemedText>
        {reviewedSaveAnnouncement ? (
          <View
            style={[
              styles.reviewedSaveToast,
              {
                backgroundColor: hexToRgba(theme.accent1, 0.14),
                borderColor: hexToRgba(theme.accent1, 0.24),
              },
            ]}
          >
            <ThemedText size="sm" style={{ color: theme.accent1 }}>
              {reviewedSaveAnnouncement.message}
            </ThemedText>
          </View>
        ) : null}
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

        {reviewedSaveAnnouncement ? (
          <View
            style={[
              styles.reviewedSaveToast,
              {
                backgroundColor: hexToRgba(theme.accent1, 0.14),
                borderColor: hexToRgba(theme.accent1, 0.24),
              },
            ]}
          >
            <ThemedText size="sm" style={{ color: theme.accent1 }}>
              {reviewedSaveAnnouncement.message}
            </ThemedText>
          </View>
        ) : null}

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
          <MySupplementsCard
            asNeeded={supplementStack?.asNeeded ?? []}
            daily={supplementStack?.daily ?? []}
            onLogAsNeeded={async (userSupplementId) => {
              await logSupplementToday({ userSupplementId: userSupplementId as never });
            }}
            onManage={() => router.push("/supplements")}
            onToggleDaily={async (userSupplementId, nextTaken) => {
              if (nextTaken) {
                await logSupplementToday({ userSupplementId: userSupplementId as never });
                return;
              }

              await unlogSupplementToday({ userSupplementId: userSupplementId as never });
            }}
            onUndoAsNeeded={async (userSupplementId) => {
              await unlogSupplementToday({ userSupplementId: userSupplementId as never });
            }}
          />
        </View>

        <View style={styles.section}>
          <RememberedEntriesCard
            favoriteHasMore={rememberedEntries.favoritesHasMore}
            favorites={rememberedEntries.favorites}
            onReplay={async (rememberedEntryId) => {
              await logRememberedEntry({ rememberedEntryId: rememberedEntryId as never });
            }}
            onShowMoreFavorites={() => setFavoriteLimit(20)}
            onShowMoreRecent={() => setRecentLimit(20)}
            onToggleFavorite={async (rememberedEntryId) => {
              await toggleFavorite({ rememberedEntryId: rememberedEntryId as never });
            }}
            recent={rememberedEntries.recent}
            recentHasMore={rememberedEntries.recentHasMore}
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
  reviewedSaveToast: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    marginBottom: 20,
  },
});
