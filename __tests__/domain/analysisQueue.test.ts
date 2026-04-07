import {
  AnalysisJob,
  getQueuedJobLabel,
} from "../../lib/domain/analysisQueue";

function createJob(
  overrides: Partial<AnalysisJob> & Pick<AnalysisJob, "id" | "originCard" | "source" | "status">
): AnalysisJob {
  const input =
    overrides.source === "photo"
      ? { type: "photo" }
      : overrides.source === "barcode"
        ? { code: "012345678905", mealType: "snack", type: "barcode" }
        : { type: "text" };

  return {
    createdAt: 0,
    input: input as AnalysisJob["input"],
    labelPreview: overrides.id,
    ...overrides,
  };
}

describe("analysis queue helpers", () => {
  it("labels queued jobs by their position in the sequential queue", () => {
    const jobs: AnalysisJob[] = [
      createJob({ id: "scan-running", originCard: "scan", source: "photo", status: "analyzing" }),
      createJob({ id: "scan-next", originCard: "scan", source: "photo", status: "queued" }),
      createJob({ id: "text-third", originCard: "text", source: "text", status: "queued" }),
    ];

    expect(getQueuedJobLabel(jobs[1], jobs)).toBe("Waiting... (next)");
    expect(getQueuedJobLabel(jobs[2], jobs)).toBe("Waiting... (#3)");
  });
});
