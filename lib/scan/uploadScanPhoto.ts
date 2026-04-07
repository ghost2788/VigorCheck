import { Id } from "../../convex/_generated/dataModel";

type UploadablePhoto = {
  base64: string;
  mimeType: string;
  uri?: string;
};

async function createPhotoBlob(photo: UploadablePhoto): Promise<Blob> {
  const trimmedBase64 = photo.base64.trim();
  const source =
    trimmedBase64.length > 0
      ? `data:${photo.mimeType};base64,${trimmedBase64}`
      : photo.uri;

  if (!source) {
    throw new Error("The selected photo could not be read for upload.");
  }

  let localResponse: Response;

  try {
    localResponse = await fetch(source);
  } catch {
    throw new Error("The selected photo could not be read for upload.");
  }

  if (!localResponse.ok) {
    throw new Error("The selected photo could not be read for upload.");
  }

  return localResponse.blob();
}

export async function uploadScanPhoto(uploadUrl: string, photo: UploadablePhoto): Promise<Id<"_storage">> {
  const blob = await createPhotoBlob(photo);
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
    throw new Error("Photo upload could not reach Convex storage.");
  }

  if (!uploadResponse.ok) {
    throw new Error("Photo upload failed.");
  }

  const payload = (await uploadResponse.json()) as { storageId?: Id<"_storage"> };

  if (!payload.storageId) {
    throw new Error("Convex storage did not return a storage id.");
  }

  return payload.storageId;
}
