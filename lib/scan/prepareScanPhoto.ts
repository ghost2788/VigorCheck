import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { MealType } from "../domain/meals";
import { PendingScanPhoto } from "./types";

export class ScanPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanPhotoError";
  }
}

function buildPickerOptions() {
  return {
    mediaTypes: ["images"] as ImagePicker.MediaType[],
    quality: 1,
  };
}

async function prepareAsset(
  asset: ImagePicker.ImagePickerAsset,
  mealType: MealType
): Promise<PendingScanPhoto> {
  const width = asset.width ?? 1024;
  const height = asset.height ?? 1024;
  const longestEdge = Math.max(width, height);
  const scale = longestEdge > 1024 ? 1024 / longestEdge : 1;
  const result = await manipulateAsync(
    asset.uri,
    [
      {
        resize: {
          height: Math.round(height * scale),
          width: Math.round(width * scale),
        },
      },
    ],
    {
      base64: true,
      compress: 0.8,
      format: SaveFormat.JPEG,
    }
  );

  if (!result.base64) {
    throw new ScanPhotoError("The selected photo could not be encoded for upload.");
  }

  return {
    base64: result.base64,
    mealType,
    mimeType: "image/jpeg",
    uri: result.uri,
  };
}

export async function prepareScanPhoto(source: "camera" | "library", mealType: MealType) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new ScanPhotoError(
      source === "camera"
        ? "Camera access is required to scan a meal photo."
        : "Photo library access is required to import a meal photo."
    );
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(buildPickerOptions())
      : await ImagePicker.launchImageLibraryAsync(buildPickerOptions());

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];

  if (!asset?.uri) {
    throw new ScanPhotoError("The selected photo could not be prepared for scanning.");
  }

  return prepareAsset(asset, mealType);
}
