import React from "react";
import { Platform, Text } from "react-native";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";
import { render, waitFor } from "../../lib/test-utils";
import { SubscriptionProvider, useSubscription } from "../../lib/billing/SubscriptionProvider";

const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      android: {
        package: "com.vigorcheck.app",
      },
    },
    manifest2: null,
  },
}));

function SubscriptionProbe() {
  const { accessState, isConfigured, isLoading, statusLabel, supportMessage } = useSubscription();

  return (
    <>
      <Text>{isLoading ? "loading" : "idle"}</Text>
      <Text>{isConfigured ? "configured" : "not configured"}</Text>
      <Text>{accessState?.shouldShowPaywall ? "paywall" : "unlocked"}</Text>
      {statusLabel ? <Text>{statusLabel}</Text> : null}
      {supportMessage ? <Text>{supportMessage}</Text> : null}
    </>
  );
}

describe("SubscriptionProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = "test-android-key";
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = "test-ios-key";
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });
    (Constants as unknown as { expoConfig: { android: { package: string } } }).expoConfig = {
      android: {
        package: "com.vigorcheck.app",
      },
    };

    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReturnValue(jest.fn().mockResolvedValue(undefined));

    jest.mocked(Purchases.isConfigured).mockResolvedValue(false);
    jest.mocked(Purchases.getCustomerInfo).mockResolvedValue({
      activeSubscriptions: [],
      allExpirationDates: {},
      allPurchaseDates: {},
      allPurchasedProductIdentifiers: [],
      entitlements: { active: {}, all: {}, verification: "NOT_REQUESTED" },
      firstSeen: "",
      latestExpirationDate: null,
      managementURL: null,
      nonSubscriptionTransactions: [],
      originalAppUserId: "",
      originalApplicationVersion: null,
      originalPurchaseDate: null,
      requestDate: "",
      subscriptionsByProductIdentifier: {},
    } as never);
    jest.mocked(Purchases.getOfferings).mockResolvedValue({ all: {}, current: null } as never);
    jest.mocked(Purchases.configure).mockImplementation(() => undefined as never);
    jest.mocked(Purchases.addCustomerInfoUpdateListener).mockImplementation(() => undefined as never);
    jest.mocked(Purchases.removeCustomerInfoUpdateListener).mockImplementation(() => undefined as never);
    jest.mocked(Purchases.setLogLevel).mockImplementation(() => undefined as never);
  });

  it("does not re-fetch RevenueCat data when the current user changes but the app user id stays the same", async () => {
    let currentUser = {
      _id: "user-1",
      subscription: {
        daysLeftInTrial: 7,
        revenueCatAppUserId: "rc-user-1",
        status: "trial",
      },
    };

    mockUseQuery.mockImplementation(() => currentUser);

    const { rerender } = render(
      <SubscriptionProvider>
        <SubscriptionProbe />
      </SubscriptionProvider>
    );

    await waitFor(() => {
      expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1);
      expect(Purchases.getOfferings).toHaveBeenCalledTimes(1);
    });

    currentUser = {
      ...currentUser,
      subscription: {
        ...currentUser.subscription,
        status: "expired",
      },
    };

    rerender(
      <SubscriptionProvider>
        <SubscriptionProbe />
      </SubscriptionProvider>
    );

    await expect(
      waitFor(
        () => {
          expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(2);
        },
        { timeout: 100 }
      )
    ).rejects.toThrow();

    expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1);
    expect(Purchases.getOfferings).toHaveBeenCalledTimes(1);
  });

  it("unlocks the separate Android development package without fetching RevenueCat offerings", () => {
    (Constants as unknown as { expoConfig: { android: { package: string } } }).expoConfig = {
      android: {
        package: "com.vigorcheck.app.dev",
      },
    };

    mockUseQuery.mockReturnValue({
      _id: "user-1",
      subscription: {
        daysLeftInTrial: 7,
        revenueCatAppUserId: "rc-user-1",
        status: "trial",
      },
    });

    const { getByText } = render(
      <SubscriptionProvider>
        <SubscriptionProbe />
      </SubscriptionProvider>
    );

    expect(getByText("not configured")).toBeTruthy();
    expect(getByText("unlocked")).toBeTruthy();
    expect(getByText("Subscription active")).toBeTruthy();
    expect(
      getByText(
        "Purchases are disabled in VigorCheck Dev. Use the Play-installed internal testing app to test subscriptions."
      )
    ).toBeTruthy();
    expect(Purchases.configure).not.toHaveBeenCalled();
    expect(Purchases.getCustomerInfo).not.toHaveBeenCalled();
    expect(Purchases.getOfferings).not.toHaveBeenCalled();
  });
});
