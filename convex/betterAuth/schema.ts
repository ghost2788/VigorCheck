/**
 * This file mirrors the generated Better Auth component schema.
 * Regenerate it with:
 * `npx auth generate --config ./convex/betterAuth/auth.ts --output ./convex/betterAuth/schema.ts`
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tables = {
  account: defineTable({
    accessToken: v.optional(v.union(v.null(), v.string())),
    accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    accountId: v.string(),
    createdAt: v.number(),
    idToken: v.optional(v.union(v.null(), v.string())),
    password: v.optional(v.union(v.null(), v.string())),
    providerId: v.string(),
    refreshToken: v.optional(v.union(v.null(), v.string())),
    refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    scope: v.optional(v.union(v.null(), v.string())),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("accountId", ["accountId"])
    .index("accountId_providerId", ["accountId", "providerId"])
    .index("providerId_userId", ["providerId", "userId"])
    .index("userId", ["userId"]),
  jwks: defineTable({
    createdAt: v.number(),
    expiresAt: v.optional(v.union(v.null(), v.number())),
    privateKey: v.string(),
    publicKey: v.string(),
  }),
  oauthAccessToken: defineTable({
    accessToken: v.optional(v.union(v.null(), v.string())),
    accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    clientId: v.optional(v.union(v.null(), v.string())),
    createdAt: v.optional(v.union(v.null(), v.number())),
    refreshToken: v.optional(v.union(v.null(), v.string())),
    refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    scopes: v.optional(v.union(v.null(), v.string())),
    updatedAt: v.optional(v.union(v.null(), v.number())),
    userId: v.optional(v.union(v.null(), v.string())),
  })
    .index("accessToken", ["accessToken"])
    .index("clientId", ["clientId"])
    .index("refreshToken", ["refreshToken"])
    .index("userId", ["userId"]),
  oauthApplication: defineTable({
    clientId: v.optional(v.union(v.null(), v.string())),
    clientSecret: v.optional(v.union(v.null(), v.string())),
    createdAt: v.optional(v.union(v.null(), v.number())),
    disabled: v.optional(v.union(v.null(), v.boolean())),
    icon: v.optional(v.union(v.null(), v.string())),
    metadata: v.optional(v.union(v.null(), v.string())),
    name: v.optional(v.union(v.null(), v.string())),
    redirectUrls: v.optional(v.union(v.null(), v.string())),
    type: v.optional(v.union(v.null(), v.string())),
    updatedAt: v.optional(v.union(v.null(), v.number())),
    userId: v.optional(v.union(v.null(), v.string())),
  })
    .index("clientId", ["clientId"])
    .index("userId", ["userId"]),
  oauthConsent: defineTable({
    clientId: v.optional(v.union(v.null(), v.string())),
    consentGiven: v.optional(v.union(v.null(), v.boolean())),
    createdAt: v.optional(v.union(v.null(), v.number())),
    scopes: v.optional(v.union(v.null(), v.string())),
    updatedAt: v.optional(v.union(v.null(), v.number())),
    userId: v.optional(v.union(v.null(), v.string())),
  })
    .index("clientId_userId", ["clientId", "userId"])
    .index("userId", ["userId"]),
  rateLimit: defineTable({
    count: v.number(),
    key: v.string(),
    lastRequest: v.number(),
  }).index("key", ["key"]),
  session: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.union(v.null(), v.string())),
    token: v.string(),
    updatedAt: v.number(),
    userAgent: v.optional(v.union(v.null(), v.string())),
    userId: v.string(),
  })
    .index("expiresAt", ["expiresAt"])
    .index("expiresAt_userId", ["expiresAt", "userId"])
    .index("token", ["token"])
    .index("userId", ["userId"]),
  twoFactor: defineTable({
    backupCodes: v.string(),
    secret: v.string(),
    userId: v.string(),
  }).index("userId", ["userId"]),
  user: defineTable({
    createdAt: v.number(),
    displayUsername: v.optional(v.union(v.null(), v.string())),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.union(v.null(), v.string())),
    isAnonymous: v.optional(v.union(v.null(), v.boolean())),
    name: v.string(),
    phoneNumber: v.optional(v.union(v.null(), v.string())),
    phoneNumberVerified: v.optional(v.union(v.null(), v.boolean())),
    twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
    updatedAt: v.number(),
    userId: v.optional(v.union(v.null(), v.string())),
    username: v.optional(v.union(v.null(), v.string())),
  })
    .index("email_name", ["email", "name"])
    .index("name", ["name"])
    .index("phoneNumber", ["phoneNumber"])
    .index("userId", ["userId"])
    .index("username", ["username"]),
  verification: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    identifier: v.string(),
    updatedAt: v.number(),
    value: v.string(),
  })
    .index("expiresAt", ["expiresAt"])
    .index("identifier", ["identifier"]),
};

const schema = defineSchema(tables);

export default schema;
