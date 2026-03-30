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

    let actionCall = 0;
    mockUseAction.mockImplementation(() => {
      const next = actionCall % 2 === 0 ? analyzePhoto : analyzeText;
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
});
