import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";
import { ThemedText } from "./ThemedText";

type ScanEntryActionsProps = {
  children?: ReactNode;
  error?: string | null;
  isPreparing?: boolean;
  onBarcodePress?: () => void;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  title?: string;
};

export function ScanEntryActions({
  children,
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
      <ThemedText size="sm" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.actions}>
        <Button label={isPreparing ? "Preparing..." : "Use camera"} onPress={onCameraPress} />
        <Button label="Choose photo" onPress={onLibraryPress} variant="secondary" />
        {onBarcodePress ? (
          <Button label="Scan barcode" onPress={onBarcodePress} variant="secondary" />
        ) : null}
      </View>
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
  actions: {
    gap: 10,
  },
  error: {
    marginTop: 14,
    textTransform: "none",
  },
  title: {
    marginBottom: 14,
  },
});
