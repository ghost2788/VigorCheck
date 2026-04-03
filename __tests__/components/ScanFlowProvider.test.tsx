import React from "react";
import { waitFor, render } from "../../lib/test-utils";
import { ScanFlowProvider, useScanFlow } from "../../lib/scan/ScanFlowProvider";
import { ThemedText } from "../../components/ThemedText";

const mockUseAction = jest.fn();

jest.mock("convex/react", () => ({
  useAction: (...args: unknown[]) => mockUseAction(...args),
}));

function QueueProbe() {
  const { enqueueTextJob, jobs } = useScanFlow();
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    enqueueTextJob({
      description: "2 eggs, toast, coffee",
      mealType: "breakfast",
    });
  }, [enqueueTextJob]);

  return (
    <>
      {jobs.map((job) => (
        <ThemedText key={job.id}>{job.status}</ThemedText>
      ))}
    </>
  );
}

function BarcodeQueueProbe() {
  const { barcodeFallback, enqueueBarcodeJob, jobs } = useScanFlow();
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    enqueueBarcodeJob({
      code: "012345678905",
      mealType: "snack",
    });
  }, [enqueueBarcodeJob]);

  return (
    <>
      {jobs.map((job) => (
        <ThemedText key={job.id}>{job.status}</ThemedText>
      ))}
      {barcodeFallback ? <ThemedText>{barcodeFallback.code}</ThemedText> : null}
    </>
  );
}

describe("ScanFlowProvider", () => {
  beforeEach(() => {
    mockUseAction.mockReset();
  });

  it("advances a completed text-analysis job from analyzing to ready", async () => {
    const analyzePhoto = jest.fn();
    const analyzeText = jest.fn().mockResolvedValue({
      entryMethod: "ai_text",
      items: [],
      mealType: "breakfast",
      overallConfidence: "medium",
    });
    const lookupBarcode = jest.fn();

    let actionCall = 0;
    mockUseAction.mockImplementation(() => {
      const next =
        actionCall % 3 === 0
          ? analyzePhoto
          : actionCall % 3 === 1
            ? analyzeText
            : lookupBarcode;
      actionCall += 1;
      return next;
    });

    const { getByText } = render(
      <ScanFlowProvider>
        <QueueProbe />
      </ScanFlowProvider>
    );

    await waitFor(() => expect(analyzeText).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText("ready")).toBeTruthy());
  });

  it("stores a barcode fallback when lookup data is missing", async () => {
    const analyzePhoto = jest.fn();
    const analyzeText = jest.fn();
    const lookupBarcode = jest.fn().mockResolvedValue({
      code: "012345678905",
      kind: "fallback",
      message: "This barcode could not be matched to a complete product.",
    });

    let actionCall = 0;
    mockUseAction.mockImplementation(() => {
      const next =
        actionCall % 3 === 0
          ? analyzePhoto
          : actionCall % 3 === 1
            ? analyzeText
            : lookupBarcode;
      actionCall += 1;
      return next;
    });

    const { getByText, queryByText } = render(
      <ScanFlowProvider>
        <BarcodeQueueProbe />
      </ScanFlowProvider>
    );

    await waitFor(() => expect(lookupBarcode).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText("012345678905")).toBeTruthy());
    expect(queryByText("queued")).toBeNull();
    expect(queryByText("analyzing")).toBeNull();
  });
});
