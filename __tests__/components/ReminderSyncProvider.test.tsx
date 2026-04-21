import React from "react";
import { AppState, Platform } from "react-native";

const mockUseQuery = jest.fn();
const mockConfigureReminderNotificationHandler = jest.fn();
const mockEnsureReminderChannel = jest.fn();
const mockGetReminderPermissionsStatus = jest.fn();
const mockCancelAppOwnedReminderNotifications = jest.fn();
const mockScheduleReminderNotification = jest.fn();
const mockGetReminderOneShotState = jest.fn();
const mockSetLastGoalCompletionReminderDate = jest.fn();
const mockSetLastEndOfDayReminderDate = jest.fn();
const mockAppStateAddEventListener = jest.spyOn(AppState, "addEventListener");

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../../lib/reminders/notifications", () => ({
  cancelAppOwnedReminderNotifications: () => mockCancelAppOwnedReminderNotifications(),
  configureReminderNotificationHandler: () => mockConfigureReminderNotificationHandler(),
  ensureReminderChannel: () => mockEnsureReminderChannel(),
  getReminderPermissionsStatus: () => mockGetReminderPermissionsStatus(),
  scheduleReminderNotification: (...args: unknown[]) => mockScheduleReminderNotification(...args),
}));

jest.mock("../../lib/reminders/storage", () => ({
  getReminderOneShotState: () => mockGetReminderOneShotState(),
  setLastEndOfDayReminderDate: (...args: unknown[]) => mockSetLastEndOfDayReminderDate(...args),
  setLastGoalCompletionReminderDate: (...args: unknown[]) => mockSetLastGoalCompletionReminderDate(...args),
}));

const { waitFor, render } = require("../../lib/test-utils");
const { ReminderSyncProvider } = require("../../lib/reminders/ReminderSyncProvider");
const { ThemedText } = require("../../components/ThemedText");

type MockCurrentUser = {
  _id: string;
  activityLevel: "moderate";
  age: number;
  goalType: "general_health";
  height: number;
  reminders: {
    notifyEndOfDay: boolean;
    notifyGoalCompletion: boolean;
    notifyHydration: boolean;
    notifyMealLogging: boolean;
    sleepTime: string;
    wakeTime: string;
  };
  sex: "male";
  targets: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  };
  themePalette: "default";
  timeZone: string;
  weight: number;
};

type MockReminderSnapshot = {
  biggestGapKey: "hydration";
  dateKey: string;
  lastHydrationTimestamp: number | null;
  lastMealTimestamp: number | null;
  mealCount: number;
  progress: {
    caloriesPercent: number;
    caloriesScore: number;
    caloriesOnTarget: boolean;
    carbsPercent: number;
    carbsScore: number;
    carbsOnTarget: boolean;
    fatPercent: number;
    fatScore: number;
    fatOnTarget: boolean;
    hydrationPercent: number;
    nutritionPercent: number;
    proteinPercent: number;
    proteinOnTarget: boolean;
  };
  timeZone: string;
};

function buildCurrentUser(overrides: Partial<MockCurrentUser> = {}): MockCurrentUser {
  return {
    _id: "user_1",
    activityLevel: "moderate",
    age: 32,
    goalType: "general_health",
    height: 70,
    reminders: {
      notifyEndOfDay: false,
      notifyGoalCompletion: false,
      notifyHydration: true,
      notifyMealLogging: false,
      sleepTime: "22:00",
      wakeTime: "07:00",
    },
    sex: "male",
    targets: {
      calories: 2200,
      carbs: 250,
      fat: 70,
      protein: 140,
    },
    themePalette: "default",
    timeZone: "UTC",
    weight: 180,
    ...overrides,
  };
}

