import React, { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

let hasWarnedMissingUrl = false;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!client) {
    if (__DEV__ && !hasWarnedMissingUrl) {
      hasWarnedMissingUrl = true;
      console.warn(
        "ConvexClientProvider: EXPO_PUBLIC_CONVEX_URL is not set. Running without a live Convex connection."
      );
    }

    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
