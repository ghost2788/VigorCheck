import {
  authorizeRevenueCatWebhook,
  getRevenueCatAuthorizationToken,
} from "../../convex/lib/revenueCatWebhookAuth";

describe("authorizeRevenueCatWebhook", () => {
  it("fails closed when the RevenueCat auth token is missing", () => {
    expect(
      authorizeRevenueCatWebhook({
        authorizationHeader: "Bearer top-secret",
        configuredToken: null,
      })
    ).toEqual({
      message: "RevenueCat webhook auth is not configured.",
      ok: false,
      status: 503,
    });
  });

  it("rejects requests with the wrong auth token", () => {
    expect(
      authorizeRevenueCatWebhook({
        authorizationHeader: "Bearer wrong-token",
        configuredToken: "top-secret",
      })
    ).toEqual({
      message: "Unauthorized",
      ok: false,
      status: 401,
    });
  });

  it("accepts bearer and raw authorization header tokens when they match", () => {
    expect(
      authorizeRevenueCatWebhook({
        authorizationHeader: "Bearer top-secret",
        configuredToken: "top-secret",
      })
    ).toEqual({ ok: true });
    expect(
      authorizeRevenueCatWebhook({
        authorizationHeader: "top-secret",
        configuredToken: "top-secret",
      })
    ).toEqual({ ok: true });
    expect(getRevenueCatAuthorizationToken("Bearer top-secret")).toBe("top-secret");
    expect(getRevenueCatAuthorizationToken("top-secret")).toBe("top-secret");
  });
});
