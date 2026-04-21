import { Platform } from "react-native";
import type { CustomerInfo, PurchasesEntitlementInfo } from "react-native-purchases";

export function getRevenueCatApiKey() {
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? null;
  }

  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? null;
  }

  return null;
}

export function mapRevenueCatStoreToPlatform(store?: string | null) {
  switch (store) {
    case "PLAY_STORE":
      return "android" as const;
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "ios" as const;
    case "STRIPE":
    case "PADDLE":
    case "RC_BILLING":
    case "EXTERNAL":
      return "web" as const;
    default:
      return "unknown" as const;
  }
}

function getPrimaryActiveEntitlement(customerInfo: CustomerInfo) {
  return Object.values(customerInfo.entitlements.active)[0] ?? null;
}

function parseExpirationDate(dateString?: string | null) {
  if (!dateString) {
    return undefined;
  }

  const parsed = Date.parse(dateString);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getRevenueCatCustomerSnapshot(customerInfo: CustomerInfo) {
  const activeEntitlement = getPrimaryActiveEntitlement(customerInfo);
  const activeProductId = activeEntitlement?.productIdentifier ?? customerInfo.activeSubscriptions[0];
  const activeSubscription = activeProductId
    ? customerInfo.subscriptionsByProductIdentifier[activeProductId]
    : undefined;
  const subscriptionExpiresAt =
    activeEntitlement?.expirationDateMillis ??
    parseExpirationDate(activeSubscription?.expiresDate) ??
    parseExpirationDate(customerInfo.latestExpirationDate);

  return {
    activeEntitlement,
    activeEntitlementId: activeEntitlement?.identifier ?? null,
    activeProductId: activeProductId ?? null,
    hasActiveEntitlement:
      activeEntitlement?.isActive === true || customerInfo.activeSubscriptions.length > 0,
    managementUrl: customerInfo.managementURL,
    subscriptionExpiresAt,
    subscriptionPlatform: mapRevenueCatStoreToPlatform(
      activeEntitlement?.store ?? activeSubscription?.store
    ),
  };
}

export function getPaywallPackage(offerings: { current: { availablePackages: unknown[]; monthly: unknown | null } | null } | null) {
  if (!offerings?.current) {
    return null;
  }

  return offerings.current.monthly ?? offerings.current.availablePackages[0] ?? null;
}

export function getRevenueCatSupportMessage(hasApiKey: boolean) {
  if (hasApiKey) {
    return null;
  }

  return "Add your RevenueCat public SDK key to enable subscriptions in this build.";
}

export function getManagementUrlFallback(packageName: string) {
  return `https://play.google.com/store/account/subscriptions?package=${packageName}`;
}

export function formatTrialStatusLabel(daysRemaining: number) {
  if (daysRemaining <= 0) {
    return "Trial ended";
  }

  if (daysRemaining === 1) {
    return "1 day left in your free trial";
  }

  return `${daysRemaining} days left in your free trial`;
}

export function formatSubscriptionStatusLabel({
  daysRemaining,
  status,
}: {
  daysRemaining: number;
  status: "active" | "expired" | "trial";
}) {
  if (status === "active") {
    return "Subscription active";
  }

  if (status === "trial") {
    return formatTrialStatusLabel(daysRemaining);
  }

  return "Subscription required";
}

export type RevenueCatCustomerSnapshot = ReturnType<typeof getRevenueCatCustomerSnapshot>;
export type RevenueCatActiveEntitlement = PurchasesEntitlementInfo | null;
