import React from "react";
import { Text } from "react-native";
import { render } from "../../lib/test-utils";
import { ConvexClientProvider } from "../../lib/ConvexClientProvider";

const mockUseSession = jest.fn();
const mockGetConvexUrl = jest.fn();
const mockProviderSpy = jest.fn();
const mockClientInstances: Array<{ close: jest.Mock; url: string }> = [];

jest.mock("@convex-dev/better-auth/react", () => ({
  ConvexBetterAuthProvider: ({
    children,
    client,
  }: {
    children: React.ReactNode;
    client: unknown;
  }) => {
    mockProviderSpy(client);
    return <>{children}</>;
  },
}));

jest.mock("../../lib/auth/authClient", () => ({
  authClient: {
    useSession: () => mockUseSession(),
  },
  getConvexUrl: () => mockGetConvexUrl(),
}));

jest.mock("convex/react", () => ({
  ConvexReactClient: jest.fn((url: string) => {
    const instance = {
      close: jest.fn(async () => undefined),
      url,
    };
    mockClientInstances.push(instance);
    return instance;
  }),
}));

describe("ConvexClientProvider", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  beforeEach(() => {
    mockClientInstances.length = 0;
    mockUseSession.mockReset();
    mockGetConvexUrl.mockReset();
    mockProviderSpy.mockReset();
  });

  it("recreates and closes the Convex client when the auth session changes", () => {
    let sessionId: string | null = "session-a";
    mockGetConvexUrl.mockReturnValue("https://resilient-sparrow-160.convex.cloud");
    mockUseSession.mockImplementation(() => ({
      data: sessionId
        ? {
            session: {
              id: sessionId,
            },
          }
        : null,
    }));

    const { rerender, unmount } = render(
      <ConvexClientProvider>
        <Text>child</Text>
      </ConvexClientProvider>
    );

    expect(mockClientInstances).toHaveLength(1);
    expect(mockProviderSpy).toHaveBeenCalledTimes(1);

    sessionId = "session-b";

    rerender(
      <ConvexClientProvider>
        <Text>child</Text>
      </ConvexClientProvider>
    );

    expect(mockClientInstances).toHaveLength(2);
    expect(mockClientInstances[0].close).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockClientInstances[1].close).toHaveBeenCalledTimes(1);
  });

  it("renders children without a client when the Convex url is missing", () => {
    mockGetConvexUrl.mockReturnValue(null);
    mockUseSession.mockReturnValue({ data: null });

    const { getByText } = render(
      <ConvexClientProvider>
        <Text>no client</Text>
      </ConvexClientProvider>
    );

    expect(getByText("no client")).toBeTruthy();
    expect(mockProviderSpy).not.toHaveBeenCalled();
  });
});
