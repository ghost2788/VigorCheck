import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export type PendingSupplementPhoto = {
  base64: string;
  mimeType: string;
  uri: string;
};

export class SupplementPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplementPhotoError";
  }
}

function buildPickerOptions() {
  return {
    mediaTypes: ["images"] as ImagePicker.MediaType[],
    quality: 1,
  };
}

async function prepareAsset(
  asset: ImagePicker.ImagePickerAsset
): Promise<PendingSupplementPhoto> {
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
    throw new SupplementPhotoError("The selected supplement photo could not be encoded for upload.");
  }

  return {
    base64: result.base64,
    mimeType: "image/jpeg",
    uri: result.uri,
  };
}

export async function prepareSupplementPhoto(source: "camera" | "library") {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new SupplementPhotoError(
      source === "camera"
        ? "Camera access is required to scan supplement labels."
        : "Photo library access is required to import supplement label photos."
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
    throw new SupplementPhotoError("The selected supplement photo could not be prepared.");
  }

  return prepareAsset(asset);
}
