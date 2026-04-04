import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import ProfileScreen from "../../app/(tabs)/profile";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUseSession = jest.fn();

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
  beforeEach(() => {
    process.env.EXPO_PUBLIC_ENABLE_INTERNAL_TESTING_TOOLS = "true";
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
    mockUseQuery.mockReturnValue({
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
    });
  });

  it("renders summary cards and pushes into dedicated settings screens", () => {
    const forceTrialExpired = jest.fn();

    mockUseMutation.mockReturnValue(forceTrialExpired);

    const { getAllByText, getByText } = render(<ProfileScreen />);

    expect(getByText("Goals & Targets")).toBeTruthy();
    expect(getByText("Body & Preferences")).toBeTruthy();
    expect(getByText("Reminders")).toBeTruthy();

    fireEvent.press(getAllByText("Edit")[0]);
    expect(mockPush).toHaveBeenCalledWith("/profile/plan-settings");

    // ProfileReminderSummary wraps the whole card in a Pressable; pressing it
    // navigates to the reminder-settings screen.
    fireEvent.press(getByText("Notifications"));
    expect(mockPush).toHaveBeenCalledWith("/profile/reminder-settings");
  });

  it("shows an internal testing shortcut that force-expires the current trial", async () => {
    const expireTrial = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(expireTrial);

    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText("Force trial expiry"));

    await waitFor(() => {
      expect(expireTrial).toHaveBeenCalledTimes(1);
    });
  });
});
