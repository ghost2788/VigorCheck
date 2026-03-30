import { useState } from "react";
import { getDefaultMealType } from "../domain/meals";
import { prepareScanPhoto } from "./prepareScanPhoto";
import { useScanFlow } from "./ScanFlowProvider";

export function useScanLauncher() {
  const { enqueuePhotoJob } = useScanFlow();
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const startScan = async (source: "camera" | "library") => {
    setIsPreparing(true);
    setError(null);

    try {
      const pendingPhoto = await prepareScanPhoto(source, getDefaultMealType());

      if (!pendingPhoto) {
        return false;
      }

      enqueuePhotoJob(pendingPhoto);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Meal scan could not start.");
      return false;
    } finally {
      setIsPreparing(false);
    }
  };

  return {
    clearScanLauncherError: () => setError(null),
    isPreparing,
    scanLauncherError: error,
    startScan,
  };
}
