import React, { useState } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ThemedText } from "../../components/ThemedText";
import { getSupportedBarcodeTypes, isSupportedBarcodeType } from "../../lib/domain/barcode";
import { getDefaultMealType } from "../../lib/domain/meals";
import { useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { useTheme } from "../../lib/theme/ThemeProvider";

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { enqueueBarcodeJob } = useScanFlow();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasHandledScan, setHasHandledScan] = useState(false);

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText variant="secondary">Starting camera...</ThemedText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Card style={styles.permissionCard}>
          <ThemedText size="sm" style={styles.permissionTitle}>
            Camera access needed
          </ThemedText>
          <ThemedText variant="secondary" style={styles.permissionCopy}>
            Barcode scanning needs camera access for packaged foods.
          </ThemedText>
          <View style={styles.permissionActions}>
            <Button label="Allow camera" onPress={() => void requestPermission()} />
            <Button label="Back to Log" onPress={() => router.back()} variant="secondary" />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: getSupportedBarcodeTypes() as never,
        }}
        onBarcodeScanned={({ data, type }) => {
          if (hasHandledScan || !data || !isSupportedBarcodeType(type)) {
            return;
          }

          setHasHandledScan(true);
          enqueueBarcodeJob({
            code: data.trim(),
            mealType: getDefaultMealType(),
          });
          router.back();
        }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.frameLayer}>
        <View
          style={[
            styles.scanFrame,
            {
              borderColor: "rgba(255,255,255,0.28)",
            },
          ]}
          testID="barcode-scan-frame"
        >
          <View
            style={[
              styles.corner,
              styles.cornerTopLeft,
              { borderColor: theme.accent2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerTopRight,
              { borderColor: theme.accent2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBottomLeft,
              { borderColor: theme.accent2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBottomRight,
              { borderColor: theme.accent2 },
            ]}
          />
        </View>
      </View>

      <View
        style={[
          styles.overlay,
          {
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Card
          style={[
            styles.overlayCard,
            {
              backgroundColor: "rgba(26, 24, 20, 0.9)",
            },
          ]}
        >
          <ThemedText size="sm" style={styles.overlayTitle}>
            Scan barcode
          </ThemedText>
          <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  corner: {
    height: 26,
    position: "absolute",
    width: 26,
  },
  cornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: -2,
    left: -2,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: -2,
    right: -2,
    borderBottomRightRadius: 18,
  },
  cornerTopLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: -2,
    top: -2,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: -2,
    top: -2,
    borderTopRightRadius: 18,
  },
  frameLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 24,
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  overlayCard: {
    gap: 10,
  },
  overlayTitle: {
    marginBottom: 2,
  },
  permissionActions: {
    gap: 10,
  },
  permissionCard: {
    width: "100%",
  },
  permissionCopy: {
    marginBottom: 16,
  },
  permissionTitle: {
    marginBottom: 8,
  },
  screen: {
    flex: 1,
  },
  scanFrame: {
    borderRadius: 24,
    borderWidth: 1,
    height: 190,
    maxWidth: 340,
    width: "100%",
  },
});
