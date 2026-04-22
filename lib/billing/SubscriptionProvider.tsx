import Constants from "expo-constants";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useMutation, useQuery } from "convex/react";
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";
import { api } from "../../convex/_generated/api";
import {
  ANDROID_PRODUCTION_PACKAGE_NAME,
  formatSubscriptionStatusLabel,
  getManagementUrlFallback,
  getPaywallPackage,
  getRevenueCatApiKey,
  getRevenueCatCustomerSnapshot,
  getRevenueCatSupportMessage,
  isDevelopmentAndroidPackage,
} from "./revenueCat";
import { resolveSubscriptionAccess, type ResolvedSubscriptionAccess } from "../domain/subscription";

type SubscriptionContextValue = {
  accessState: ResolvedSubscriptionAccess | null;
  customerInfo: CustomerInfo | null;
  isConfigured: boolean;
  isLoading: boolean;
  manageSubscription: () => Promise<void>;
  offerings: PurchasesOfferings | null;
  purchaseMonthly: () => Promise<void>;
  refresh: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  statusLabel: string | null;
  supportMessage: string | null;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function getAndroidPackageName() {
  return (
    Application.applicationId ??
    Constants.expoConfig?.android?.package ??
    Constants.manifest2?.extra?.expoClient?.android?.package ??
    "com.vigorcheck.app"
  );
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.users.current);
  const syncCustomerInfo = useMutation(api.subscriptions.syncCustomerInfo);
  const apiKey = getRevenueCatApiKey();
  const androidPackageName = getAndroidPackageName();
  const isAndroidDevelopmentPackage =
    Platform.OS === "android" && isDevelopmentAndroidPackage(androidPackageName);
  const hasApiKey = Boolean(apiKey);
  const isConfigured = hasApiKey && Platform.OS !== "web" && !isAndroidDevelopmentPackage;
  const revenueCatAppUserId = currentUser?.subscription.revenueCatAppUserId ?? null;
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const configuredUserIdRef = useRef<string | null>(null);
  const listenerRef = useRef<((info: CustomerInfo) => void) | null>(null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const applyCustomerInfo = useCallback(
    async (nextCustomerInfo: CustomerInfo, userOverride?: typeof currentUser | null) => {
      setCustomerInfo(nextCustomerInfo);

      const user = userOverride ?? currentUserRef.current;

      if (!user) {
        return;
      }

      const snapshot = getRevenueCatCustomerSnapshot(nextCustomerInfo);

      await syncCustomerInfo({
        activeEntitlement: snapshot.hasActiveEntitlement,
        revenueCatAppUserId: user.subscription.revenueCatAppUserId ?? undefined,
        subscriptionExpiresAt: snapshot.subscriptionExpiresAt,
        subscriptionPlatform: snapshot.subscriptionPlatform,
        subscriptionProductId: snapshot.activeProductId ?? undefined,
      });
    },
    [syncCustomerInfo]
  );

  // Stable ref so the configure effect doesn't re-run when currentUser changes
  // after a syncCustomerInfo mutation (which would cause a loading flicker loop).
  const applyCustomerInfoRef = useRef(applyCustomerInfo);
  applyCustomerInfoRef.current = applyCustomerInfo;

  const refresh = useCallback(async () => {
    if (!isConfigured || !revenueCatAppUserId) {
      return;
    }

    setIsLoading(true);

    try {
      const [nextCustomerInfo, nextOfferings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      setOfferings(nextOfferings);
      await applyCustomerInfo(nextCustomerInfo);
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, isConfigured, revenueCatAppUserId]);

  useEffect(() => {
    if (!isConfigured) {
      configuredUserIdRef.current = null;
      setCustomerInfo(null);
      setOfferings(null);
      return;
    }

    if (!currentUser) {
      setCustomerInfo(null);
      setOfferings(null);
      return;
    }

    let cancelled = false;

    const configure = async () => {
      setIsLoading(true);

      try {
        if (!revenueCatAppUserId) {
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (!(await Purchases.isConfigured())) {
          Purchases.configure({
            apiKey: apiKey!,
            appUserID: revenueCatAppUserId,
          });
          configuredUserIdRef.current = revenueCatAppUserId;
        } else if (configuredUserIdRef.current !== revenueCatAppUserId) {
          await Purchases.logIn(revenueCatAppUserId);
          configuredUserIdRef.current = revenueCatAppUserId;
        }

        if (!listenerRef.current) {
          const listener = (info: CustomerInfo) => {
            void applyCustomerInfoRef.current(info);
          };

          listenerRef.current = listener;
          Purchases.addCustomerInfoUpdateListener(listener);
        }

        const [nextCustomerInfo, nextOfferings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        if (cancelled) {
          return;
        }

        setOfferings(nextOfferings);
        await applyCustomerInfoRef.current(nextCustomerInfo);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void configure();

    return () => {
      cancelled = true;
    };
  }, [apiKey, isConfigured, revenueCatAppUserId]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(listenerRef.current);
      }
    };
  }, []);

  const purchaseMonthly = useCallback(async () => {
    if (!isConfigured) {
      throw new Error("RevenueCat is not configured in this build.");
    }

    const paywallPackage = getPaywallPackage(offerings) as PurchasesPackage | null;

    if (!paywallPackage) {
      throw new Error("No monthly subscription package is available yet.");
    }

    setIsLoading(true);

    try {
      await Purchases.trackCustomPaywallImpression({
        offeringId: offerings?.current?.identifier ?? undefined,
        paywallId: "main-paywall",
      });

      const result = await Purchases.purchasePackage(paywallPackage);
      await applyCustomerInfo(result.customerInfo);
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, isConfigured, offerings]);

  const restorePurchases = useCallback(async () => {
    if (!isConfigured) {
      throw new Error("RevenueCat is not configured in this build.");
    }

    setIsLoading(true);

    try {
      const restoredCustomerInfo = await Purchases.restorePurchases();
      await applyCustomerInfo(restoredCustomerInfo);
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, isConfigured]);

  const manageSubscription = useCallback(async () => {
    if (Platform.OS === "ios") {
      await Purchases.showManageSubscriptions();
      return;
    }

    const packageName = isAndroidDevelopmentPackage
      ? ANDROID_PRODUCTION_PACKAGE_NAME
      : androidPackageName;
    const managementUrl = customerInfo?.managementURL ?? getManagementUrlFallback(packageName);

    await Linking.openURL(managementUrl);
  }, [androidPackageName, customerInfo, isAndroidDevelopmentPackage]);

  const accessState = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    const hasActiveLocalEntitlement =
      isAndroidDevelopmentPackage ||
      (customerInfo ? getRevenueCatCustomerSnapshot(customerInfo).hasActiveEntitlement : false);

    return resolveSubscriptionAccess({
      hasActiveLocalEntitlement,
      subscription: currentUser.subscription,
    });
  }, [currentUser, customerInfo, isAndroidDevelopmentPackage]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      accessState,
      customerInfo,
      isConfigured,
      isLoading,
      manageSubscription,
      offerings,
      purchaseMonthly,
      refresh,
      restorePurchases,
      statusLabel: accessState
        ? formatSubscriptionStatusLabel({
            daysRemaining: accessState.daysRemaining,
            status: accessState.status,
          })
        : null,
      supportMessage: getRevenueCatSupportMessage({
        hasApiKey,
        isDevelopmentPackage: isAndroidDevelopmentPackage,
      }),
    }),
    [
      accessState,
      customerInfo,
      hasApiKey,
      isAndroidDevelopmentPackage,
      isConfigured,
      isLoading,
      manageSubscription,
      offerings,
      purchaseMonthly,
      refresh,
      restorePurchases,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider.");
  }

  return context;
}
