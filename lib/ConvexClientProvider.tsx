import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import React, { ReactNode, useEffect, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient, getConvexUrl } from "./auth/authClient";

let hasWarnedMissingUrl = false;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = getConvexUrl();
  const { data: session } = authClient.useSession();
  const sessionKey = session?.session?.id ?? "signed-out";

  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl, sessionKey]);

  useEffect(() => {
    return () => {
      void client?.close();
    };
  }, [client]);

  if (!client) {
    if (__DEV__ && !hasWarnedMissingUrl) {
      hasWarnedMissingUrl = true;
      console.warn(
        "ConvexClientProvider: EXPO_PUBLIC_CONVEX_URL is not set. Running without a live Convex connection."
      );
    }

    return <>{children}</>;
  }

  return (
    <ConvexBetterAuthProvider
      authClient={authClient}
      client={client}
      key={sessionKey}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