function buildSnapshot(overrides: Partial<MockReminderSnapshot> = {}): MockReminderSnapshot {
  return {
    biggestGapKey: "hydration",
    dateKey: "2026-04-01",
    lastHydrationTimestamp: null,
    lastMealTimestamp: null,
    mealCount: 0,
    progress: {
      caloriesPercent: 25,
      caloriesScore: 25,
      caloriesOnTarget: false,
      carbsPercent: 25,
      carbsScore: 25,
      carbsOnTarget: false,
      fatPercent: 25,
      fatScore: 25,
      fatOnTarget: false,
      hydrationPercent: 10,
      nutritionPercent: 20,
      proteinPercent: 15,
      proteinOnTarget: false,
    },
    timeZone: "UTC",
    ...overrides,
  };
}

describe("ReminderSyncProvider", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockConfigureReminderNotificationHandler.mockReset();
    mockEnsureReminderChannel.mockReset();
    mockGetReminderPermissionsStatus.mockReset();
    mockCancelAppOwnedReminderNotifications.mockReset();
    mockScheduleReminderNotification.mockReset();
    mockGetReminderOneShotState.mockReset();
    mockSetLastGoalCompletionReminderDate.mockReset();
    mockSetLastEndOfDayReminderDate.mockReset();
    mockAppStateAddEventListener.mockReset();
    (Platform as { OS: string }).OS = "ios";

    mockEnsureReminderChannel.mockResolvedValue(undefined);
    mockCancelAppOwnedReminderNotifications.mockResolvedValue(undefined);
    mockScheduleReminderNotification.mockResolvedValue("notification-1");
    mockGetReminderOneShotState.mockResolvedValue({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
    });
    mockAppStateAddEventListener.mockReturnValue({
      remove: jest.fn(),
    } as never);
  });

  it("cancels and rebuilds app-owned reminders when enabled settings and snapshot data are present", async () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("granted");
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      callIndex += 1;
      return callIndex % 2 === 1
        ? buildCurrentUser({
            reminders: {
              ...buildCurrentUser().reminders,
              notifyGoalCompletion: true,
              notifyHydration: false,
            },
          })
        : buildSnapshot({
            progress: {
              caloriesPercent: 100,
              caloriesScore: 100,
              caloriesOnTarget: true,
              carbsPercent: 100,
              carbsScore: 100,
              carbsOnTarget: true,
              fatPercent: 100,
              fatScore: 100,
              fatOnTarget: true,
              hydrationPercent: 100,
              nutritionPercent: 40,
              proteinPercent: 100,
              proteinOnTarget: true,
            },
          });
    });

    render(
      <ReminderSyncProvider>
        <ThemedText>child</ThemedText>
      </ReminderSyncProvider>
    );

    await waitFor(() => {
      expect(mockCancelAppOwnedReminderNotifications).toHaveBeenCalled();
      expect(mockScheduleReminderNotification).toHaveBeenCalled();
    });
  });

  it("does not duplicate goal completion reminders once the current date was already recorded", async () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("granted");
    mockGetReminderOneShotState.mockResolvedValue({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: "2026-04-01",
    });
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      callIndex += 1;
      return callIndex % 2 === 1
        ? buildCurrentUser({
            reminders: {
              ...buildCurrentUser().reminders,
              notifyGoalCompletion: true,
              notifyHydration: false,
            },
          })
        : buildSnapshot({
            progress: {
              caloriesPercent: 100,
              caloriesScore: 100,
              caloriesOnTarget: true,
              carbsPercent: 100,
              carbsScore: 100,
              carbsOnTarget: true,
              fatPercent: 100,
              fatScore: 100,
              fatOnTarget: true,
              hydrationPercent: 100,
              nutritionPercent: 40,
              proteinPercent: 100,
              proteinOnTarget: true,
            },
          });
    });

    render(
      <ReminderSyncProvider>
        <ThemedText>child</ThemedText>
      </ReminderSyncProvider>
    );

    await waitFor(() => {
      expect(mockCancelAppOwnedReminderNotifications).toHaveBeenCalled();
    });

    expect(mockScheduleReminderNotification).not.toHaveBeenCalled();
    expect(mockSetLastGoalCompletionReminderDate).not.toHaveBeenCalled();
  });
});
