import { resolveUserTimezone } from './timezone';

const getConfiguredTimezone = (): string => {
  return resolveUserTimezone().timezone;
};

const dateKeyInZoneFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

/** Calendar date YYYY-MM-DD in the given IANA timezone for this UTC instant. */
const formatDateKeyInZone = (utcMs: number, timeZone: string): string => {
  return dateKeyInZoneFormatter(timeZone).format(new Date(utcMs));
};

const parseDateKey = (dateKey: string): { year: number; month: number; day: number } => {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }
  const [year, month, day] = parts;
  return { year, month, day };
};

const toUtcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const addDaysToDateKey = (dateKey: string, days: number): string => {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return toUtcDateKey(date);
};

const getDayOfWeekForDateKey = (dateKey: string): number => {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

/**
 * UTC ms at the start of the civil calendar day `dateKey` in `timeZone`.
 */
const utcMsAtStartOfZonedDay = (dateKey: string, timeZone: string): number => {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }
  const [year, month, day] = parts;

  let lo = Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0);
  let hi = Date.UTC(year, month - 1, day + 2, 0, 0, 0, 0);

  while (formatDateKeyInZone(lo, timeZone) >= dateKey) {
    lo -= 86400000;
  }
  while (formatDateKeyInZone(hi - 1, timeZone) < dateKey) {
    hi += 86400000;
  }

  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (formatDateKeyInZone(mid, timeZone) < dateKey) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (formatDateKeyInZone(hi, timeZone) !== dateKey) {
    throw new Error(`Could not resolve start of ${dateKey} in ${timeZone}`);
  }

  return hi;
};

const dateToLocalString = (date: Date): string => {
  const timeZone = getConfiguredTimezone();
  return dateKeyInZoneFormatter(timeZone).format(date);
};

/** Календарный день в настроенном часовом поясе (YYYY-MM-DD). */
export const toLocalDateKey = (input: string | Date): string => {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(input)}`);
  }
  return dateToLocalString(date);
};

export const dateToString = (date: Date): string => {
  return toLocalDateKey(date);
};

/**
 * Timestamp (мс) для полуночи указанного календарного дня в настроенном поясе.
 * dateKey — формат YYYY-MM-DD (как из toLocalDateKey).
 */
export const localDateKeyToLocalMidnightMs = (dateKey: string): number => {
  const timeZone = getConfiguredTimezone();
  return utcMsAtStartOfZonedDay(dateKey, timeZone);
};

/**
 * Timestamp (мс) для середины календарного дня в настроенном поясе.
 * Используется для внешних API, чтобы избежать N -> N-1 при UTC-интерпретации полуночи.
 */
export const localDateKeyToLocalNoonMs = (dateKey: string): number => {
  return localDateKeyToLocalMidnightMs(dateKey) + 12 * 60 * 60 * 1000;
};

export const createDateAtStartOfWeek = (dateString: string): Date => {
  const dayOfWeek = getDayOfWeekForDateKey(dateString);
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDateKey = addDaysToDateKey(dateString, daysToMonday);
  return new Date(localDateKeyToLocalMidnightMs(mondayDateKey));
};

export const getWeekRange = (selectedDate: Date): { startDate: string; endDate: string } => {
  const startDateKey = toLocalDateKey(selectedDate);
  const endDateKey = addDaysToDateKey(startDateKey, 7);
  const startUtcMs = localDateKeyToLocalMidnightMs(startDateKey);
  const endUtcMs = localDateKeyToLocalMidnightMs(endDateKey);
  const startDateUtc = new Date(startUtcMs);
  const endDateUtc = new Date(endUtcMs);

  const result = {
    startDate: toUtcDateKey(startDateUtc),
    endDate: toUtcDateKey(endDateUtc),
  };
  return result;
};

export const formatDateRange = (selectedDate: Date): string => {
  const timeZone = getConfiguredTimezone();
  const startDate = selectedDate;

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}ч ${minutes}мин`;
};

export const formatTime = (dateString: string): string => {
  const timeZone = getConfiguredTimezone();
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
};

export const formatDate = (dateString: string): string => {
  const timeZone = getConfiguredTimezone();
  return new Date(dateString).toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });
};

export const roundToNearest5Minutes = (minutes: number): number => {
  return Math.round(minutes / 5) * 5;
};
