const SETTINGS_STORAGE_KEY = 'time-tracker-settings';

const getConfiguredTimezone = (): string => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { timezone?: string };
      if (typeof parsed.timezone === 'string' && parsed.timezone.trim() !== '') {
        return parsed.timezone;
      }
    }
  } catch {
    // ignore invalid JSON / access errors
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
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

export const createDateAtStartOfWeek = (dateString: string): Date => {
  const baseDate = new Date(dateString);
  const startOfWeek = new Date(baseDate);
  const dayOfWeek = baseDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(baseDate.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

export const getWeekRange = (selectedDate: Date): { startDate: string; endDate: string } => {
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);
  endDate.setHours(0, 0, 0, 0);

  return {
    startDate: toLocalDateKey(startDate),
    endDate: toLocalDateKey(endDate),
  };
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
