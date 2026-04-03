type TimeZoneDateParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

export type WeekStartsOn = 0 | 1;

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });
}

function getTimeZoneDateParts(timestamp: number, timeZone: string): TimeZoneDateParts {
  const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;

  return {
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    month: lookup.month,
    second: lookup.second,
    year: lookup.year,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function addUtcDays(
  { year, month, day }: Pick<TimeZoneDateParts, "year" | "month" | "day">,
  delta: number
) {
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + delta);

  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

function getTimeZoneOffsetMs(timestamp: number, timeZone: string) {
  const parts = getTimeZoneDateParts(timestamp, timeZone);
  const utcEquivalent = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcEquivalent - timestamp;
}

function getStartOfLocalDay(
  year: number,
  month: number,
  day: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  let offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let start = utcGuess - offset;
  const adjustedOffset = getTimeZoneOffsetMs(start, timeZone);

  if (adjustedOffset !== offset) {
    offset = adjustedOffset;
    start = utcGuess - offset;
  }

  return start;
}

function getTimestampForLocalDateTime(
  {
    day,
    hour,
    minute,
    month,
    second,
    year,
  }: Pick<TimeZoneDateParts, "year" | "month" | "day" | "hour" | "minute" | "second">,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  let offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let timestamp = utcGuess - offset;
  const adjustedOffset = getTimeZoneOffsetMs(timestamp, timeZone);

  if (adjustedOffset !== offset) {
    offset = adjustedOffset;
    timestamp = utcGuess - offset;
  }

  return timestamp;
}

function formatDateKey({ day, month, year }: Pick<TimeZoneDateParts, "year" | "month" | "day">) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getWeekdayForLocalDate({
  year,
  month,
  day,
}: Pick<TimeZoneDateParts, "year" | "month" | "day">) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getLocalDateKey(timestamp: number, timeZone: string) {
  const { day, month, year } = getTimeZoneDateParts(timestamp, timeZone);
  return formatDateKey({ day, month, year });
}

export function getDayWindowForTimestamp(timestamp: number, timeZone: string) {
  const current = getTimeZoneDateParts(timestamp, timeZone);
  const next = addUtcDays(current, 1);
  const start = getStartOfLocalDay(current.year, current.month, current.day, timeZone);
  const end = getStartOfLocalDay(next.year, next.month, next.day, timeZone);

  return { end, start };
}

export function getDayWindowForDateKey({
  dateKey,
  timeZone,
}: {
  dateKey: string;
  timeZone: string;
}) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = addUtcDays({ day, month, year }, 1);

  return {
    end: getStartOfLocalDay(next.year, next.month, next.day, timeZone),
    start: getStartOfLocalDay(year, month, day, timeZone),
  };
}

export function getLocalDateInputValue(timestamp: number, timeZone: string) {
  return getLocalDateKey(timestamp, timeZone);
}

export function getLocalTimeInputValue(timestamp: number, timeZone: string) {
  const parts = getTimeZoneDateParts(timestamp, timeZone);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function parseTimestampFromLocalDateTime({
  dateKey,
  timeValue,
  timeZone,
}: {
  dateKey: string;
  timeValue: string;
  timeZone: string;
}) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return getTimestampForLocalDateTime(
    {
      day,
      hour,
      minute,
      month,
      second: 0,
      year,
    },
    timeZone
  );
}

export function getWeekWindowForOffset({
  timeZone,
  timestamp,
  weekOffset,
  weekStartsOn,
}: {
  timeZone: string;
  timestamp: number;
  weekOffset: number;
  weekStartsOn: WeekStartsOn;
}) {
  const current = getTimeZoneDateParts(timestamp, timeZone);
  const weekday = getWeekdayForLocalDate(current);
  const daysSinceWeekStart = (weekday - weekStartsOn + 7) % 7;
  const startParts = addUtcDays(current, -(daysSinceWeekStart + weekOffset * 7));
  const endParts = addUtcDays(startParts, 7);

  return {
    end: getStartOfLocalDay(endParts.year, endParts.month, endParts.day, timeZone),
    endDateKey: formatDateKey(endParts),
    start: getStartOfLocalDay(startParts.year, startParts.month, startParts.day, timeZone),
    startDateKey: formatDateKey(startParts),
  };
}

export function getWeekDateKeysForOffset({
  timeZone,
  timestamp,
  weekOffset,
  weekStartsOn,
}: {
  timeZone: string;
  timestamp: number;
  weekOffset: number;
  weekStartsOn: WeekStartsOn;
}) {
  const { startDateKey } = getWeekWindowForOffset({
    timeZone,
    timestamp,
    weekOffset,
    weekStartsOn,
  });
  const [year, month, day] = startDateKey.split("-").map(Number);

  return Array.from({ length: 7 }, (_, index) =>
    formatDateKey(addUtcDays({ day, month, year }, index))
  );
}

export function getDayWindowForOffset({
  dayOffset,
  timeZone,
  timestamp,
}: {
  dayOffset: number;
  timeZone: string;
  timestamp: number;
}) {
  const current = getTimeZoneDateParts(timestamp, timeZone);
  const startParts = addUtcDays(current, -dayOffset);
  const endParts = addUtcDays(startParts, 1);

  return {
    end: getStartOfLocalDay(endParts.year, endParts.month, endParts.day, timeZone),
    endDateKey: formatDateKey(endParts),
    start: getStartOfLocalDay(startParts.year, startParts.month, startParts.day, timeZone),
    startDateKey: formatDateKey(startParts),
  };
}

export function getTrailingDateKeys({
  count,
  timeZone,
  timestamp,
}: {
  count: number;
  timeZone: string;
  timestamp: number;
}) {
  const current = getTimeZoneDateParts(timestamp, timeZone);

  return Array.from({ length: count }, (_, index) =>
    formatDateKey(addUtcDays(current, -index))
  );
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
