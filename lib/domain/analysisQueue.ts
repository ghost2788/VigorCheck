import { Id } from "../../convex/_generated/dataModel";
import { MealType } from "./meals";
import { NutritionFields, ScanDraftItem } from "./scan";

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

export type RememberedShortcutCategory = "water" | "energy_drink" | "protein_shake" | "other";
export type RememberedShortcutLogMode = "hydration_only" | "hydration_and_nutrition";

export type RememberedHydrationShortcut = {
  calories: number;
  carbs: number;
  category: RememberedShortcutCategory;
  defaultAmountOz: number;
  fat: number;
  id: Id<"hydrationShortcuts">;
  label: string;
  lastUsedAt: number;
  logMode: RememberedShortcutLogMode;
  mealType?: MealType;
  micronutrients?: NutritionFields;
  pinned: boolean;
  protein: number;
};

export function getQueuedJobLabel(job: AnalysisJob, jobs: AnalysisJob[]) {
  const queuedJobs = jobs.filter((entry) => entry.status === "queued");
  const queuedPosition = queuedJobs.findIndex((entry) => entry.id === job.id) + 1;

  if (queuedPosition <= 1) {
    return "Waiting... (next)";
  }

  return `Waiting... (#${queuedPosition + 1})`;
}

export function sortRememberedShortcuts(shortcuts: RememberedHydrationShortcut[]) {
  return [...shortcuts].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    if (left.lastUsedAt !== right.lastUsedAt) {
      return right.lastUsedAt - left.lastUsedAt;
    }

    return left.label.localeCompare(right.label);
  });
}
