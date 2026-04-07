import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import ProfileReminderSettingsScreen from "../../app/profile/reminder-settings";

const mockBack = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQuery = jest.fn();
const mockUsePreventRemove = jest.fn();
const mockGetReminderPermissionsStatus = jest.fn();
const mockDispatch = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
  }),
  usePreventRemove: (...args: unknown[]) => mockUsePreventRemove(...args),
}));

jest.mock("../../lib/reminders/notifications", () => ({
  getReminderPermissionsStatus: () => mockGetReminderPermissionsStatus(),
  requestReminderPermissions: jest.fn(async () => "granted"),
}));

jest.mock("../../lib/reminders/ReminderSyncProvider", () => ({
  useReminderSync: () => ({
    refreshReminders: jest.fn(),
  }),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    default: () => React.createElement(Text, { testID: "mockDateTimePicker" }, "picker"),
  };
});

describe("ProfileReminderSettingsScreen", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockDispatch.mockReset();
    mockUseMutation.mockReset();
    mockUsePreventRemove.mockReset();
    mockGetReminderPermissionsStatus.mockReset();
    mockGetReminderPermissionsStatus.mockResolvedValue("granted");
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
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
        notifyGoalCompletion: false,
        notifyHydration: false,
        notifyMealLogging: false,
        sleepTime: "22:00",
        wakeTime: "07:00",
      },
      sex: "male",
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves reminder changes and returns to profile", async () => {
    const updateReminderSettings = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(updateReminderSettings);

    const { getByTestId, getByText } = render(<ProfileReminderSettingsScreen />);

    fireEvent(getByTestId("notifyHydrationToggle"), "valueChange", true);
    fireEvent.press(getByText("Save reminders"));

    await waitFor(() => {
      expect(updateReminderSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyHydration: true,
        })
      );
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  it("prompts before discarding dirty reminder edits", () => {
    const updateReminderSettings = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(updateReminderSettings);

    const { getByTestId } = render(<ProfileReminderSettingsScreen />);

    fireEvent(getByTestId("notifyHydrationToggle"), "valueChange", true);

    const preventRemoveCallback = mockUsePreventRemove.mock.calls.at(-1)?.[1];
    preventRemoveCallback?.({
      data: {
        action: { type: "GO_BACK" },
      },
    });

    expect(Alert.alert).toHaveBeenCalled();
  });
});
