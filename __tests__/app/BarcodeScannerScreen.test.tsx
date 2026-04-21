import React from "react";
import { StyleSheet } from "react-native";
import { render } from "../../lib/test-utils";
import BarcodeScannerScreen from "../../app/scan/barcode";
import { colors } from "../../lib/theme/colors";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock("expo-camera", () => ({
  CameraView: (props: Record<string, unknown>) => {
    const { View: MockView } = require("react-native");
    return <MockView testID="barcode-camera-view" {...props} />;
  },
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 24,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

jest.mock("../../lib/scan/ScanFlowProvider", () => ({
  useScanFlow: () => ({
    enqueueBarcodeJob: jest.fn(),
  }),
}));

describe("BarcodeScannerScreen", () => {
  it("renders a visible scan frame and simplified bottom card", () => {
    const { getByTestId, getByText, queryByText } = render(<BarcodeScannerScreen />);

    expect(getByTestId("barcode-camera-view")).toBeTruthy();
    expect(getByTestId("barcode-scan-frame")).toBeTruthy();
    expect(getByText("Scan barcode")).toBeTruthy();
    expect(queryByText("Packaged foods only. Works best with major brands.")).toBeNull();
  });

  it("derives overlay and frame colors from the active theme", () => {
    const darkScreen = render(<BarcodeScannerScreen />, { initialThemePreference: "dark" });
    const lightScreen = render(<BarcodeScannerScreen />, { initialThemePreference: "light" });

    expect(StyleSheet.flatten(darkScreen.getByTestId("barcode-scan-frame").props.style).borderColor).toBe(
      colors.dark.textTertiary
    );
    expect(
      StyleSheet.flatten(darkScreen.getByTestId("barcode-overlay-card").props.style).backgroundColor
    ).toBe("rgba(26, 24, 20, 0.9)");

    expect(StyleSheet.flatten(lightScreen.getByTestId("barcode-scan-frame").props.style).borderColor).toBe(
      colors.light.textTertiary
    );
    expect(
      StyleSheet.flatten(lightScreen.getByTestId("barcode-overlay-card").props.style).backgroundColor
    ).toBe("rgba(236, 231, 223, 0.92)");
  });
});
