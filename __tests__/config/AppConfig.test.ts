const appConfig = require("../../app.json");

describe("app.json Android Play posture", () => {
  it("does not request microphone access on Android", () => {
    expect(appConfig.expo.android.permissions).not.toContain("android.permission.RECORD_AUDIO");
  });

  it("uses camera permission copy that matches barcode, meal, and supplement capture", () => {
    const cameraPlugin = appConfig.expo.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-camera"
    );
    const imagePickerPlugin = appConfig.expo.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-image-picker"
    );

    expect(cameraPlugin?.[1]?.cameraPermission).toBe(
      "Allow VigorCheck to scan barcodes and capture meal and supplement photos."
    );
    expect(cameraPlugin?.[1]?.microphonePermission).toBe(false);
    expect(cameraPlugin?.[1]?.recordAudioAndroid).toBe(false);
    expect(imagePickerPlugin?.[1]?.cameraPermission).toBe(
      "Allow VigorCheck to scan barcodes and capture meal and supplement photos."
    );
    expect(imagePickerPlugin?.[1]?.microphonePermission).toBe(false);
  });
});
