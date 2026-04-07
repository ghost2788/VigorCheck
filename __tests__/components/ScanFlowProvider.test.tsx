import React from "react";
import { Pressable } from "react-native";
import { fireEvent, waitFor, render } from "../../lib/test-utils";
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

function QueueErrorProbe() {
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
        <React.Fragment key={job.id}>
          <ThemedText>{job.status}</ThemedText>
          {job.error ? <ThemedText>{job.error}</ThemedText> : null}
        </React.Fragment>
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

function AnnouncementProbe() {
  const {
    announceReviewedSave,
    clearReviewedSaveAnnouncement,
    reviewedSaveAnnouncement,
  } = useScanFlow();

  return (
    <>
      <Pressable onPress={() => announceReviewedSave("Meal added")}>
        <ThemedText>announce-meal</ThemedText>
      </Pressable>
      <Pressable onPress={() => announceReviewedSave("Drink added")}>
        <ThemedText>announce-drink</ThemedText>
      </Pressable>
      <Pressable onPress={clearReviewedSaveAnnouncement}>
        <ThemedText>clear</ThemedText>
      </Pressable>
      {reviewedSaveAnnouncement ? (
        <>
          <ThemedText>{reviewedSaveAnnouncement.id}</ThemedText>
          <ThemedText>{reviewedSaveAnnouncement.message}</ThemedText>
        </>
      ) : (
        <ThemedText>no-announcement</ThemedText>
      )}
    </>
  );
}

function AnnouncementRouteProbe() {
  const [route, setRoute] = React.useState<"review" | "log">("review");

  return (
    <>
      <Pressable onPress={() => setRoute("log")}>
        <ThemedText>switch-to-log</ThemedText>
      </Pressable>
      {route === "review" ? <AnnouncementProbe /> : <AnnouncementReader />}
    </>
  );
}

function AnnouncementReader() {
  const { reviewedSaveAnnouncement } = useScanFlow();

  return (
    <ThemedText>
      {reviewedSaveAnnouncement ? reviewedSaveAnnouncement.message : "no-announcement"}
    </ThemedText>
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

  it("surfaces quota errors from AI text analysis jobs", async () => {
    const analyzePhoto = jest.fn();
    const analyzeText = jest
      .fn()
      .mockRejectedValue(
        new Error(
          "You've used all 100 AI text entries in your free trial. Start the monthly plan to continue."
        )
      );
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
        <QueueErrorProbe />
      </ScanFlowProvider>
    );

    await waitFor(() => expect(analyzeText).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText("failed")).toBeTruthy());
    expect(
      getByText(
        "You've used all 100 AI text entries in your free trial. Start the monthly plan to continue."
      )
    ).toBeTruthy();
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

  it("announces reviewed-save success and keeps it until explicitly cleared", () => {
    const { getByText, queryByText } = render(
      <ScanFlowProvider>
        <AnnouncementProbe />
      </ScanFlowProvider>
    );

    fireEvent.press(getByText("announce-meal"));

    expect(getByText("Meal added")).toBeTruthy();
    expect(queryByText("no-announcement")).toBeNull();
  });

  it("keeps the reviewed-save announcement when consumers change", () => {
    const { getByText } = render(
      <ScanFlowProvider>
        <AnnouncementRouteProbe />
      </ScanFlowProvider>
    );

    fireEvent.press(getByText("announce-meal"));
    fireEvent.press(getByText("switch-to-log"));

    expect(getByText("Meal added")).toBeTruthy();
  });

  it("generates a fresh announcement id when the same message is announced twice", () => {
    const { getAllByText, getByText, queryByText } = render(
      <ScanFlowProvider>
        <AnnouncementProbe />
      </ScanFlowProvider>
    );

    fireEvent.press(getByText("announce-meal"));
    const firstId = getAllByText(/reviewed-save-/i)[0].props.children;

    fireEvent.press(getByText("announce-meal"));
    const secondId = getAllByText(/reviewed-save-/i)[0].props.children;

    expect(firstId).not.toBe(secondId);
    expect(getByText("Meal added")).toBeTruthy();
    expect(queryByText("no-announcement")).toBeNull();
  });
});
