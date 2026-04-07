import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { DateTimeFieldsCard } from "../../../components/DateTimeFieldsCard";
import { ThemedText } from "../../../components/ThemedText";
import { api } from "../../../convex/_generated/api";
import {
  getLocalDateInputValue,
  getLocalTimeInputValue,
  parseTimestampFromLocalDateTime,
} from "../../../lib/domain/dayWindow";
import { useTheme } from "../../../lib/theme/ThemeProvider";

export default function HydrationEditScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ logId?: string }>();
  const logId = typeof params.logId === "string" ? params.logId : null;
  const hydrationLog = useQuery(api.hydration.getForEdit, logId ? { logId: logId as never } : "skip");
  const updateLog = useMutation(api.hydration.updateLog);
  const deleteLog = useMutation(api.hydration.deleteLog);
  const [initialized, setInitialized] = useState(false);
  const [amountOz, setAmountOz] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!hydrationLog || initialized) {
      return;
    }

    setAmountOz(String(hydrationLog.amountOz));
    setDateValue(getLocalDateInputValue(hydrationLog.timestamp, hydrationLog.timeZone));
    setTimeValue(getLocalTimeInputValue(hydrationLog.timestamp, hydrationLog.timeZone));
    setInitialized(true);
  }, [hydrationLog, initialized]);

  if (!logId || hydrationLog === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent1} size="small" />
      </View>
    );
  }

  if (!hydrationLog) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.emptyCard}>
          <ThemedText size="sm">Hydration log not found</ThemedText>
        </Card>
      </View>
    );
  }

  const save = async () => {
    const parsedAmount = Number(amountOz);
    const timestamp = parseTimestampFromLocalDateTime({
      dateKey: dateValue,
      timeValue,
      timeZone: hydrationLog.timeZone,
    });

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Use a valid ounce amount before saving.");
      return;
    }

    if (!timestamp) {
      setError("Use a valid date and time before saving.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await updateLog({
        amountOz: parsedAmount,
        logId: hydrationLog.id,
        timestamp,
      });
      router.back();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "This hydration log could not be updated."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete hydration log", "This will remove the saved hydration entry.", [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Delete",
        onPress: () => {
          void (async () => {
            await deleteLog({ logId: hydrationLog.id });
            router.back();
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <ThemedText
        onPress={() => router.back()}
        size="sm"
        variant="secondary"
        style={styles.backLink}
      >
        Back
      </ThemedText>
      <ThemedText size="xl" style={styles.title}>
        Edit hydration
      </ThemedText>

      <Card style={styles.card}>
        <ThemedText size="sm" style={styles.sectionTitle}>
          Amount
        </ThemedText>
        <TextInput
          keyboardType="numeric"
          onChangeText={setAmountOz}
          placeholder="16"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
              color: theme.text,
            },
          ]}
          value={amountOz}
        />
        <ThemedText size="sm" variant="secondary">
          {hydrationLog.displayLabel.trim()} entry, measured in ounces.
        </ThemedText>
      </Card>

      <DateTimeFieldsCard
        dateValue={dateValue}
        onDateChange={setDateValue}
        onTimeChange={setTimeValue}
        timeValue={timeValue}
      />

      {error ? (
        <ThemedText size="sm" variant="accent2" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.footerActions}>
        <Button label="Delete entry" onPress={confirmDelete} variant="secondary" />
        <Button
          label={isSaving ? "Saving..." : "Save changes"}
          onPress={() => {
            void save();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    marginBottom: 10,
  },
  card: {
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
  emptyCard: {
    width: "100%",
  },
  error: {
    marginBottom: 16,
  },
  footerActions: {
    gap: 10,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 18,
  },
});
