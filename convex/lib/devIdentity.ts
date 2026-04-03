import { Doc } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

type UserContext = QueryCtx | MutationCtx;

export async function getCurrentTokenIdentifier(ctx: UserContext) {
  const identity = await ctx.auth.getUserIdentity();

  return identity?.tokenIdentifier ?? null;
}

export async function findCurrentUser(ctx: UserContext) {
  const tokenIdentifier = await getCurrentTokenIdentifier(ctx);

  if (!tokenIdentifier) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_token_identifier", (query) => query.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

export async function requireCurrentUser(ctx: UserContext): Promise<Doc<"users">> {
  const user = await findCurrentUser(ctx);

  if (!user) {
    throw new Error("Sign in to continue.");
  }

  return user;
}

export async function resetCurrentDevUser(ctx: MutationCtx) {
  const user = await findCurrentUser(ctx);

  if (!user) {
    return { deleted: false };
  }

  await ctx.db.delete(user._id);
  return { deleted: true };
}
