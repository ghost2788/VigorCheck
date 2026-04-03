import React from "react";
import { AccessibilityInfo } from "react-native";

type AccessibilityInfoWithMotion = typeof AccessibilityInfo & {
  addEventListener?: (
    eventName: string,
    handler: (enabled: boolean) => void
  ) => { remove?: () => void } | void;
  isReduceMotionEnabled?: () => Promise<boolean>;
};

export function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const info = AccessibilityInfo as AccessibilityInfoWithMotion;

    void info
      .isReduceMotionEnabled?.()
      ?.then((enabled) => {
        if (mounted) {
          setReduceMotion(Boolean(enabled));
        }
      })
      .catch(() => {});

    const subscription = info.addEventListener?.("reduceMotionChanged", (enabled) => {
      if (mounted) {
        setReduceMotion(Boolean(enabled));
      }
    });

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}
