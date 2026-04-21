import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { act, fireEvent, render, waitFor } from "../../lib/test-utils";
import ProfileScreen from "../../app/(tabs)/profile";
import * as legalLinks from "../../lib/config/legalLinks";
import { THEME_PREFERENCE_STORAGE_KEY } from "../../lib/theme/ThemeProvider";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseSession = jest.fn();
const mockUseSubscription = jest.fn();
const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const profileUser = {
  _id: "user-1",
  activityLevel: "moderate",
  age: 34,
  displayName: "Tester",
  goalPace: "moderate",
  goalType: "fat_loss",
  height: 70,
  preferredUnitSystem: "imperial",
  primaryTrackingChallenge: "consistency",
  reminders: {
    notifyEndOfDay: false,
    notifyGoalCompletion: true,
    notifyHydration: true,
    notifyMealLogging: false,
    sleepTime: "22:00",
    wakeTime: "07:00",
  },
  sex: "male",
  subscription: {
    daysLeftInTrial: 7,
    status: "trial",
  },
  targets: {
    calories: 2500,
    carbs: 250,
    fat: 80,
    protein: 180,
  },
  timeZone: "Pacific/Honolulu",
  weight: 180,
};

const profileAiUsage = {
  photo: {
    daily: {
      isBlocked: false,
      isWarning: false,
      label: "Today",
      limit: 12,
      remaining: 9,
      used: 3,
    },
    isWarning: false,
    period: {
      isBlocked: false,
      isWarning: false,
      label: "Trial total",
      limit: 12,
      remaining: 5,
      resetLabel: "Trial total",
      used: 7,
    },
    primaryBucketLabel: "Trial total",
  },
  status: "trial",
  text: {
    isWarning: false,
    period: {
      isBlocked: false,
      isWarning: false,
      label: "Trial total",
      limit: 100,
      remaining: 64,
      resetLabel: "Trial total",
      used: 36,
    },
  },
};

const diagnosticsSnapshot = {
  status: "ready" as const,
  recentEvents: [
    {
      callKind: "photo_scan",
      completedAt: 1_712_300_000_000,
      estimatedCostUsdMicros: 5_700,
      model: "gpt-4.1",
      resultStatus: "completed",
      totalTokens: 1_500,
      usageState: "present",
    },
  ],
  totals: {
    blockedCount: 2,
    estimatedCostUsdMicros: 20_000,
    postprocessErrorCount: 1,
    requestCount: 8,
    usageMissingCount: 1,
  },
  breakdown: [
    {
      blockedCount: 0,
      callKind: "photo_scan",
      estimatedCostUsdMicros: 10_000,
      postprocessErrorCount: 0,
      requestCount: 3,
      usageMissingCount: 0,
    },
    {
      blockedCount: 1,
      callKind: "text_entry",
      estimatedCostUsdMicros: 8_000,
      postprocessErrorCount: 1,
      requestCount: 4,
      usageMissingCount: 1,
    },
    {
      blockedCount: 1,
      callKind: "drink_estimate",
      estimatedCostUsdMicros: 2_000,
      postprocessErrorCount: 0,
      requestCount: 1,
      usageMissingCount: 0,
    },
    {
      blockedCount: 0,
      callKind: "supplement_scan",
      estimatedCostUsdMicros: 4_000,
      postprocessErrorCount: 0,
      requestCount: 2,
      usageMissingCount: 0,
    },
  ],
  window: {
    endDateKey: "2026-04-06",
    startDateKey: "2026-03-08",
  },
};

const lockedDiagnosticsSnapshot = {
  status: "locked" as const,
};

async function flushThemeHydration() {
  await waitFor(() => {
    expect(asyncStorage.getItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
  });

  await act(async () => {
    await Promise.resolve();
  });
}

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/auth/authClient", () => ({
  authClient: {
    signOut: jest.fn(),
    useSession: () => mockUseSession(),
  },
}));

jest.mock("../../lib/billing/SubscriptionProvider", () => ({
  useSubscription: () => mockUseSubscription(),
}));

