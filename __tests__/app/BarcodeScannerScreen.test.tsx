import React from "react";
import { render } from "../../lib/test-utils";
import BarcodeScannerScreen from "../../app/scan/barcode";

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
});
