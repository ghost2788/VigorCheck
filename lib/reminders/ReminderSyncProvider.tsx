import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { buildReminderSchedule, hasAnyReminderEnabled } from "../domain/reminders";
import {
  cancelAppOwnedReminderNotifications,
  configureReminderNotificationHandler,
  ensureReminderChannel,
  getReminderPermissionsStatus,
  scheduleReminderNotification,
} from "./notifications";
import {
  getReminderOneShotState,
  setLastEndOfDayReminderDate,
  setLastGoalCompletionReminderDate,
} from "./storage";

type ReminderSyncContextValue = {
  refreshReminders: () => void;
};

const ReminderSyncContext = createContext<ReminderSyncContextValue | null>(null);

export function ReminderSyncProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.users.current);
  const reminderSnapshot = useQuery(api.dashboard.reminderSnapshot);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const syncingRef = useRef(false);
  const pendingRef = useRef(false);

  const refreshReminders = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);

  const syncFingerprint = useMemo(() => {
    if (currentUser === undefined || reminderSnapshot === undefined) {
      return null;
    }

    return JSON.stringify({
      refreshNonce,
      reminders: currentUser?.reminders ?? null,
      snapshot: reminderSnapshot,
    });
  }, [currentUser, reminderSnapshot, refreshNonce]);

  const performSync = useCallback(async () => {
    if (Platform.OS === "web" || currentUser === undefined || reminderSnapshot === undefined) {
      return;
    }

    configureReminderNotificationHandler();
    await ensureReminderChannel();

    if (!currentUser || !reminderSnapshot || !hasAnyReminderEnabled(currentUser.reminders)) {
      await cancelAppOwnedReminderNotifications();
      return;
    }

    const permissionStatus = await getReminderPermissionsStatus();

    if (permissionStatus !== "granted") {
      await cancelAppOwnedReminderNotifications();
      return;
    }

    const oneShotState = await getReminderOneShotState();
    const schedule = buildReminderSchedule({
      ...oneShotState,
      now: Date.now(),
      settings: currentUser.reminders,
      snapshot: reminderSnapshot,
    });

    await cancelAppOwnedReminderNotifications();

    for (const notification of schedule.notifications) {
      await scheduleReminderNotification(notification);
    }

    if (schedule.persistDates.goalCompletion) {
      await setLastGoalCompletionReminderDate(schedule.persistDates.goalCompletion);
    }

    if (schedule.persistDates.endOfDay) {
      await setLastEndOfDayReminderDate(schedule.persistDates.endOfDay);
    }
  }, [currentUser, reminderSnapshot]);

  const queueSync = useCallback(() => {
    if (Platform.OS === "web") {
      return;
    }

    if (syncingRef.current) {
      pendingRef.current = true;
      return;
    }

    syncingRef.current = true;

    void (async () => {
      try {
        do {
          pendingRef.current = false;
          await performSync();
        } while (pendingRef.current);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [performSync]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    configureReminderNotificationHandler();
    void ensureReminderChannel();
  }, []);

  useEffect(() => {
    if (!syncFingerprint) {
      return;
    }

    queueSync();
  }, [queueSync, syncFingerprint]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        queueSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queueSync]);

  const value = useMemo(
    () => ({
      refreshReminders,
    }),
    [refreshReminders]
  );

  return <ReminderSyncContext.Provider value={value}>{children}</ReminderSyncContext.Provider>;
}

export function useReminderSync() {
  const context = useContext(ReminderSyncContext);

  if (!context) {
    throw new Error("useReminderSync must be used within ReminderSyncProvider.");
  }

  return context;
}
