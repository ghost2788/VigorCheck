import { listHydrationShortcutsForCurrentUser } from "../../convex/hydrationShortcuts";

describe("listHydrationShortcutsForCurrentUser", () => {
  it("returns an empty list when no signed-in user is available", async () => {
    const query = jest.fn();
    const result = await listHydrationShortcutsForCurrentUser({
      auth: {
        getUserIdentity: jest.fn(async () => null),
      },
      db: {
        query,
      },
    } as never);

    expect(result).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it("sorts pinned shortcuts first, then most recent, then label", async () => {
    const collect = jest.fn(async () => [
      { _id: "4", label: "Electrolytes", lastUsedAt: 10, pinned: false, userId: "user-1" },
      { _id: "2", label: "Berry Tea", lastUsedAt: 40, pinned: false, userId: "user-1" },
      { _id: "3", label: "Coconut Water", lastUsedAt: 20, pinned: true, userId: "user-1" },
      { _id: "1", label: "Sparkling Water", lastUsedAt: 30, pinned: true, userId: "user-1" },
    ]);
    const userUnique = jest.fn(async () => ({ _id: "user-1" }));
    const userEq = jest.fn(() => ({ unique: userUnique }));
    const hydrationEq = jest.fn(() => ({ collect }));
    const query = jest.fn((tableName: string) => {
      if (tableName === "users") {
        return {
          withIndex: jest.fn((_indexName, callback) => {
            callback({
              eq: userEq,
            });
            return { unique: userUnique };
          }),
        };
      }

      return {
        withIndex: jest.fn((_indexName, callback) => {
          callback({
            eq: hydrationEq,
          });
          return { collect };
        }),
      };
    });

    const result = await listHydrationShortcutsForCurrentUser({
      auth: {
        getUserIdentity: jest.fn(async () => ({ tokenIdentifier: "token-1" })),
      },
      db: {
        query,
      },
    } as never);

    expect(result.map((shortcut) => shortcut.label)).toEqual([
      "Sparkling Water",
      "Coconut Water",
      "Berry Tea",
      "Electrolytes",
    ]);
    expect(query).toHaveBeenCalledWith("users");
    expect(query).toHaveBeenCalledWith("hydrationShortcuts");
    expect(userEq).toHaveBeenCalledWith("tokenIdentifier", "token-1");
    expect(hydrationEq).toHaveBeenCalledWith("userId", "user-1");
  });
});
