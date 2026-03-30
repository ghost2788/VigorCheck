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