describe("ProfileScreen", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  function mockTestingMutations() {
    const unlockInternalTools = jest.fn().mockResolvedValue({
      unlockToken: "dev-unlock-token",
    });
    const forceTrialExpired = jest.fn().mockResolvedValue(undefined);
    const restoreTrial = jest.fn().mockResolvedValue(undefined);
    let mutationCall = 0;
    mockUseMutation.mockReset();
    mockUseMutation.mockImplementation(() => {
      mutationCall += 1;
      const cycleIndex = ((mutationCall - 1) % 3) + 1;

      if (cycleIndex === 1) {
        return unlockInternalTools;
      }

      if (cycleIndex === 2) {
        return forceTrialExpired;
      }

      return restoreTrial;
    });

    return { forceTrialExpired, restoreTrial, unlockInternalTools };
  }

  async function unlockDevTools(
    screen: ReturnType<typeof render>,
    password = "correct horse battery staple"
  ) {
    fireEvent(screen.getByTestId("profile-dev-tools-trigger"), "longPress");
    fireEvent.press(screen.getByText("Dev tools"));
    fireEvent.changeText(screen.getByTestId("profile-dev-tools-password-input"), password);
    fireEvent.press(screen.getByText("Unlock"));

    await waitFor(() => {
      expect(screen.getByText("Internal testing")).toBeTruthy();
    });
  }

  beforeEach(() => {
    (global as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
    jest.clearAllMocks();
    asyncStorage.getItem.mockResolvedValue("dark");
    asyncStorage.setItem.mockResolvedValue(undefined);
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseSession.mockReset();
    mockUseSubscription.mockReset();
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: "tester@example.com",
          name: "Tester",
        },
      },
    });
    mockUseSubscription.mockReturnValue({
      accessState: {
        daysRemaining: 7,
        status: "trial",
      },
      isConfigured: true,
      isLoading: false,
      manageSubscription: jest.fn(),
      purchaseMonthly: jest.fn(),
      restorePurchases: jest.fn(),
      statusLabel: "7 days left in your free trial",
      supportMessage: null,
    });
    let queryCall = 0;
    mockUseQuery.mockImplementation((_, args) => {
      queryCall += 1;
      const cycleIndex = ((queryCall - 1) % 4) + 1;

      if (args === "skip") {
        return undefined;
      }

      if (cycleIndex === 1) {
        return profileUser;
      }

      if (cycleIndex === 2) {
        return profileAiUsage;
      }

      if (cycleIndex === 3) {
        return { enabled: true };
      }

      return diagnosticsSnapshot;
    });
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("renders summary cards and pushes into dedicated settings screens", async () => {
    mockTestingMutations();

    const { getAllByText, getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    expect(getByText("AI usage")).toBeTruthy();
    expect(getByText("5 left in trial")).toBeTruthy();
    expect(getByText("9 left today")).toBeTruthy();
    expect(getByText("64 left in trial")).toBeTruthy();
    expect(getByText("Goals & Targets")).toBeTruthy();
    expect(getByText("Body & Preferences")).toBeTruthy();
    expect(getByText("Reminders")).toBeTruthy();

    fireEvent.press(getAllByText("Edit")[0]);
    expect(mockPush).toHaveBeenCalledWith("/profile/plan-settings");

    fireEvent.press(getByText("Notifications"));
    expect(mockPush).toHaveBeenCalledWith("/profile/reminder-settings");
  });

  it("hides the unused pace summary row for goals that do not use pace", async () => {
    mockTestingMutations();
    let queryCall = 0;
    mockUseQuery.mockImplementation((_, args) => {
      queryCall += 1;
      const cycleIndex = ((queryCall - 1) % 4) + 1;

      if (args === "skip") {
        return undefined;
      }

      if (cycleIndex === 1) {
        return {
          ...profileUser,
          goalPace: undefined,
          goalType: "general_health",
        };
      }

      if (cycleIndex === 2) {
        return profileAiUsage;
      }

      if (cycleIndex === 3) {
        return { enabled: true };
      }

      return diagnosticsSnapshot;
    });

    const { getByText, queryByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    expect(getByText("Goals & Targets")).toBeTruthy();
    expect(queryByText("Not used")).toBeNull();
  });

  it("renders an Appearance card and lets the user switch to light mode", async () => {
    mockTestingMutations();

    const { getByTestId, getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    expect(getByText("Appearance")).toBeTruthy();
    expect(getByText("Applies to this device")).toBeTruthy();
    expect(getByText("Dark")).toBeTruthy();
    expect(getByText("Light")).toBeTruthy();

    await flushThemeHydration();

    asyncStorage.setItem.mockClear();

    fireEvent.press(getByTestId("appearance-option-light"));

    await waitFor(() => {
      expect(getByTestId("appearance-option-light").props.accessibilityState.selected).toBe(true);
    });

    await waitFor(() => {
      expect(asyncStorage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY, "light");
    });
  });

  it("opens the public account deletion request path from the account card", async () => {
    mockTestingMutations();

    const { getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    fireEvent.press(getByText("Request account deletion"));

    await waitFor(() => {
      expect(openLegalLinkSpy).toHaveBeenCalledWith("accountDeletion");
    });
  });

  it("keeps dev tools hidden until the secret flow succeeds", async () => {
    const { unlockInternalTools } = mockTestingMutations();
    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    expect(screen.queryByText("Internal testing")).toBeNull();
    expect(screen.queryByText("AI diagnostics")).toBeNull();
    expect(screen.queryByText("Dev tools")).toBeNull();

    fireEvent(screen.getByTestId("profile-dev-tools-trigger"), "longPress");

    expect(screen.getByText("Dev tools")).toBeTruthy();
    expect(screen.queryByTestId("profile-dev-tools-unlock-card")).toBeNull();

    fireEvent.press(screen.getByText("Dev tools"));
    expect(screen.getByTestId("profile-dev-tools-unlock-card")).toBeTruthy();
    fireEvent.changeText(
      screen.getByTestId("profile-dev-tools-password-input"),
      "correct horse battery staple"
    );
    fireEvent.press(screen.getByText("Unlock"));

    await waitFor(() => {
      expect(unlockInternalTools).toHaveBeenCalledWith({
        password: "correct horse battery staple",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Internal testing")).toBeTruthy();
      expect(screen.getByText("AI diagnostics")).toBeTruthy();
    });
  });

  it("shows an internal testing shortcut that force-expires the current trial", async () => {
    const { forceTrialExpired } = mockTestingMutations();
    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();
    await unlockDevTools(screen);

    fireEvent.press(screen.getByTestId("profile-testing-force-trial-expiry"));

    await waitFor(() => {
      expect(forceTrialExpired).toHaveBeenCalledTimes(1);
      expect(forceTrialExpired).toHaveBeenCalledWith({ unlockToken: "dev-unlock-token" });
    });
  });

  it("shows an internal testing shortcut that restores a fresh seven day trial", async () => {
    const { restoreTrial } = mockTestingMutations();
    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();
    await unlockDevTools(screen);

    fireEvent.press(screen.getByTestId("profile-testing-restore-trial"));

    await waitFor(() => {
      expect(restoreTrial).toHaveBeenCalledTimes(1);
      expect(restoreTrial).toHaveBeenCalledWith({ unlockToken: "dev-unlock-token" });
    });
  });

  it("disables restore when the current account is already active", async () => {
    mockTestingMutations();
    mockUseSubscription.mockReturnValue({
      accessState: {
        daysRemaining: 0,
        status: "active",
      },
      isConfigured: true,
      isLoading: false,
      manageSubscription: jest.fn(),
      purchaseMonthly: jest.fn(),
      restorePurchases: jest.fn(),
      statusLabel: "Pro active",
      supportMessage: null,
    });

    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();
    await unlockDevTools(screen);

    const restoreButton = screen.getByTestId("profile-testing-restore-trial");
    expect(restoreButton.props.accessibilityState?.disabled).toBe(true);
    expect(
      screen.getByText("Trial restore stays disabled while this account already has active access.")
    ).toBeTruthy();
  });

  it("renders AI diagnostics inside internal testing when unlocked", async () => {
    mockTestingMutations();
    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();
    await unlockDevTools(screen);

    expect(screen.getByText("AI diagnostics")).toBeTruthy();
    expect(screen.getByText("8 requests")).toBeTruthy();
    expect(screen.getByText("$0.02 estimated cost")).toBeTruthy();
    expect(screen.getAllByText("Photo scans")).toHaveLength(2);
    expect(screen.getAllByText("Drink estimates").length).toBeGreaterThan(0);
    expect(screen.getByText("Supplement scans")).toBeTruthy();
    expect(screen.getByText("Photo scan")).toBeTruthy();
    expect(screen.getByText("gpt-4.1 • Completed")).toBeTruthy();
    expect(screen.getByText("1,500 tokens")).toBeTruthy();
  });

  it("keeps sections hidden and shows an inline error when the password is wrong", async () => {
    const { unlockInternalTools } = mockTestingMutations();
    unlockInternalTools.mockRejectedValueOnce(new Error("The internal tools password is incorrect."));
    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    fireEvent(screen.getByTestId("profile-dev-tools-trigger"), "longPress");
    fireEvent.press(screen.getByText("Dev tools"));
    fireEvent.changeText(screen.getByTestId("profile-dev-tools-password-input"), "wrong password");
    fireEvent.press(screen.getByText("Unlock"));

    await waitFor(() => {
      expect(screen.getByText("The internal tools password is incorrect.")).toBeTruthy();
    });

    expect(screen.queryByText("Internal testing")).toBeNull();
    expect(screen.queryByText("AI diagnostics")).toBeNull();
  });

  it("does not surface the hidden flow when the backend availability query is false", async () => {
    mockTestingMutations();
    let queryCall = 0;
    mockUseQuery.mockImplementation((_, args) => {
      queryCall += 1;
      const cycleIndex = ((queryCall - 1) % 4) + 1;

      if (args === "skip") {
        return undefined;
      }

      if (cycleIndex === 1) {
        return profileUser;
      }

      if (cycleIndex === 2) {
        return profileAiUsage;
      }

      if (cycleIndex === 3) {
        return { enabled: false };
      }

      return diagnosticsSnapshot;
    });

    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    expect(screen.queryByTestId("profile-dev-tools-trigger")).toBeNull();
    expect(screen.queryByText("Dev tools")).toBeNull();
    expect(screen.queryByText("Internal testing")).toBeNull();
    expect(screen.queryByText("AI diagnostics")).toBeNull();
  });

  it("relocks the hidden tools if diagnostics reports a locked sentinel", async () => {
    mockTestingMutations();
    let queryCall = 0;
    mockUseQuery.mockImplementation((_, args) => {
      queryCall += 1;
      const cycleIndex = ((queryCall - 1) % 4) + 1;

      if (args === "skip") {
        return undefined;
      }

      if (cycleIndex === 1) {
        return profileUser;
      }

      if (cycleIndex === 2) {
        return profileAiUsage;
      }

      if (cycleIndex === 3) {
        return { enabled: true };
      }

      return lockedDiagnosticsSnapshot;
    });

    const screen = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();
    fireEvent(screen.getByTestId("profile-dev-tools-trigger"), "longPress");
    fireEvent.press(screen.getByText("Dev tools"));
    fireEvent.changeText(
      screen.getByTestId("profile-dev-tools-password-input"),
      "correct horse battery staple"
    );
    fireEvent.press(screen.getByText("Unlock"));

    await waitFor(() => {
      expect(screen.queryByText("Internal testing")).toBeNull();
      expect(screen.getByText("Dev tools locked. Unlock again to continue.")).toBeTruthy();
    });
  });

  it("skips the hidden dev-tools queries entirely when internal testing is disabled", () => {
    (global as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
    mockTestingMutations();

    render(<ProfileScreen />, { hydrateTheme: true });

    expect(mockUseQuery.mock.calls[2]?.[1]).toBe("skip");
    expect(mockUseQuery.mock.calls[3]?.[1]).toBe("skip");
  });
});
