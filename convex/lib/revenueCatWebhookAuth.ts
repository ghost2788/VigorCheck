export type RevenueCatWebhookAuthorizationResult =
  | { ok: true }
  | {
      message: string;
      ok: false;
      status: 401 | 503;
    };

export function getRevenueCatAuthorizationToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  return authorizationHeader.trim();
}

export function authorizeRevenueCatWebhook({
  authorizationHeader,
  configuredToken,
}: {
  authorizationHeader: string | null;
  configuredToken: string | null;
}): RevenueCatWebhookAuthorizationResult {
  const normalizedConfiguredToken = configuredToken?.trim() ?? null;

  if (!normalizedConfiguredToken) {
    return {
      message: "RevenueCat webhook auth is not configured.",
      ok: false,
      status: 503,
    };
  }

  const providedToken = getRevenueCatAuthorizationToken(authorizationHeader);

  if (providedToken !== normalizedConfiguredToken) {
    return {
      message: "Unauthorized",
      ok: false,
      status: 401,
    };
  }

  return { ok: true };
}
