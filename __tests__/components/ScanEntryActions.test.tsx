import React from "react";
import { render } from "../../lib/test-utils";
import { ScanEntryActions } from "../../components/ScanEntryActions";

describe("ScanEntryActions", () => {
  it("renders a third barcode action when provided", () => {
    const { getByText } = render(
      <ScanEntryActions
        onBarcodePress={jest.fn()}
        onCameraPress={jest.fn()}
        onLibraryPress={jest.fn()}
      />
    );

    expect(getByText("Use camera")).toBeTruthy();
    expect(getByText("Choose photo")).toBeTruthy();
    expect(getByText("Scan barcode")).toBeTruthy();
  });
});
