import { resetCurrentDevUser } from "../../convex/lib/devIdentity";

describe("resetCurrentDevUser", () => {
  it("deletes the current dev user when present", async () => {
    const unique = jest.fn().mockResolvedValue({ _id: "user-1" });
    const withIndex = jest.fn().mockReturnValue({ unique });
    const query = jest.fn().mockReturnValue({ withIndex });
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const ctx = {
      auth: {
        getUserIdentity: jest.fn().mockResolvedValue({ tokenIdentifier: "token-1" }),
      },
      db: {
        delete: deleteFn,
        query,
      },
    } as never;

    await expect(resetCurrentDevUser(ctx)).resolves.toEqual({ deleted: true });
    expect(query).toHaveBeenCalledWith("users");
    expect(withIndex).toHaveBeenCalledTimes(1);
    expect(withIndex).toHaveBeenCalledWith("by_token_identifier", expect.any(Function));
    expect(unique).toHaveBeenCalledTimes(1);
    expect(deleteFn).toHaveBeenCalledWith("user-1");
  });

  it("returns deleted false when there is no current dev user", async () => {
    const unique = jest.fn().mockResolvedValue(null);
    const withIndex = jest.fn().mockReturnValue({ unique });
    const query = jest.fn().mockReturnValue({ withIndex });
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const ctx = {
      auth: {
        getUserIdentity: jest.fn().mockResolvedValue({ tokenIdentifier: "token-1" }),
      },
      db: {
        delete: deleteFn,
        query,
      },
    } as never;

    await expect(resetCurrentDevUser(ctx)).resolves.toEqual({ deleted: false });
    expect(deleteFn).not.toHaveBeenCalled();
  });
});
