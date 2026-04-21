import {
  createInternalToolsUnlockSession,
  getInternalToolsUnlockExpiresAt,
  hashInternalToolsSecret,
  isInternalToolsAvailableForDeployment,
  isInternalToolsUnlockTokenValid,
} from "../../convex/lib/internalTools";
import {
  INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE,
  INTERNAL_TOOLS_UNLOCK_TTL_MS,
} from "../../lib/domain/internalTesting";

describe("internal tools server helpers", () => {
  const originalEnabled = process.env.INTERNAL_TESTING_TOOLS_ENABLED;
  const originalPassword = process.env.INTERNAL_TESTING_TOOLS_PASSWORD;

  afterEach(() => {
    process.env.INTERNAL_TESTING_TOOLS_ENABLED = originalEnabled;
    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = originalPassword;
  });

  it("reports deployment availability only when both envs are configured", () => {
    process.env.INTERNAL_TESTING_TOOLS_ENABLED = "true";
    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = "secret";
    expect(isInternalToolsAvailableForDeployment()).toBe(true);

    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = "";
    expect(isInternalToolsAvailableForDeployment()).toBe(false);

    process.env.INTERNAL_TESTING_TOOLS_ENABLED = "false";
    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = "secret";
    expect(isInternalToolsAvailableForDeployment()).toBe(false);
  });

  it("builds a stable hash and validates matching unlock tokens", async () => {
    const unlockToken = "dev-unlock-token";
    const expectedTokenHash = await hashInternalToolsSecret(unlockToken);

    expect(await hashInternalToolsSecret(unlockToken)).toBe(expectedTokenHash);
    expect(
      await isInternalToolsUnlockTokenValid({
        expectedTokenHash,
        expiresAt: Date.now() + 1_000,
        unlockToken,
      })
    ).toBe(true);
    expect(
      await isInternalToolsUnlockTokenValid({
        expectedTokenHash,
        expiresAt: Date.now() - 1_000,
        unlockToken,
      })
    ).toBe(false);
  });

  it("creates one unlock session with a 24 hour expiry window", async () => {
    process.env.INTERNAL_TESTING_TOOLS_ENABLED = "true";
    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = "secret";

    const session = await createInternalToolsUnlockSession({
      now: 123_456,
      password: "secret",
    });

    expect(session.expiresAt).toBe(getInternalToolsUnlockExpiresAt(123_456));
    expect(session.expiresAt - 123_456).toBe(INTERNAL_TOOLS_UNLOCK_TTL_MS);
    expect(session.unlockToken.length).toBeGreaterThan(20);
    expect(session.tokenHash).not.toBe(session.unlockToken);
  });

  it("rejects incorrect unlock passwords", async () => {
    process.env.INTERNAL_TESTING_TOOLS_ENABLED = "true";
    process.env.INTERNAL_TESTING_TOOLS_PASSWORD = "secret";

    await expect(
      createInternalToolsUnlockSession({
        password: "wrong",
      })
    ).rejects.toThrow(INTERNAL_TESTING_INVALID_PASSWORD_ERROR_MESSAGE);
  });
});
