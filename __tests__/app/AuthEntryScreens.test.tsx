import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import CreateAccountScreen from "../../app/(auth)/create-account";
import SignInScreen from "../../app/(auth)/sign-in";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseQuery = jest.fn();
const mockStartGoogleAuth = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/auth/authClient", () => ({
  startGoogleAuth: (...args: unknown[]) => mockStartGoogleAuth(...args),
}));

describe("Auth entry screens", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseQuery.mockReset();
    mockStartGoogleAuth.mockReset();
    mockUseQuery.mockReturnValue({
      googleConfigured: true,
    });
    mockStartGoogleAuth.mockResolvedValue(undefined);
  });

  it("renders provider-only create-account auth and routes to onboarding after Google sign-up", async () => {
    const { getByText, queryByPlaceholderText, queryByText } = render(<CreateAccountScreen />);

    expect(getByText("Continue with Google")).toBeTruthy();
    expect(queryByText("Continue with Apple")).toBeNull();
    expect(queryByText("Use email code")).toBeNull();
    expect(queryByPlaceholderText("Email address")).toBeNull();

    fireEvent.press(getByText("Continue with Google"));

    await waitFor(() => {
      expect(mockStartGoogleAuth).toHaveBeenCalledWith("signUp");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("renders provider-only sign-in auth and keeps the create-account footer action", async () => {
    const { getByText, queryByPlaceholderText, queryByText } = render(<SignInScreen />);

    expect(getByText("Continue with Google")).toBeTruthy();
    expect(queryByText("Continue with Apple")).toBeNull();
    expect(queryByText("Use email code")).toBeNull();
    expect(queryByPlaceholderText("Email address")).toBeNull();

    fireEvent.press(getByText("Continue with Google"));

    await waitFor(() => {
      expect(mockStartGoogleAuth).toHaveBeenCalledWith("signIn");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    fireEvent.press(getByText("Create account"));

    expect(mockReplace).toHaveBeenCalledWith("/(auth)/create-account");
  });
});
