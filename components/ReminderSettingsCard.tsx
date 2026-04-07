import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, Switch, View, ViewStyle } from "react-native";
import {
  formatClockTime,
  hasAnyReminderEnabled,
  parseClockTime,
  ReminderSettings,
  validateReminderWindow,
} from "../lib/domain/reminders";
import { useTheme } from "../lib/theme/ThemeProvider";
import { getReminderPermissionsStatus, requestReminderPermissions } from "../lib/reminders/notifications";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ReminderSettingsCardProps = {
  initialSettings: ReminderSettings;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (settings: ReminderSettings) => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
};

type ReminderToggleKey =
  | "notifyHydration"
  | "notifyMealLogging"
  | "notifyGoalCompletion"
  | "notifyEndOfDay";

type PickerField = "wakeTime" | "sleepTime" | null;

const TOGGLE_ROWS: Array<{
  helper: string;
  key: ReminderToggleKey;
  label: string;
}> = [
  {
    helper: "Adaptive nudges when hydration is still behind target.",
    key: "notifyHydration",
    label: "Hydration",
  },
  {
    helper: "Check-ins when meal logging has gone quiet.",
    key: "notifyMealLogging",
    label: "Meal logging",
  },
  {
    helper: "A one-time nudge when calories, protein, and hydration are complete.",
    key: "notifyGoalCompletion",
    label: "Goal completion",
  },
  {
    helper: "A summary reminder shortly before your saved sleep time.",
    key: "notifyEndOfDay",
    label: "End of day",
  },
];

function buildPickerDate(timeValue: string) {
  const parsed = parseClockTime(timeValue) ?? { hour: 7, minute: 0 };
  return new Date(2026, 0, 1, parsed.hour, parsed.minute, 0, 0);
}

function formatDisplayTime(timeValue: string) {
  const parsed = parseClockTime(timeValue);

  if (!parsed) {
    return "--:--";
  }

  return new Date(2026, 0, 1, parsed.hour, parsed.minute, 0, 0).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReminderSettingsCard({
  initialSettings,
  onDirtyChange,
  onSave,
  style,
}: ReminderSettingsCardProps) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    if (!onDirtyChange) {
      return;
    }

    onDirtyChange(JSON.stringify(settings) !== JSON.stringify(initialSettings));
  }, [initialSettings, onDirtyChange, settings]);

  const pickerValue = useMemo(() => {
    if (!pickerField) {
      return buildPickerDate(settings.wakeTime);
    }

    return buildPickerDate(settings[pickerField]);
  }, [pickerField, settings]);

  const updateToggle = (key: ReminderToggleKey, value: boolean) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateTime = (field: Exclude<PickerField, null>, date: Date) => {
    setSettings((current) => ({
      ...current,
      [field]: formatClockTime({
        hour: date.getHours(),
        minute: date.getMinutes(),
      }),
    }));
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setPickerField(null);
    }

    if (event.type === "dismissed" || !selectedDate || !pickerField) {
      return;
    }

    updateTime(pickerField, selectedDate);
  };

  const submit = async () => {
    const validationError = validateReminderWindow(settings);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      if (hasAnyReminderEnabled(settings)) {
        const existingPermission = await getReminderPermissionsStatus();
        const permissionStatus =
          existingPermission === "granted" ? existingPermission : await requestReminderPermissions();

        if (permissionStatus !== "granted") {
          setSettings((current) => ({
            ...current,
            notifyEndOfDay: false,
            notifyGoalCompletion: false,
            notifyHydration: false,
            notifyMealLogging: false,
          }));
          setError("Notification permission is required to enable reminders.");
          return;
        }
      }

      setError(null);
      await onSave(settings);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Reminder settings could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <ThemedText size="sm" style={styles.title}>
          Reminder settings
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Reminders stay between your saved wake and sleep times.
        </ThemedText>
      </View>

      <View style={styles.toggleList}>
        {TOGGLE_ROWS.map((row) => (
          <View
            key={row.key}
            style={[
              styles.toggleRow,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.toggleCopy}>
              <ThemedText size="sm">{row.label}</ThemedText>
              <ThemedText variant="secondary" style={styles.toggleHelper}>
                {row.helper}
              </ThemedText>
            </View>
            <Switch
              onValueChange={(value) => updateToggle(row.key, value)}
              testID={`${row.key}Toggle`}
              thumbColor={theme.background}
              trackColor={{
                false: theme.textMuted,
                true: theme.accent1,
              }}
              value={settings[row.key]}
            />
          </View>
        ))}
      </View>

      <View style={styles.timeRow}>
        <TimeField
          label="Wake time"
          onPress={() => setPickerField("wakeTime")}
          testID="wakeTimeButton"
          value={formatDisplayTime(settings.wakeTime)}
        />
        <TimeField
          label="Sleep time"
          onPress={() => setPickerField("sleepTime")}
          testID="sleepTimeButton"
          value={formatDisplayTime(settings.sleepTime)}
        />
      </View>

      {pickerField ? (
        <View
          style={[
            styles.pickerShell,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <DateTimePicker
            display={Platform.OS === "ios" ? "spinner" : "default"}
            mode="time"
            onChange={handlePickerChange}
            value={pickerValue}
          />
          {Platform.OS === "ios" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerField(null)}
              style={[
                styles.donePill,
                {
                  backgroundColor: theme.surfaceStrong,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <ThemedText size="xs" variant="secondary">
                Done
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <ThemedText variant="accent2" size="sm" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Button label={isSaving ? "Saving..." : "Save reminders"} onPress={submit} />
    </Card>
  );
}

function TimeField({
  label,
  onPress,
  testID,
  value,
}: {
  label: string;
  onPress: () => void;
  testID: string;
  value: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.timeField}>
      <ThemedText size="xs" variant="tertiary" style={styles.timeLabel}>
        {label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[
          styles.timeButton,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.cardBorder,
          },
        ]}
        testID={testID}
      >
        <ThemedText>{value}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
  },
  donePill: {
    alignSelf: "flex-end",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: {
    marginBottom: 14,
    marginTop: 6,
    textTransform: "none",
  },
  header: {
    marginBottom: 14,
  },
  pickerShell: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 8,
  },
  subtitle: {
    lineHeight: 21,
    marginTop: 6,
  },
  timeButton: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: 8,
  },
  timeRow: {
    columnGap: 12,
    flexDirection: "row",
    marginBottom: 14,
  },
  title: {
    marginBottom: 2,
  },
  toggleCopy: {
    flex: 1,
    marginRight: 12,
  },
  toggleHelper: {
    lineHeight: 19,
    marginTop: 4,
  },
  toggleList: {
    marginBottom: 14,
    rowGap: 10,
  },
  toggleRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
