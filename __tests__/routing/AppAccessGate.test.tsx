import React from "react";
import { Text } from "react-native";
import { render } from "../../lib/test-utils";
import { AppAccessGate, isProtectedAppRoute } from "../../lib/routing/AppAccessGate";

const mockUseConvexAuth = jest.fn();
const mockUseQuery = jest.fn();
const mockUseSubscription = jest.fn();
let mockSegments: string[] = [];

jest.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  useSegments: () => mockSegments,
}));

function renderGate() {
  return render(
    <AppAccessGate>
      <Text>protected content</Text>
    </AppAccessGate>
  );
}

describe("AppAccessGate", () => {
  beforeEach(() => {
    mockSegments = ["history", "2026-04-20"];
    mockUseConvexAuth.mockReset();
    mockUseQuery.mockReset();
    mockUseSubscription.mockReset();
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue({
      _id: "user-1",
    });
    mockUseSubscription.mockReturnValue({
      accessState: {
        shouldShowPaywall: false,
      },
    });
  });

  it("detects premium app routes without moving route groups", () => {
    expect(isProtectedAppRoute(["(tabs)", "log"])).toBe(true);
    expect(isProtectedAppRoute(["scan", "barcode"])).toBe(true);
    expect(isProtectedAppRoute(["history", "2026-04-20"])).toBe(true);
    expect(isProtectedAppRoute(["profile", "plan-settings"])).toBe(true);
    expect(isProtectedAppRoute(["supplements"])).toBe(true);
    expect(isProtectedAppRoute(["(auth)", "welcome"])).toBe(false);
    expect(isProtectedAppRoute(["(onboarding)", "goal"])).toBe(false);
    expect(isProtectedAppRoute(["paywall"])).toBe(false);
  });

  it("lets active users view protected deep links", () => {
    const { getByText } = renderGate();

    expect(getByText("protected content")).toBeTruthy();
  });

  it("routes signed-out users on protected deep links to auth", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { getByText } = renderGate();

    expect(getByText("redirect:/(auth)/welcome")).toBeTruthy();
  });

  it("routes signed-in users without a completed profile back through bootstrap", () => {
    mockUseQuery.mockReturnValue(null);

    const { getByText } = renderGate();

    expect(getByText("redirect:/")).toBeTruthy();
  });

  it("routes expired users on protected deep links to the paywall", () => {
    mockUseSubscription.mockReturnValue({
      accessState: {
        shouldShowPaywall: true,
      },
    });

    const { getByText } = renderGate();

    expect(getByText("redirect:/paywall")).toBeTruthy();
  });

  it("waits for the profile query before deciding a protected route", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { getByText } = renderGate();

    expect(getByText("Loading your plan...")).toBeTruthy();
  });

  it("does not gate public routes", () => {
    mockSegments = ["paywall"];
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    mockUseQuery.mockReturnValue(undefined);

    const { getByText } = renderGate();

    expect(getByText("protected content")).toBeTruthy();
  });
});
