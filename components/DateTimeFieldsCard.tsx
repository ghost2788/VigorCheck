import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type DateTimeFieldsCardProps = {
  dateValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  timeValue: string;
  title?: string;
};

export function DateTimeFieldsCard({
  dateValue,
  onDateChange,
  onTimeChange,
  timeValue,
  title = "Log time",
}: DateTimeFieldsCardProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card}>
      <ThemedText size="sm" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.row}>
        <View style={styles.field}>
          <ThemedText size="xs" variant="tertiary" style={styles.label}>
            Date
          </ThemedText>
          <TextInput
            autoCapitalize="none"
            onChangeText={onDateChange}
            placeholder="2026-03-31"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
                color: theme.text,
              },
            ]}
            value={dateValue}
          />
        </View>
        <View style={styles.field}>
          <ThemedText size="xs" variant="tertiary" style={styles.label}>
            Time
          </ThemedText>
          <TextInput
            autoCapitalize="none"
            onChangeText={onTimeChange}
            placeholder="17:12"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.cardBorder,
                color: theme.text,
              },
            ]}
            value={timeValue}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  field: {
    flex: 1,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    marginBottom: 8,
  },
  row: {
    columnGap: 12,
    flexDirection: "row",
  },
  title: {
    marginBottom: 12,
  },
});
