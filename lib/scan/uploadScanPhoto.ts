import { toByteArray } from "base64-js";
import { Id } from "../../convex/_generated/dataModel";
import { PendingScanPhoto } from "./types";

function createPhotoBlob(photo: PendingScanPhoto): Blob {
  const bytes = toByteArray(photo.base64);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return new Blob([buffer], { type: photo.mimeType });
}

export async function uploadScanPhoto(uploadUrl: string, photo: PendingScanPhoto): Promise<Id<"_storage">> {
  const blob = createPhotoBlob(photo);
  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(uploadUrl, {
      body: blob,
      headers: {
        "Content-Type": photo.mimeType,
      },
      method: "POST",
    });
  } catch {
    throw new Error("Meal photo upload could not reach Convex storage.");
  }

  if (!uploadResponse.ok) {
    throw new Error("Meal photo upload failed.");
  }

  const payload = (await uploadResponse.json()) as { storageId?: Id<"_storage"> };

  if (!payload.storageId) {
    throw new Error("Convex storage did not return a storage id.");
  }

  return payload.storageId;
}
