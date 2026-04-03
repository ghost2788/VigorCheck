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
      <ThemedText size="sm" style={styles.title}>
        Describe a meal
      </ThemedText>
      <ThemedText variant="secondary" style={styles.copy}>
        Type what you ate and review the AI estimate before anything is saved.
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
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
            color: theme.text,
          },
        ]}
        textAlignVertical="top"
        value={description}
      />

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
        <ThemedText size="sm">Quick add</ThemedText>
        <ThemedText size="sm" variant="secondary">
          {showQuickAdd ? "Hide manual form" : "Use exact macros instead"}
        </ThemedText>
      </Pressable>

      {showQuickAdd ? (
        <View style={styles.quickAddWrap}>
          <ManualMealForm onSubmit={onQuickAddSubmit} />
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
  error: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickAddToggle: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickAddWrap: {
    marginTop: 12,
  },
  title: {
    marginBottom: 8,
  },
});
