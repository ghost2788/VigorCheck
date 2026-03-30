import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AnalysisJob, getQueuedJobLabel } from "../lib/domain/analysisQueue";
import { useTheme } from "../lib/theme/ThemeProvider";
import { ThemedText } from "./ThemedText";

type AnalysisQueueListProps = {
  allJobs?: AnalysisJob[];
  jobs: AnalysisJob[];
  onDismiss: (jobId: string) => void;
  onOpenReview: (jobId: string) => void;
  onRetry: (jobId: string) => void;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function QueueAction({
  label,
  onPress,
  tint,
  variant = "default",
}: {
  label: string;
  onPress: () => void;
  tint: string;
  variant?: "default" | "subtle";
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor:
            variant === "default" ? hexToRgba(tint, pressed ? 0.22 : 0.14) : theme.surfaceSoft,
          borderColor: variant === "default" ? hexToRgba(tint, 0.28) : theme.cardBorder,
        },
      ]}
    >
      <ThemedText size="sm" style={{ color: variant === "default" ? tint : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function AnalysisQueueList({
  allJobs,
  jobs,
  onDismiss,
  onOpenReview,
  onRetry,
}: AnalysisQueueListProps) {
  const { theme } = useTheme();

  if (!jobs.length) {
    return null;
  }

  return (
    <View style={styles.list}>
      {jobs.map((job, index) => {
        const statusLabel =
          job.status === "queued"
            ? getQueuedJobLabel(job, allJobs ?? jobs)
            : job.status === "analyzing"
              ? "Analyzing..."
              : job.status === "ready"
                ? "Ready to review"
                : "Analysis failed";

        return (
          <View
            key={job.id}
            style={[
              styles.row,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
              index < jobs.length - 1 ? styles.rowGap : undefined,
            ]}
          >
            <View style={styles.rowHeader}>
              <View style={styles.copy}>
                <View style={styles.statusLine}>
                  {job.status === "analyzing" ? (
                    <ActivityIndicator color={theme.accent1} size="small" />
                  ) : null}
                  <ThemedText size="sm" style={styles.previewLabel}>
                    {job.labelPreview}
                  </ThemedText>
                </View>
                <ThemedText size="sm" variant={job.status === "failed" ? "accent2" : "secondary"}>
                  {statusLabel}
                </ThemedText>
                {job.status === "failed" && job.error ? (
                  <ThemedText size="sm" variant="secondary" style={styles.errorCopy}>
                    {job.error}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={styles.actions}>
              {job.status === "ready" ? (
                <QueueAction label="Review" onPress={() => onOpenReview(job.id)} tint={theme.accent1} />
              ) : null}
              {job.status === "failed" ? (
                <QueueAction label="Retry" onPress={() => onRetry(job.id)} tint={theme.accent1} />
              ) : null}
              {job.status === "failed" || job.status === "ready" ? (
                <QueueAction
                  label="Dismiss"
                  onPress={() => onDismiss(job.id)}
                  tint={theme.textSecondary}
                  variant="subtle"
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  errorCopy: {
    lineHeight: 18,
    marginTop: 2,
  },
  list: {
    marginTop: 14,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowGap: {
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: "row",
    minWidth: 0,
  },
  statusLine: {
    alignItems: "center",
    columnGap: 8,
    flexDirection: "row",
    minWidth: 0,
  },
  previewLabel: {
    flexShrink: 1,
    lineHeight: 18,
  },
});
