import { Id } from "../../convex/_generated/dataModel";
import { MealType } from "./meals";
import { NutritionFields, ScanDraftItem } from "./scan";

export type AnalysisJobStatus = "queued" | "analyzing" | "ready" | "failed";
export type AnalysisJobSource = "photo" | "text";
export type AnalysisJobOriginCard = "scan" | "text";

export type AnalysisDraft = {
  entryMethod: "ai_text" | "photo_scan";
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

export type AnalysisJobInput = PhotoAnalysisInput | TextAnalysisInput;

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
