import { Id } from "../../convex/_generated/dataModel";
import { MealType } from "../domain/meals";
import { ScanConfidence, ScanDraftItem } from "../domain/scan";

export type PendingScanPhoto = {
  base64: string;
  mealType: MealType;
  mimeType: string;
  uri: string;
};

export type ScanDraft = {
  items: ScanDraftItem[];
  mealType: MealType;
  overallConfidence: ScanConfidence;
  photoStorageId: Id<"_storage">;
};
