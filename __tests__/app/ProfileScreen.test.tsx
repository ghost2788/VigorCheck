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
  useSubscription: () => ({
    accessState: {
      status: "trial",
    },
    isConfigured: true,
    isLoading: false,
    manageSubscription: jest.fn(),
    purchaseMonthly: jest.fn(),
    restorePurchases: jest.fn(),
    statusLabel: "7 days left in your free trial",
    supportMessage: null,
  }),
}));

describe("ProfileScreen", () => {
  let openLegalLinkSpy: jest.SpyInstance;

  beforeEach(() => {
    (global as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
    openLegalLinkSpy = jest.spyOn(legalLinks, "openLegalLink").mockResolvedValue(undefined);
    jest.clearAllMocks();
    asyncStorage.getItem.mockResolvedValue("dark");
    asyncStorage.setItem.mockResolvedValue(undefined);
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseMutation.mockReset();
    mockUseQuery.mockReset();
    mockUseSession.mockReset();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: "tester@example.com",
          name: "Tester",
        },
      },
    });
    let queryCall = 0;
    mockUseQuery.mockImplementation((_, args) => {
      queryCall += 1;
      const cycleIndex = ((queryCall - 1) % 3) + 1;

      if (args === "skip") {
        return undefined;
      }

      if (cycleIndex === 1) {
        return profileUser;
      }

      if (cycleIndex === 2) {
        return profileAiUsage;
      }

      return diagnosticsSnapshot;
    });
  });

  afterEach(() => {
    openLegalLinkSpy.mockRestore();
  });

  it("renders summary cards and pushes into dedicated settings screens", async () => {
    const forceTrialExpired = jest.fn();
    mockUseMutation.mockReturnValue(forceTrialExpired);

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

  it("renders an Appearance card and lets the user switch to light mode", async () => {
    const forceTrialExpired = jest.fn();
    mockUseMutation.mockReturnValue(forceTrialExpired);

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

  it("opens the account deletion request path from Profile", async () => {
    const forceTrialExpired = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(forceTrialExpired);

    const { getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    fireEvent.press(getByText("Request account deletion"));

    expect(openLegalLinkSpy).toHaveBeenCalledWith("accountDeletion");
  });

  it("shows an internal testing shortcut that force-expires the current trial", async () => {
    const expireTrial = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(expireTrial);

    const { getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    fireEvent.press(getByText("Force trial expiry"));

    await waitFor(() => {
      expect(expireTrial).toHaveBeenCalledTimes(1);
    });
  });

  it("renders AI diagnostics inside internal testing when enabled", async () => {
    const expireTrial = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(expireTrial);

    const { getAllByText, getByText } = render(<ProfileScreen />, { hydrateTheme: true });

    await flushThemeHydration();

    expect(getByText("AI diagnostics")).toBeTruthy();
    expect(getByText("8 requests")).toBeTruthy();
    expect(getByText("$0.02 estimated cost")).toBeTruthy();
    expect(getAllByText("Photo scans")).toHaveLength(2);
    expect(getAllByText("Drink estimates").length).toBeGreaterThan(0);
    expect(getByText("Supplement scans")).toBeTruthy();
    expect(getByText("Photo scan")).toBeTruthy();
    expect(getByText("gpt-4.1 • Completed")).toBeTruthy();
    expect(getByText("1,500 tokens")).toBeTruthy();
  });

  it("skips the diagnostics query entirely when internal testing is disabled", () => {
    (global as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
    const expireTrial = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(expireTrial);

    render(<ProfileScreen />, { hydrateTheme: true });

    expect(mockUseQuery.mock.calls[2]?.[1]).toBe("skip");
  });
});
