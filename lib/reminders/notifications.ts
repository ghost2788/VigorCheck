import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { ReminderNotificationSpec } from "../domain/reminders";

export type ReminderPermissionStatus = "granted" | "denied" | "undetermined";

const REMINDER_CHANNEL_ID = "reminders";
let handlerConfigured = false;

function normalizePermissionStatus(result: { granted?: boolean; status: string }): ReminderPermissionStatus {
  if (result.granted || result.status === "granted") {
    return "granted";
  }

  if (result.status === "undetermined") {
    return "undetermined";
  }

  return "denied";
}

function isReminderData(data: unknown): data is { origin: "caltracker-reminder" } {
  return (
    typeof data === "object" &&
    data !== null &&
    "origin" in data &&
    (data as { origin?: string }).origin === "caltracker-reminder"
  );
}

export function configureReminderNotificationHandler() {
  if (handlerConfigured || Platform.OS === "web") {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function ensureReminderChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#5ebaa9",
    name: "Reminders",
  });
}

export async function getReminderPermissionsStatus(): Promise<ReminderPermissionStatus> {
  if (Platform.OS === "web") {
    return "denied";
  }

  const result = await Notifications.getPermissionsAsync();
  return normalizePermissionStatus(result);
}

export async function requestReminderPermissions(): Promise<ReminderPermissionStatus> {
  if (Platform.OS === "web") {
    return "denied";
  }

  await ensureReminderChannel();
  const result = await Notifications.requestPermissionsAsync();
  return normalizePermissionStatus(result);
}

export async function cancelAppOwnedReminderNotifications() {
  if (Platform.OS === "web") {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const appOwnedNotifications = scheduled.filter((request) => isReminderData(request.content.data));

  await Promise.all(
    appOwnedNotifications.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

export async function scheduleReminderNotification(notification: ReminderNotificationSpec) {
  if (Platform.OS === "web") {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      body: notification.body,
      data: notification.data,
      title: notification.title,
    },
    trigger:
      notification.triggerAt === null
        ? null
        : {
            date: notification.triggerAt,
            type: Notifications.SchedulableTriggerInputTypes.DATE,
          },
  });
}
