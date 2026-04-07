import { uploadScanPhoto } from "../../lib/scan/uploadScanPhoto";

describe("uploadScanPhoto", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("prefers the base64 data uri over the local file uri when preparing the upload blob", async () => {
    const blob = { mock: "blob" } as unknown as Blob;
    const fetchMock = global.fetch as jest.Mock;

    fetchMock
      .mockResolvedValueOnce({
        blob: jest.fn().mockResolvedValue(blob),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ storageId: "storage-1" }),
        ok: true,
      });

    await uploadScanPhoto("https://upload.test/photo", {
      base64: "abc123",
      mimeType: "image/jpeg",
      uri: "file://photo.jpg",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "data:image/jpeg;base64,abc123");
  });
});
