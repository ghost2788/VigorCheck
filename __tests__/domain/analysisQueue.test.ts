import { Id } from "../../convex/_generated/dataModel";
import {
  AnalysisJob,
  RememberedHydrationShortcut,
  getQueuedJobLabel,
  sortRememberedShortcuts,
} from "../../lib/domain/analysisQueue";

function createShortcut(
  overrides: Partial<Omit<RememberedHydrationShortcut, "id">> & { id: string; label: string }
): RememberedHydrationShortcut {
  return {
    calories: 0,
    carbs: 0,
    category: "water",
    defaultAmountOz: 8,
    fat: 0,
    lastUsedAt: 0,
    logMode: "hydration_only",
    pinned: false,
    protein: 0,
    ...overrides,
    id: overrides.id as Id<"hydrationShortcuts">,
  };
}

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

  it("sorts remembered shortcuts pinned first then by most recent use", () => {
    const sorted = sortRememberedShortcuts([
      createShortcut({ id: "recent-water", label: "Water 16 oz", lastUsedAt: 20 }),
      createShortcut({ id: "older-pinned", label: "Red Bull", lastUsedAt: 10, pinned: true }),
      createShortcut({ id: "newer-pinned", label: "Protein shake", lastUsedAt: 30, pinned: true }),
      createShortcut({ id: "older-water", label: "Water 8 oz", lastUsedAt: 5 }),
    ]);

    expect(sorted.map((shortcut) => String(shortcut.id))).toEqual([
      "newer-pinned",
      "older-pinned",
      "recent-water",
      "older-water",
    ]);
  });
});
