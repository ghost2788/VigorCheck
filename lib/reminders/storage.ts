import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_GOAL_COMPLETION_DATE_KEY = "caltracker:lastGoalCompletionReminderDate";
const LAST_END_OF_DAY_DATE_KEY = "caltracker:lastEndOfDayReminderDate";

export async function getReminderOneShotState() {
  const [lastGoalCompletionReminderDate, lastEndOfDayReminderDate] = await Promise.all([
    AsyncStorage.getItem(LAST_GOAL_COMPLETION_DATE_KEY),
    AsyncStorage.getItem(LAST_END_OF_DAY_DATE_KEY),
  ]);

  return {
    lastEndOfDayReminderDate,
    lastGoalCompletionReminderDate,
  };
}

export async function setLastGoalCompletionReminderDate(dateKey: string) {
  await AsyncStorage.setItem(LAST_GOAL_COMPLETION_DATE_KEY, dateKey);
}

export async function setLastEndOfDayReminderDate(dateKey: string) {
  await AsyncStorage.setItem(LAST_END_OF_DAY_DATE_KEY, dateKey);
}
