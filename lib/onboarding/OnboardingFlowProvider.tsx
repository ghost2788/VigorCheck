import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OnboardingDraft } from "./flow";

const ONBOARDING_DRAFT_STORAGE_KEY = "vigorcheck:onboarding-draft";

type OnboardingFlowContextValue = {
  consumePostOnboardingHomeCTA: () => void;
  draft: OnboardingDraft;
  isHydrated: boolean;
  markPostOnboardingHomeCTA: () => void;
  resetDraft: () => void;
  setDraftValue: <Key extends keyof OnboardingDraft>(key: Key, value: OnboardingDraft[Key]) => void;
  showPostOnboardingHomeCTA: boolean;
};

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(null);

export function OnboardingFlowProvider({
  children,
  initialDraft,
  initialShowPostOnboardingHomeCTA = false,
}: {
  children: React.ReactNode;
  initialDraft?: OnboardingDraft;
  initialShowPostOnboardingHomeCTA?: boolean;
}) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft ?? {});
  const [isHydrated, setIsHydrated] = useState(Boolean(initialDraft));
  const [showPostOnboardingHomeCTA, setShowPostOnboardingHomeCTA] = useState(
    initialShowPostOnboardingHomeCTA
  );

  useEffect(() => {
    if (initialDraft) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const storedDraft = await AsyncStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);

        if (!cancelled && storedDraft) {
          setDraft(JSON.parse(storedDraft) as OnboardingDraft);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDraft]);

  useEffect(() => {
    if (!isHydrated || initialDraft) {
      return;
    }

    void AsyncStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft, initialDraft, isHydrated]);

  const setDraftValue = useCallback(
    <Key extends keyof OnboardingDraft>(key: Key, value: OnboardingDraft[Key]) => {
      setDraft((current) => ({
        ...current,
        [key]: value,
      }));
    },
    []
  );

  const resetDraft = useCallback(() => {
    setDraft({});
    void AsyncStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  }, []);

  const markPostOnboardingHomeCTA = useCallback(() => {
    setShowPostOnboardingHomeCTA(true);
  }, []);

  const consumePostOnboardingHomeCTA = useCallback(() => {
    setShowPostOnboardingHomeCTA(false);
  }, []);

  const value = useMemo(
    () => ({
      consumePostOnboardingHomeCTA,
      draft,
      isHydrated,
      markPostOnboardingHomeCTA,
      resetDraft,
      setDraftValue,
      showPostOnboardingHomeCTA,
    }),
    [
      consumePostOnboardingHomeCTA,
      draft,
      isHydrated,
      markPostOnboardingHomeCTA,
      resetDraft,
      setDraftValue,
      showPostOnboardingHomeCTA,
    ]
  );

  return <OnboardingFlowContext.Provider value={value}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlow() {
  const context = useContext(OnboardingFlowContext);

  if (!context) {
    throw new Error("useOnboardingFlow must be used inside OnboardingFlowProvider");
  }

  return context;
}
