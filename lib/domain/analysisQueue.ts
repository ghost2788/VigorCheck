import { Id } from "../../convex/_generated/dataModel";
import { MealType } from "./meals";
import { ScanDraftItem } from "./scan";

export type AnalysisJobStatus = "queued" | "analyzing" | "ready" | "failed";
export type AnalysisJobSource = "photo" | "text" | "barcode";
export type AnalysisJobOriginCard = "scan" | "text";

export type AnalysisDraft = {
  entryMethod: "ai_text" | "photo_scan" | "barcode";
  items: ScanDraftItem[];
  mealType: MealType;
  overallConfidence: "high" | "medium" | "low";
  photoStorageId?: Id<"_storage">;
};

export type PhotoAnalysisInput = {
  base64: string;
  mealType: MealType;
  mimeType: string;
  uri: string;
  type: "photo";
};

export type TextAnalysisInput = {
  description: string;
  mealType: MealType;
  type: "text";
};

export type BarcodeAnalysisInput = {
  code: string;
  mealType: MealType;
  type: "barcode";
};

export type AnalysisJobInput = PhotoAnalysisInput | TextAnalysisInput | BarcodeAnalysisInput;

export type BarcodeLookupFallback = {
  code: string;
  message: string;
};

export type BarcodeLookupResult =
  | {
      draft: AnalysisDraft;
      kind: "success";
    }
  | ({
      kind: "fallback";
    } & BarcodeLookupFallback);

export type AnalysisJob = {
  createdAt: number;
  draft?: AnalysisDraft;
  error?: string;
  id: string;
  input: AnalysisJobInput;
  labelPreview: string;
  originCard: AnalysisJobOriginCard;
  source: AnalysisJobSource;
  status: AnalysisJobStatus;
};

export function getQueuedJobLabel(job: AnalysisJob, jobs: AnalysisJob[]) {
  const queuedJobs = jobs.filter((entry) => entry.status === "queued");
  const queuedPosition = queuedJobs.findIndex((entry) => entry.id === job.id) + 1;

  if (queuedPosition <= 1) {
    return "Waiting... (next)";
  }

  return `Waiting... (#${queuedPosition + 1})`;
}
