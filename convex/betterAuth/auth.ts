import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import { expo } from "@better-auth/expo";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
  local: { schema },
  verbose: false,
});

export function createAuthOptions(ctx: GenericCtx<DataModel>) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return {
    appName: "VigorCheck",
    baseURL: process.env.CONVEX_SITE_URL,
    database: authComponent.adapter(ctx),
    plugins: [expo(), convex({ authConfig })],
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
    trustedOrigins: ["vigorcheck://"],
  } satisfies BetterAuthOptions;
}

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}
