import { parseTimestampFromLocalDateTime } from "./dayWindow";
import { WellnessKey } from "./wellness";

export type ReminderSettings = {
  notifyEndOfDay: boolean;
  notifyGoalCompletion: boolean;
  notifyHydration: boolean;
  notifyMealLogging: boolean;
  sleepTime: string;
  wakeTime: string;
};

export type ReminderSnapshot = {
  biggestGapKey: WellnessKey;
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

export type ReminderKind = "hydration" | "meal_logging" | "goal_completion" | "end_of_day";

export type ReminderNotificationSpec = {
  body: string;
  data: {
    dateKey: string;
    kind: ReminderKind;
    origin: "caltracker-reminder";
    slot: string;
  };
  id: string;
  kind: ReminderKind;
  title: string;
  triggerAt: number | null;
};

export type ReminderScheduleResult = {
  notifications: ReminderNotificationSpec[];
  persistDates: {
    endOfDay: string | null;
    goalCompletion: string | null;
  };
};

type ClockTime = {
  hour: number;
  minute: number;
};

const MIN_AWAKE_WINDOW_MINUTES = 6 * 60;
const HYDRATION_SUPPRESSION_WINDOW_MS = 90 * 60 * 1000;
const MEAL_MIDDAY_SUPPRESSION_WINDOW_MS = 4 * 60 * 60 * 1000;
const MEAL_EVENING_SUPPRESSION_WINDOW_MS = 5 * 60 * 60 * 1000;
const REMINDER_ORIGIN = "caltracker-reminder";

export function parseClockTime(value: string): ClockTime | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

export function formatClockTime(time: ClockTime) {
  return `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;
}

export function hasAnyReminderEnabled(settings: ReminderSettings) {
  return (
    settings.notifyHydration ||
    settings.notifyMealLogging ||
    settings.notifyGoalCompletion ||
    settings.notifyEndOfDay
  );
}

export function validateReminderWindow({
  sleepTime,
  wakeTime,
}: Pick<ReminderSettings, "sleepTime" | "wakeTime">) {
  const parsedWake = parseClockTime(wakeTime);
  const parsedSleep = parseClockTime(sleepTime);

  if (!parsedWake || !parsedSleep) {
    return "Enter valid times in HH:MM format.";
  }

  const wakeMinutes = toMinutes(parsedWake);
  const sleepMinutes = toMinutes(parsedSleep);

  if (wakeMinutes >= sleepMinutes) {
    return "Wake time must be earlier than sleep time.";
  }

  if (sleepMinutes - wakeMinutes < MIN_AWAKE_WINDOW_MINUTES) {
    return "Wake and sleep times must leave at least 6 hours awake.";
  }

  return null;
}

export function buildReminderSchedule({
  lastEndOfDayReminderDate,
  lastGoalCompletionReminderDate,
  now,
  settings,
  snapshot,
}: {
  lastEndOfDayReminderDate: string | null;
  lastGoalCompletionReminderDate: string | null;
  now: number;
  settings: ReminderSettings;
  snapshot: ReminderSnapshot;
}): ReminderScheduleResult {
  const validationError = validateReminderWindow(settings);

  if (validationError) {
    return {
      notifications: [],
      persistDates: {
        endOfDay: null,
        goalCompletion: null,
      },
    };
  }

  const notifications: ReminderNotificationSpec[] = [];
  let goalCompletionDate: string | null = null;
  let endOfDayDate: string | null = null;

  if (settings.notifyHydration) {
    notifications.push(...buildHydrationNotifications({ now, settings, snapshot }));
  }

  if (settings.notifyMealLogging) {
    notifications.push(...buildMealNotifications({ now, settings, snapshot }));
  }

  if (
    settings.notifyGoalCompletion &&
    lastGoalCompletionReminderDate !== snapshot.dateKey &&
    snapshot.progress.caloriesOnTarget &&
    snapshot.progress.proteinOnTarget &&
    snapshot.progress.carbsOnTarget &&
    snapshot.progress.fatOnTarget
  ) {
    notifications.push(
      createNotification({
        body: "Calories, protein, carbs, and fat are all on target today.",
        dateKey: snapshot.dateKey,
        id: `${snapshot.dateKey}-goal-completion`,
        kind: "goal_completion",
        slot: "goal-completion",
        title: "Macro goals complete",
        triggerAt: null,
      })
    );
    goalCompletionDate = snapshot.dateKey;
  }

  if (
    settings.notifyEndOfDay &&
    lastEndOfDayReminderDate !== snapshot.dateKey &&
    !isDayComplete(snapshot.progress)
  ) {
    const endOfDayTrigger = getTimestampForLocalTime({
      dateKey: snapshot.dateKey,
      offsetMinutes: -45,
      timeValue: settings.sleepTime,
      timeZone: snapshot.timeZone,
    });

    if (endOfDayTrigger !== null) {
      if (endOfDayTrigger > now) {
        notifications.push(
          createNotification({
            body: getEndOfDayBody(snapshot.biggestGapKey),
            dateKey: snapshot.dateKey,
            id: `${snapshot.dateKey}-end-of-day`,
            kind: "end_of_day",
            slot: "end-of-day",
            title: "Day check-in",
            triggerAt: endOfDayTrigger,
          })
        );
      } else {
        notifications.push(
          createNotification({
            body: getEndOfDayBody(snapshot.biggestGapKey),
            dateKey: snapshot.dateKey,
            id: `${snapshot.dateKey}-end-of-day`,
            kind: "end_of_day",
            slot: "end-of-day",
            title: "Day check-in",
            triggerAt: null,
          })
        );
        endOfDayDate = snapshot.dateKey;
      }
    }
  }

  return {
    notifications,
    persistDates: {
      endOfDay: endOfDayDate,
      goalCompletion: goalCompletionDate,
    },
  };
}

function buildHydrationNotifications({
  now,
  settings,
  snapshot,
}: {
  now: number;
  settings: ReminderSettings;
  snapshot: ReminderSnapshot;
}) {
  const wake = parseClockTime(settings.wakeTime);
  const sleep = parseClockTime(settings.sleepTime);

  if (!wake || !sleep) {
    return [];
  }

  const wakeMinutes = toMinutes(wake);
  const sleepMinutes = toMinutes(sleep);
  const awakeWindowMinutes = sleepMinutes - wakeMinutes;
  const checkpoints = [25, 50, 75, 90];

  return checkpoints
    .filter((threshold) => snapshot.progress.hydrationPercent < threshold)
    .map((threshold) => ({
      threshold,
      triggerAt: getTimestampForLocalMinutes({
        dateKey: snapshot.dateKey,
        minutes: wakeMinutes + Math.round((awakeWindowMinutes * threshold) / 100),
        timeZone: snapshot.timeZone,
      }),
    }))
    .filter(
      (entry): entry is { threshold: number; triggerAt: number } =>
        entry.triggerAt !== null && entry.triggerAt > now
    )
    .filter(({ triggerAt }) => {
      if (snapshot.lastHydrationTimestamp === null) {
        return true;
      }

      return snapshot.lastHydrationTimestamp < triggerAt - HYDRATION_SUPPRESSION_WINDOW_MS;
    })
    .map(({ threshold, triggerAt }) =>
      createNotification({
        body: `You're still below ${threshold}% of today's hydration target.`,
        dateKey: snapshot.dateKey,
        id: `${snapshot.dateKey}-hydration-${threshold}`,
        kind: "hydration",
        slot: `hydration-${threshold}`,
        title: "Hydration check-in",
        triggerAt,
      })
    );
}

function buildMealNotifications({
  now,
  settings,
  snapshot,
}: {
  now: number;
  settings: ReminderSettings;
  snapshot: ReminderSnapshot;
}) {
  const wake = parseClockTime(settings.wakeTime);
  const sleep = parseClockTime(settings.sleepTime);

  if (!wake || !sleep) {
    return [];
  }

  const wakeMinutes = toMinutes(wake);
  const sleepMinutes = toMinutes(sleep);
  const midpointMinutes = wakeMinutes + Math.round((sleepMinutes - wakeMinutes) / 2);

  const checkpoints = [
    {
      body: "You haven't logged a meal yet today.",
      id: `${snapshot.dateKey}-meal-breakfast`,
      shouldSchedule: snapshot.mealCount === 0,
      slot: "meal-breakfast",
      title: "Breakfast check-in",
      triggerAt: getTimestampForLocalMinutes({
        dateKey: snapshot.dateKey,
        minutes: wakeMinutes + 120,
        timeZone: snapshot.timeZone,
      }),
    },
    {
      body: "No meal has been logged in the last few hours.",
      id: `${snapshot.dateKey}-meal-midday`,
      shouldSchedule:
        snapshot.lastMealTimestamp === null ||
        snapshot.lastMealTimestamp < getTimestampCutoff({
          dateKey: snapshot.dateKey,
          minutes: midpointMinutes,
          suppressionWindowMs: MEAL_MIDDAY_SUPPRESSION_WINDOW_MS,
          timeZone: snapshot.timeZone,
        }),
      slot: "meal-midday",
      title: "Midday meal check-in",
      triggerAt: getTimestampForLocalMinutes({
        dateKey: snapshot.dateKey,
        minutes: midpointMinutes,
        timeZone: snapshot.timeZone,
      }),
    },
    {
      body: "You're running out of time to finish today's logging.",
      id: `${snapshot.dateKey}-meal-evening`,
      shouldSchedule:
        snapshot.lastMealTimestamp === null ||
        snapshot.lastMealTimestamp <
          getTimestampCutoff({
            dateKey: snapshot.dateKey,
            minutes: sleepMinutes - 180,
            suppressionWindowMs: MEAL_EVENING_SUPPRESSION_WINDOW_MS,
            timeZone: snapshot.timeZone,
          }),
      slot: "meal-evening",
      title: "Evening meal check-in",
      triggerAt: getTimestampForLocalMinutes({
        dateKey: snapshot.dateKey,
        minutes: sleepMinutes - 180,
        timeZone: snapshot.timeZone,
      }),
    },
  ];

  return checkpoints
    .filter((entry) => entry.shouldSchedule)
    .filter(
      (entry): entry is typeof entry & { triggerAt: number } =>
        entry.triggerAt !== null && entry.triggerAt > now
    )
    .map((entry) =>
      createNotification({
        body: entry.body,
        dateKey: snapshot.dateKey,
        id: entry.id,
        kind: "meal_logging",
        slot: entry.slot,
        title: entry.title,
        triggerAt: entry.triggerAt,
      })
    );
}

function createNotification({
  body,
  dateKey,
  id,
  kind,
  slot,
  title,
  triggerAt,
}: {
  body: string;
  dateKey: string;
  id: string;
  kind: ReminderKind;
  slot: string;
  title: string;
  triggerAt: number | null;
}) {
  return {
    body,
    data: {
      dateKey,
      kind,
      origin: REMINDER_ORIGIN,
      slot,
    },
    id,
    kind,
    title,
    triggerAt,
  } satisfies ReminderNotificationSpec;
}

function getEndOfDayBody(biggestGapKey: WellnessKey) {
  const gapCopy: Record<WellnessKey, string> = {
    calories: "Calories are still off target today.",
    carbs: "Carbs are still off target today.",
    fat: "Fat is still off target today.",
    hydration: "Hydration is still trailing today.",
    nutrition: "Nutrition coverage is still lagging today.",
    protein: "Protein is still behind target today.",
  };

  return `${gapCopy[biggestGapKey]} There's still time for one more push.`;
}

function getTimestampCutoff({
  dateKey,
  minutes,
  suppressionWindowMs,
  timeZone,
}: {
  dateKey: string;
  minutes: number;
  suppressionWindowMs: number;
  timeZone: string;
}) {
  const triggerAt = getTimestampForLocalMinutes({
    dateKey,
    minutes,
    timeZone,
  });

  if (triggerAt === null) {
    return Number.POSITIVE_INFINITY;
  }

  return triggerAt - suppressionWindowMs;
}

function getTimestampForLocalTime({
  dateKey,
  offsetMinutes = 0,
  timeValue,
  timeZone,
}: {
  dateKey: string;
  offsetMinutes?: number;
  timeValue: string;
  timeZone: string;
}) {
  const parsed = parseClockTime(timeValue);

  if (!parsed) {
    return null;
  }

  return getTimestampForLocalMinutes({
    dateKey,
    minutes: toMinutes(parsed) + offsetMinutes,
    timeZone,
  });
}

function getTimestampForLocalMinutes({
  dateKey,
  minutes,
  timeZone,
}: {
  dateKey: string;
  minutes: number;
  timeZone: string;
}) {
  const normalizedMinutes = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const timeValue = formatClockTime({
    hour: Math.floor(normalizedMinutes / 60),
    minute: normalizedMinutes % 60,
  });

  return parseTimestampFromLocalDateTime({
    dateKey,
    timeValue,
    timeZone,
  });
}

function isDayComplete(progress: ReminderSnapshot["progress"]) {
  return (
    progress.caloriesOnTarget &&
    progress.proteinOnTarget &&
    progress.carbsOnTarget &&
    progress.fatOnTarget &&
    progress.hydrationPercent >= 100 &&
    progress.nutritionPercent >= 100
  );
}

function toMinutes(time: ClockTime) {
  return time.hour * 60 + time.minute;
}
