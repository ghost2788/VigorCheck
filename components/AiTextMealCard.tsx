import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AnalysisJob } from "../lib/domain/analysisQueue";
import { useTheme } from "../lib/theme/ThemeProvider";
import { AnalysisQueueList } from "./AnalysisQueueList";
import { Button } from "./Button";
import { Card } from "./Card";
import { ManualMealForm, ManualMealFormSubmission } from "./ManualMealForm";
import { ThemedText } from "./ThemedText";

type AiTextMealCardProps = {
  allJobs?: AnalysisJob[];
  isSubmitting?: boolean;
  jobs: AnalysisJob[];
  onDismissJob: (jobId: string) => void;
  onOpenReview: (jobId: string) => void;
  onQuickAddSubmit: (values: ManualMealFormSubmission) => Promise<void> | void;
  onRetryJob: (jobId: string) => void;
  onSubmitDescription: (description: string) => Promise<void> | void;
  quickAddExpansionSignal?: number;
};

export function AiTextMealCard({
  allJobs,
  isSubmitting = false,
  jobs,
  onDismissJob,
  onOpenReview,
  onQuickAddSubmit,
  onRetryJob,
  onSubmitDescription,
  quickAddExpansionSignal = 0,
}: AiTextMealCardProps) {
  const { theme } = useTheme();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (quickAddExpansionSignal > 0) {
      setShowQuickAdd(true);
    }
  }, [quickAddExpansionSignal]);

  return (
    <Card>
      <ThemedText size="xs" style={[styles.eyebrow, { color: theme.accent1 }]}>
        Text + Exact Macros
      </ThemedText>
      <ThemedText size="md" style={styles.title}>
        Describe a meal
      </ThemedText>
      <ThemedText size="sm" variant="secondary" style={styles.copy}>
        Type what you ate for an AI estimate, or switch to exact macros when you already know the
        numbers.
      </ThemedText>

      <View
        style={[
          styles.fieldShell,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <ThemedText size="xs" style={styles.fieldLabel} variant="tertiary">
          Meal description
        </ThemedText>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          placeholder="2 eggs, toast, coffee"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            {
              color: theme.text,
            },
          ]}
          textAlignVertical="top"
          value={description}
        />
      </View>

      <View style={styles.hintRow}>
        <View
          style={[
            styles.hintChip,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="sm" variant="secondary">
            Include portions when you can
          </ThemedText>
        </View>
        <View
          style={[
            styles.hintChip,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText size="sm" variant="secondary">
            Mention sauces or extras
          </ThemedText>
        </View>
      </View>

      {error ? (
        <ThemedText size="sm" variant="accent2" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        label={isSubmitting ? "Submitting..." : "Analyze meal"}
        onPress={async () => {
          const trimmed = description.trim();

          if (!trimmed) {
            setError("Add a short meal description before analyzing it.");
            return;
          }

          setError(null);
          await onSubmitDescription(trimmed);
          setDescription("");
        }}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => setShowQuickAdd((value) => !value)}
        style={({ pressed }) => [
          styles.quickAddToggle,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.quickAddCopy}>
          <ThemedText size="sm">Quick add</ThemedText>
          <ThemedText size="sm" variant="secondary">
            Use exact calories and macros instead
          </ThemedText>
        </View>
        <ThemedText size="sm" variant="accent1">
          {showQuickAdd ? "Hide" : "Open"}
        </ThemedText>
      </Pressable>

      {showQuickAdd ? (
        <View style={styles.quickAddWrap}>
          <ManualMealForm onSubmit={onQuickAddSubmit} sectionTitle={null} surface="embedded" />
        </View>
      ) : null}

      <AnalysisQueueList
        allJobs={allJobs}
        jobs={jobs}
        onDismiss={onDismissJob}
        onOpenReview={onOpenReview}
        onRetry={onRetryJob}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  copy: {
    lineHeight: 20,
    marginBottom: 14,
  },
  eyebrow: {
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  error: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  fieldShell: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  hintChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  hintRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    fontSize: 15,
    fontWeight: "500",
    minHeight: 96,
    paddingBottom: 14,
  },
  quickAddToggle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickAddCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    paddingRight: 12,
  },
  quickAddWrap: {
    marginTop: 12,
  },
  title: {
    marginBottom: 8,
  },
});
