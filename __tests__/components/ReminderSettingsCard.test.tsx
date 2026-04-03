import React from "react";
import { fireEvent, render, waitFor } from "../../lib/test-utils";
import { ReminderSettingsCard } from "../../components/ReminderSettingsCard";

const mockGetReminderPermissionsStatus = jest.fn();
const mockRequestReminderPermissions = jest.fn();

jest.mock("../../lib/reminders/notifications", () => ({
  getReminderPermissionsStatus: () => mockGetReminderPermissionsStatus(),
  requestReminderPermissions: () => mockRequestReminderPermissions(),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    default: () => React.createElement(Text, { testID: "mockDateTimePicker" }, "picker"),
  };
});

const initialSettings = {
  notifyEndOfDay: false,
  notifyGoalCompletion: false,
  notifyHydration: false,
  notifyMealLogging: false,
  sleepTime: "22:00",
  wakeTime: "07:00",
};

describe("ReminderSettingsCard", () => {
  beforeEach(() => {
    mockGetReminderPermissionsStatus.mockReset();
    mockRequestReminderPermissions.mockReset();
  });

  it("shows the native time picker when a time field is pressed", () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("granted");
    const onSave = jest.fn();
    const { getByTestId } = render(
      <ReminderSettingsCard initialSettings={initialSettings} onSave={onSave} />
    );

    fireEvent.press(getByTestId("wakeTimeButton"));

    expect(getByTestId("mockDateTimePicker")).toBeTruthy();
  });

  it("blocks invalid wake and sleep windows", async () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("granted");
    const onSave = jest.fn();
    const { getByText } = render(
      <ReminderSettingsCard
        initialSettings={{
          ...initialSettings,
          sleepTime: "11:00",
        }}
        onSave={onSave}
      />
    );

    fireEvent.press(getByText("Save reminders"));

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(getByText("Wake and sleep times must leave at least 6 hours awake.")).toBeTruthy();
    });
  });

  it("requests notification permission before saving enabled reminders", async () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("undetermined");
    mockRequestReminderPermissions.mockResolvedValue("granted");
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = render(
      <ReminderSettingsCard initialSettings={initialSettings} onSave={onSave} />
    );

    fireEvent(getByTestId("notifyHydrationToggle"), "valueChange", true);
    fireEvent.press(getByText("Save reminders"));

    await waitFor(() => {
      expect(mockRequestReminderPermissions).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({
        ...initialSettings,
        notifyHydration: true,
      });
    });
  });

  it("keeps reminder toggles off when permission is denied", async () => {
    mockGetReminderPermissionsStatus.mockResolvedValue("undetermined");
    mockRequestReminderPermissions.mockResolvedValue("denied");
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(
      <ReminderSettingsCard initialSettings={initialSettings} onSave={onSave} />
    );

    fireEvent(getByTestId("notifyHydrationToggle"), "valueChange", true);
    fireEvent.press(getByText("Save reminders"));

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(getByText("Notification permission is required to enable reminders.")).toBeTruthy();
      expect(getByTestId("notifyHydrationToggle").props.value).toBe(false);
    });
  });
});
