import React from "react";
import { StyleSheet } from "react-native";
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

  it("keeps secondary account and legal actions collapsed below the CTA", () => {
    const { getByTestId, getByText, queryByText } = render(<PaywallScreen />);

    expect(getByTestId("paywall-primary-cta")).toBeTruthy();
    expect(getByText("Manage account")).toBeTruthy();
    expect(queryByText("Restore purchases, subscription settings, legal, and support.")).toBeNull();
    expect(queryByText("Restore purchases")).toBeNull();
    expect(queryByText("Manage subscription")).toBeNull();
    expect(queryByText("Account deletion")).toBeNull();
    expect(queryByText("Privacy")).toBeNull();

    fireEvent.press(getByTestId("paywall-manage-toggle"));

    const manageContent = getByTestId("paywall-manage-content");
    const accountAction = getByTestId("paywall-account-action");

    expect(within(manageContent).getByText("Restore purchases")).toBeTruthy();
    expect(within(manageContent).getByText("Manage subscription")).toBeTruthy();
    expect(within(accountAction).getByText("Account deletion")).toBeTruthy();
    expect(within(accountAction).getByText("Sign out")).toBeTruthy();
    expect(within(manageContent).getByText("Privacy")).toBeTruthy();
    expect(within(manageContent).getByText("Terms")).toBeTruthy();
    expect(within(manageContent).getByText("Support")).toBeTruthy();
  });

  it("keeps the CTA and collapsed manage card in the main page instead of a divided footer", () => {
    const { getByTestId, queryByTestId } = render(<PaywallScreen />);

    const scrollStyle = StyleSheet.flatten(getByTestId("paywall-scroll").props.contentContainerStyle);

    expect(queryByTestId("paywall-footer")).toBeNull();
    expect(scrollStyle.paddingBottom).toBe(48);
    expect(getByTestId("paywall-manage-card")).toBeTruthy();
  });

  it("uses the approved monthly fallback price when Play product details are unavailable", () => {
    const { getByText } = render(<PaywallScreen />);

    expect(getByText("$7.99 / month")).toBeTruthy();
  });

  it("uses an accordion chevron affordance for the manage account card", () => {
    const { getByTestId } = render(<PaywallScreen />);

    const closedChevronStyle = StyleSheet.flatten(getByTestId("paywall-manage-chevron").props.style);
    expect(closedChevronStyle.transform).toEqual([{ rotate: "45deg" }]);

    fireEvent.press(getByTestId("paywall-manage-toggle"));

    const openChevronStyle = StyleSheet.flatten(getByTestId("paywall-manage-chevron").props.style);
    expect(openChevronStyle.transform).toEqual([{ rotate: "-135deg" }]);
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

    fireEvent.press(getByTestId("paywall-manage-toggle"));

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

    fireEvent.press(getByTestId("paywall-manage-toggle"));

    const manageContent = getByTestId("paywall-manage-content");

    fireEvent.press(within(manageContent).getByText("Privacy"));
    fireEvent.press(within(manageContent).getByText("Terms"));
    fireEvent.press(within(manageContent).getByText("Support"));

    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(1, "privacy");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(2, "terms");
    expect(openLegalLinkSpy).toHaveBeenNthCalledWith(3, "support");
  });
});
