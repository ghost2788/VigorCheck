import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ScanEntryActionsProps = {
  activeJobCount?: number;
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  error?: string | null;
  isPreparing?: boolean;
  onBarcodePress?: () => void;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  title?: string;
};

export function ScanEntryActions({
  activeJobCount = 0,
  children,
  description,
  eyebrow,
  error,
  isPreparing = false,
  onBarcodePress,
  onCameraPress,
  onLibraryPress,
  title = "Scan a meal",
}: ScanEntryActionsProps) {
  const { theme } = useTheme();

  return (
    <Card>
      {eyebrow ? (
        <ThemedText size="xs" style={[styles.eyebrow, { color: theme.accent3 }]}>
          {eyebrow}
        </ThemedText>
      ) : null}
      <ThemedText size="md" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText size="sm" style={styles.copy} variant="secondary">
          {description}
        </ThemedText>
      ) : null}
      <Button
        label={isPreparing ? "Preparing..." : "Use camera"}
        onPress={onCameraPress}
        style={styles.primaryAction}
        variant="primary"
      />
      <View style={styles.secondaryRow}>
        <Button
          label="Choose photo"
          onPress={onLibraryPress}
          style={onBarcodePress ? styles.secondaryAction : styles.fullWidthSecondaryAction}
          variant="secondary"
        />
        {onBarcodePress ? (
          <Button
            label="Scan barcode"
            onPress={onBarcodePress}
            style={styles.secondaryAction}
            variant="secondary"
          />
        ) : null}
      </View>
      {activeJobCount > 0 ? (
        <View
          style={[
            styles.progressPill,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.progressDot,
              {
                backgroundColor: theme.accent3,
                shadowColor: theme.accent3,
              },
            ]}
          />
          <ThemedText size="xs" style={{ color: theme.accent3 }}>
            {activeJobCount} in progress
          </ThemedText>
        </View>
      ) : null}
      {error ? (
        <ThemedText variant="accent2" size="sm" style={[styles.error, { color: theme.accent2 }]}>
          {error}
        </ThemedText>
      ) : null}
      {children}
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
    marginTop: 14,
    textTransform: "none",
  },
  fullWidthSecondaryAction: {
    width: "100%",
  },
  primaryAction: {
    marginBottom: 10,
  },
  progressDot: {
    borderRadius: 999,
    height: 7,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    width: 7,
  },
  progressPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryAction: {
    flex: 1,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  title: {
    marginBottom: 8,
  },
});
