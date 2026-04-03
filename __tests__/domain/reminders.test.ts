import {
  buildReminderSchedule,
  parseClockTime,
  ReminderSettings,
  ReminderSnapshot,
  validateReminderWindow,
} from "../../lib/domain/reminders";
import { parseTimestampFromLocalDateTime } from "../../lib/domain/dayWindow";

const dateKey = "2026-04-01";
const timeZone = "UTC";

function at(timeValue: string) {
  const timestamp = parseTimestampFromLocalDateTime({
    dateKey,
    timeValue,
    timeZone,
  });

  if (timestamp === null) {
    throw new Error(`Invalid timestamp input: ${timeValue}`);
  }

  return timestamp;
}

function buildSettings(overrides: Partial<ReminderSettings> = {}): ReminderSettings {
  return {
    notifyEndOfDay: false,
    notifyGoalCompletion: false,
    notifyHydration: false,
    notifyMealLogging: false,
    sleepTime: "20:00",
    wakeTime: "08:00",
    ...overrides,
  };
}

function buildSnapshot(overrides: Partial<ReminderSnapshot> = {}): ReminderSnapshot {
  return {
    biggestGapKey: "hydration",
    dateKey,
    lastHydrationTimestamp: null,
    lastMealTimestamp: null,
    mealCount: 0,
    progress: {
      caloriesPercent: 0,
      hydrationPercent: 0,
      nutritionPercent: 0,
      proteinPercent: 0,
    },
    timeZone,
    ...overrides,
  };
}

describe("reminder scheduling", () => {
  it("validates wake and sleep times with a 6-hour minimum window", () => {
    expect(validateReminderWindow({ wakeTime: "08:00", sleepTime: "20:00" })).toBeNull();
    expect(validateReminderWindow({ wakeTime: "20:00", sleepTime: "08:00" })).toContain(
      "Wake time must be earlier"
    );
    expect(validateReminderWindow({ wakeTime: "08:00", sleepTime: "13:00" })).toContain(
      "at least 6 hours"
    );
    expect(validateReminderWindow({ wakeTime: "bad", sleepTime: "13:00" })).toContain(
      "valid times"
    );
    expect(parseClockTime("07:30")).toEqual({ hour: 7, minute: 30 });
    expect(parseClockTime("25:00")).toBeNull();
  });

  it("generates hydration reminders at the adaptive checkpoints", () => {
    const schedule = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("07:30"),
      settings: buildSettings({ notifyHydration: true, sleepTime: "18:00" }),
      snapshot: buildSnapshot({
        progress: {
          caloriesPercent: 0,
          hydrationPercent: 10,
          nutritionPercent: 0,
          proteinPercent: 0,
        },
      }),
    });

    expect(
      schedule.notifications
        .filter((notification) => notification.kind === "hydration")
        .map((notification) => notification.triggerAt)
    ).toEqual([at("10:30"), at("13:00"), at("15:30"), at("17:00")]);
  });

  it("suppresses hydration reminders when the user drank recently before a checkpoint", () => {
    const schedule = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("07:30"),
      settings: buildSettings({ notifyHydration: true, sleepTime: "18:00" }),
      snapshot: buildSnapshot({
        lastHydrationTimestamp: at("09:15"),
        progress: {
          caloriesPercent: 0,
          hydrationPercent: 20,
          nutritionPercent: 0,
          proteinPercent: 0,
        },
      }),
    });

    expect(
      schedule.notifications
        .filter((notification) => notification.kind === "hydration")
        .map((notification) => notification.triggerAt)
    ).toEqual([at("13:00"), at("15:30"), at("17:00")]);
  });

  it("suppresses meal reminders based on meal count and recent logging windows", () => {
    const schedule = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("07:00"),
      settings: buildSettings({ notifyMealLogging: true }),
      snapshot: buildSnapshot({
        lastMealTimestamp: at("08:30"),
        mealCount: 1,
      }),
    });

    expect(
      schedule.notifications
        .filter((notification) => notification.kind === "meal_logging")
        .map((notification) => notification.triggerAt)
    ).toEqual([at("14:00"), at("17:00")]);

    const suppressedSchedule = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("07:00"),
      settings: buildSettings({ notifyMealLogging: true }),
      snapshot: buildSnapshot({
        lastMealTimestamp: at("12:30"),
        mealCount: 2,
      }),
    });

    expect(
      suppressedSchedule.notifications.filter((notification) => notification.kind === "meal_logging")
    ).toHaveLength(0);
  });

  it("fires goal completion once per day when core goals are met", () => {
    const schedule = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("12:00"),
      settings: buildSettings({ notifyGoalCompletion: true }),
      snapshot: buildSnapshot({
        progress: {
          caloriesPercent: 100,
          hydrationPercent: 100,
          nutritionPercent: 40,
          proteinPercent: 100,
        },
      }),
    });

    expect(schedule.notifications.filter((notification) => notification.kind === "goal_completion")).toEqual([
      expect.objectContaining({
        triggerAt: null,
      }),
    ]);
    expect(schedule.persistDates.goalCompletion).toBe(dateKey);

    const alreadySent = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: dateKey,
      now: at("12:00"),
      settings: buildSettings({ notifyGoalCompletion: true }),
      snapshot: buildSnapshot({
        progress: {
          caloriesPercent: 100,
          hydrationPercent: 100,
          nutritionPercent: 40,
          proteinPercent: 100,
        },
      }),
    });

    expect(
      alreadySent.notifications.filter((notification) => notification.kind === "goal_completion")
    ).toHaveLength(0);
    expect(alreadySent.persistDates.goalCompletion).toBeNull();
  });

  it("schedules or skips the end-of-day reminder based on progress and trigger time", () => {
    const futureReminder = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("18:00"),
      settings: buildSettings({ notifyEndOfDay: true, sleepTime: "20:00" }),
      snapshot: buildSnapshot({
        biggestGapKey: "protein",
        progress: {
          caloriesPercent: 80,
          hydrationPercent: 60,
          nutritionPercent: 30,
          proteinPercent: 55,
        },
      }),
    });

    expect(futureReminder.notifications.filter((notification) => notification.kind === "end_of_day")).toEqual([
      expect.objectContaining({
        triggerAt: at("19:15"),
      }),
    ]);
    expect(futureReminder.persistDates.endOfDay).toBeNull();

    const immediateReminder = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("19:30"),
      settings: buildSettings({ notifyEndOfDay: true, sleepTime: "20:00" }),
      snapshot: buildSnapshot({
        biggestGapKey: "protein",
        progress: {
          caloriesPercent: 80,
          hydrationPercent: 60,
          nutritionPercent: 30,
          proteinPercent: 55,
        },
      }),
    });

    expect(
      immediateReminder.notifications.filter((notification) => notification.kind === "end_of_day")
    ).toEqual([
      expect.objectContaining({
        triggerAt: null,
      }),
    ]);
    expect(immediateReminder.persistDates.endOfDay).toBe(dateKey);

    const completedDay = buildReminderSchedule({
      lastEndOfDayReminderDate: null,
      lastGoalCompletionReminderDate: null,
      now: at("18:00"),
      settings: buildSettings({ notifyEndOfDay: true, sleepTime: "20:00" }),
      snapshot: buildSnapshot({
        progress: {
          caloriesPercent: 100,
          hydrationPercent: 100,
          nutritionPercent: 100,
          proteinPercent: 100,
        },
      }),
    });

    expect(completedDay.notifications.filter((notification) => notification.kind === "end_of_day")).toHaveLength(0);
  });
});
