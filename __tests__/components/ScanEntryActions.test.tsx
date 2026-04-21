import React from "react";
import { render } from "../../lib/test-utils";
import { ScanEntryActions } from "../../components/ScanEntryActions";

describe("ScanEntryActions", () => {
  it("renders the polished hierarchy and a third barcode action when provided", () => {
    const { getByText } = render(
      <ScanEntryActions
        activeJobCount={2}
        description="Capture the meal fast, then review the estimate before anything is saved."
        eyebrow="Photo + Barcode"
        onBarcodePress={jest.fn()}
        onCameraPress={jest.fn()}
        onLibraryPress={jest.fn()}
      />
    );

    expect(getByText("Photo + Barcode")).toBeTruthy();
    expect(getByText("Scan a meal")).toBeTruthy();
    expect(
      getByText("Capture the meal fast, then review the estimate before anything is saved.")
    ).toBeTruthy();
    expect(getByText("2 in progress")).toBeTruthy();
    expect(getByText("Use camera")).toBeTruthy();
    expect(getByText("Choose photo")).toBeTruthy();
    expect(getByText("Scan barcode")).toBeTruthy();
  });

  it("hides the progress pill when scan rows are only ready or failed", () => {
    const { queryByText } = render(
      <ScanEntryActions
        activeJobCount={0}
        description="Capture the meal fast, then review the estimate before anything is saved."
        eyebrow="Photo + Barcode"
        onBarcodePress={jest.fn()}
        onCameraPress={jest.fn()}
        onLibraryPress={jest.fn()}
      />
    );

    expect(queryByText("1 in progress")).toBeNull();
    expect(queryByText("2 in progress")).toBeNull();
  });
});
