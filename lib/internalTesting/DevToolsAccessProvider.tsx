import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type DevToolsAccessContextValue = {
  isDevToolsTriggerRevealed: boolean;
  isDevToolsUnlocked: boolean;
  relockDevTools: () => void;
  resetDevToolsAccess: () => void;
  revealDevToolsTrigger: () => void;
  unlockDevTools: (unlockToken: string) => void;
  unlockToken: string | null;
};

const DevToolsAccessContext = createContext<DevToolsAccessContextValue | null>(null);

export function DevToolsAccessProvider({ children }: { children: React.ReactNode }) {
  const [isDevToolsTriggerRevealed, setIsDevToolsTriggerRevealed] = useState(false);
  const [unlockToken, setUnlockToken] = useState<string | null>(null);

  const revealDevToolsTrigger = useCallback(() => {
    setIsDevToolsTriggerRevealed(true);
  }, []);

  const unlockDevTools = useCallback((nextUnlockToken: string) => {
    setIsDevToolsTriggerRevealed(true);
    setUnlockToken(nextUnlockToken);
  }, []);

  const relockDevTools = useCallback(() => {
    setUnlockToken(null);
  }, []);

  const resetDevToolsAccess = useCallback(() => {
    setIsDevToolsTriggerRevealed(false);
    setUnlockToken(null);
  }, []);

  const value = useMemo(
    () => ({
      isDevToolsTriggerRevealed,
      isDevToolsUnlocked: Boolean(unlockToken),
      relockDevTools,
      resetDevToolsAccess,
      revealDevToolsTrigger,
      unlockDevTools,
      unlockToken,
    }),
    [
      isDevToolsTriggerRevealed,
      relockDevTools,
      resetDevToolsAccess,
      revealDevToolsTrigger,
      unlockDevTools,
      unlockToken,
    ]
  );

  return <DevToolsAccessContext.Provider value={value}>{children}</DevToolsAccessContext.Provider>;
}

export function useDevToolsAccess() {
  const context = useContext(DevToolsAccessContext);

  if (!context) {
    throw new Error("useDevToolsAccess must be used inside DevToolsAccessProvider");
  }

  return context;
}
