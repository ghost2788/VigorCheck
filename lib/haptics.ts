import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export async function triggerLightSuccessHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
