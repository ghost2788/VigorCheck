import path from "node:path";
import sharp from "sharp";

const ANDROID_ADAPTIVE_ICON_SIZE = 432;
const ANDROID_SAFE_ZONE_RATIO = 66 / 108;
const MAX_SAFE_ZONE_SIZE = Math.floor(ANDROID_ADAPTIVE_ICON_SIZE * ANDROID_SAFE_ZONE_RATIO);

async function getAlphaBounds(filePath: string) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];

      if (alpha === 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    maxX,
    maxY,
    minX,
    minY,
    usedHeight: maxY - minY + 1,
    usedWidth: maxX - minX + 1,
  };
}

describe("android adaptive icon assets", () => {
  const foregroundAssetPath = path.resolve(
    __dirname,
    "../../assets/android-icon-foreground.png"
  );
  const monochromeAssetPath = path.resolve(
    __dirname,
    "../../assets/android-icon-monochrome.png"
  );

  it.each([
    ["foreground", foregroundAssetPath],
    ["monochrome", monochromeAssetPath],
  ])("keeps the %s artwork inside Android's adaptive safe zone", async (_label, filePath) => {
    const bounds = await getAlphaBounds(filePath);

    expect(bounds.usedWidth).toBeLessThanOrEqual(MAX_SAFE_ZONE_SIZE);
    expect(bounds.usedHeight).toBeLessThanOrEqual(MAX_SAFE_ZONE_SIZE);
  });
});
