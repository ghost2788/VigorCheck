import { Doc } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

const DEV_AUTH_SUBJECT = "dev:caltracker-bootstrap-user";

type UserContext = QueryCtx | MutationCtx;

export function getCurrentAuthSubject() {
  return DEV_AUTH_SUBJECT;
}

export async function findCurrentUser(ctx: UserContext) {
  return ctx.db
    .query("users")
    .withIndex("by_auth_subject", (query) => query.eq("authSubject", DEV_AUTH_SUBJECT))
    .unique();
}

export async function requireCurrentUser(ctx: UserContext): Promise<Doc<"users">> {
  const user = await findCurrentUser(ctx);

  if (!user) {
    throw new Error("Current dev user is not set up yet.");
  }

  return user;
}
