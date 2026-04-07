import React from "react";
import { Text } from "react-native";
import Purchases from "react-native-purchases";
import { render, waitFor } from "../../lib/test-utils";
import { SubscriptionProvider, useSubscription } from "../../lib/billing/SubscriptionProvider";

const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

function SubscriptionProbe() {
  const { isLoading } = useSubscription();

  return <Text>{isLoading ? "loading" : "idle"}</Text>;
}

describe("SubscriptionProvider", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = "test-android-key";
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = "test-ios-key";

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
});
