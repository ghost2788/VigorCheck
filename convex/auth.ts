import { query } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";

export const { getAuthUser } = authComponent.clientApi();

export const status = query({
  args: {},
  handler: async () => ({
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  }),
});
