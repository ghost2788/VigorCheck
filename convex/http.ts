import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./betterAuth/auth";

const http = httpRouter();
const revenueCatWebhookAuthToken = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ?? null;

function getRevenueCatAuthorizationToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");

  if (!authorizationHeader) {
    return null;
  }

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  return authorizationHeader.trim();
}

function mapRevenueCatStore(store?: string) {
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

function inferActiveEntitlement(event: {
  expiration_at_ms?: number | null;
  type?: string | null;
}) {
  if (typeof event.expiration_at_ms === "number") {
    return event.expiration_at_ms > Date.now();
  }

  return new Set([
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "SUBSCRIPTION_EXTENDED",
    "TEMPORARY_ENTITLEMENT_GRANT",
    "UNCANCELLATION",
  ]).has(event.type ?? "");
}

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (revenueCatWebhookAuthToken) {
      const providedToken = getRevenueCatAuthorizationToken(request);

      if (providedToken !== revenueCatWebhookAuthToken) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body = await request.json();
    const event = body?.event;

    if (!event?.id || !event?.type) {
      return new Response("Bad Request", { status: 400 });
    }

    const candidateAppUserIds = [
      event.app_user_id,
      ...(Array.isArray(event.aliases) ? event.aliases : []),
      event.original_app_user_id,
    ].filter((value, index, collection): value is string => {
      return typeof value === "string" && value.length > 0 && collection.indexOf(value) === index;
    });

    if (!candidateAppUserIds.length) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "content-type": "application/json" },
        status: 202,
      });
    }

    await ctx.runMutation(internal.subscriptions.applyRevenueCatWebhookEvent, {
      activeEntitlement: inferActiveEntitlement(event),
      candidateAppUserIds,
      eventId: event.id,
      eventType: event.type,
      subscriptionExpiresAt:
        typeof event.expiration_at_ms === "number" ? event.expiration_at_ms : undefined,
      subscriptionPlatform: mapRevenueCatStore(event.store),
      subscriptionProductId: typeof event.product_id === "string" ? event.product_id : undefined,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
