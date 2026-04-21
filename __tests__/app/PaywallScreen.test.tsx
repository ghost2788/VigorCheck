import React from "react";
import { fireEvent, render, waitFor, within } from "../../lib/test-utils";
import PaywallScreen from "../../app/paywall";
import * as legalLinks from "../../lib/config/legalLinks";

const mockReplace = jest.fn();
const mockUseQuery = jest.fn();
const mockUseSubscription = jest.fn();
const mockSignOut = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 16,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

jest.mock("../../components/auth/WelcomeHudHero", () => ({
  WelcomeHudHero: () => {
    const { View } = require("react-native");
    return <View testID="paywall-hero" />;
  },
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

jest.mock("../../lib/auth/authClient", () => ({
  authClient: {
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

describe("PaywallScreen", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReplace.mockReset();
    mockUseQuery.mockReset();
    mockUseSubscription.mockReset();
    mockSignOut.mockReset();
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      _id: "user-1",
      subscription: {},
    });
    mockSignOut.mockResolvedValue(undefined);
    mockUseSubscription.mockReturnValue({
      accessState: {
        shouldShowPaywall: true,
      },
      isConfigured: true,
      isLoading: false,
      manageSubscription: jest.fn().mockResolvedValue(undefined),
      offerings: null,
      purchaseMonthly: jest.fn().mockResolvedValue(undefined),
      restorePurchases: jest.fn().mockResolvedValue(undefined),
      statusLabel: "Trial expired",
      supportMessage: null,
    });
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("renders restore and manage as shared billing utilities with sign out separated", () => {
    const { getByTestId } = render(<PaywallScreen />);

    const utilityActions = getByTestId("paywall-utility-actions");
    const accountAction = getByTestId("paywall-account-action");

    expect(within(utilityActions).getByText("Restore purchases")).toBeTruthy();
    expect(within(utilityActions).getByText("Manage subscription")).toBeTruthy();
    expect(within(utilityActions).getByText("Account deletion")).toBeTruthy();
    expect(within(accountAction).getByText("Sign out")).toBeTruthy();
  });

  it("runs restore, manage, and sign-out actions from their respective controls", async () => {
    const restorePurchases = jest.fn().mockResolvedValue(undefined);
    const manageSubscription = jest.fn().mockResolvedValue(undefined);

    mockUseSubscription.mockReturnValue({
      accessState: {
        shouldShowPaywall: true,
      },
      isConfigured: true,
      isLoading: false,
      manageSubscription,
      offerings: null,
      purchaseMonthly: jest.fn().mockResolvedValue(undefined),
      restorePurchases,
      statusLabel: "Trial expired",
      supportMessage: null,
    });

    const { getByTestId } = render(<PaywallScreen />);

    fireEvent.press(getByTestId("paywall-restore-link"));
    fireEvent.press(getByTestId("paywall-manage-link"));
    fireEvent.press(getByTestId("paywall-account-deletion-link"));
    fireEvent.press(getByTestId("paywall-signout-link"));

    await waitFor(() => {
      expect(restorePurchases).toHaveBeenCalledTimes(1);
      expect(manageSubscription).toHaveBeenCalledTimes(1);
      expect(openLegalLinkSpy).toHaveBeenCalledWith("accountDeletion");
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/welcome");
    });
  });

  it("renders and opens privacy, terms, and support links from the paywall utility cluster", () => {
    const { getByTestId } = render(<PaywallScreen />);

    const utilityActions = getByTestId("paywall-utility-actions");

    fireEvent.press(within(utilityActions).getByText("Privacy"));
    fireEvent.press(within(utilityActions).getByText("Terms"));
    fireEvent.press(within(utilityActions).getByText("Support"));

    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(1, "privacy");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(2, "terms");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(3, "support");
  });
});
