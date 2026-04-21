import { Doc } from "../_generated/dataModel";
import {
  INTERNAL_TESTING_DISABLED_ERROR_MESSAGE,
  INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE,
  INTERNAL_TESTING_PASSWORD_MISSING_ERROR_MESSAGE,
  INTERNAL_TOOLS_UNLOCK_REQUIRED_ERROR_MESSAGE,
  INTERNAL_TOOLS_UNLOCK_TTL_MS,
  isServerInternalTestingAvailable,
  isServerInternalTestingEnabled,
} from "../../lib/domain/internalTesting";

type InternalToolsUser = Pick<
  Doc<"users">,
  "_id" | "internalToolsUnlockExpiresAt" | "internalToolsUnlockTokenHash"
>;

export function isInternalToolsAvailableForDeployment() {
  return isServerInternalTestingAvailable({
    explicitFlag: process.env.INTERNAL_TESTING_TOOLS_ENABLED,
    password: process.env.INTERNAL_TESTING_TOOLS_PASSWORD,
  });
}

export function ensureInternalToolsAvailable() {
  if (
    !isServerInternalTestingEnabled({
      explicitFlag: process.env.INTERNAL_TESTING_TOOLS_ENABLED,
    })
  ) {
    throw new Error(INTERNAL_TESTING_DISABLED_ERROR_MESSAGE);
  }

  if (!process.env.INTERNAL_TESTING_TOOLS_PASSWORD?.trim()) {
    throw new Error(INTERNAL_TESTING_PASSWORD_MISSING_ERROR_MESSAGE);
  }
}

export async function hashInternalToolsSecret(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getInternalToolsUnlockExpiresAt(now: number) {
  return now + INTERNAL_TOOLS_UNLOCK_TTL_MS;
}

export async function isInternalToolsUnlockTokenValid(args: {
  expectedTokenHash?: string | null;
  expiresAt?: number | null;
  now?: number;
  unlockToken: string;
}) {
  if (!args.expectedTokenHash || !args.expiresAt) {
    return false;
  }

  const now = args.now ?? Date.now();

  if (args.expiresAt <= now) {
    return false;
  }

  const suppliedTokenHash = await hashInternalToolsSecret(args.unlockToken);
  return suppliedTokenHash === args.expectedTokenHash;
}

export async function ensureInternalToolsUnlockToken(
  user: InternalToolsUser,
  unlockToken: string,
  now = Date.now()
) {
  const isValid = await isInternalToolsUnlockTokenValid({
    expectedTokenHash: user.internalToolsUnlockTokenHash,
    expiresAt: user.internalToolsUnlockExpiresAt,
    now,
    unlockToken,
  });

  if (!isValid) {
    throw new Error(INTERNAL_TOOLS_UNLOCK_REQUIRED_ERROR_MESSAGE);
  }
}

export async function createInternalToolsUnlockSession(args: {
  now?: number;
  password: string;
}) {
  ensureInternalToolsAvailable();

  const configuredPassword = process.env.INTERNAL_TESTING_TOOLS_PASSWORD ?? "";

  if (args.password !== configuredPassword) {
    throw new Error(INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE);
  }

  const unlockToken = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
  const now = args.now ?? Date.now();

  return {
    expiresAt: getInternalToolsUnlockExpiresAt(now),
    tokenHash: await hashInternalToolsSecret(unlockToken),
    unlockToken,
  };
}
