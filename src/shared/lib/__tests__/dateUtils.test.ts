// @vitest-environment jsdom
import {
  toLocalDateKey,
  dateToString,
  localDateKeyToLocalMidnightMs,
  localDateKeyToLocalNoonMs,
  createDateAtStartOfWeek,
  getWeekRange,
  formatDateRange,
  formatDuration,
  formatTime,
  formatDate,
  roundToNearest5Minutes,
} from '../dateUtils';

const STORAGE_KEY = 'time-tracker-settings';

function setTimezone(tz: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ timezone: tz }));
}

beforeEach(() => {
  localStorage.clear();
  setTimezone('UTC');
});

describe('toLocalDateKey', () => {
  it('converts ISO string to YYYY-MM-DD in configured timezone', () => {
    expect(toLocalDateKey('2025-01-06T00:00:00.000Z')).toBe('2025-01-06');
  });

  it('converts Date object to YYYY-MM-DD', () => {
    expect(toLocalDateKey(new Date('2025-01-06T12:00:00Z'))).toBe('2025-01-06');
  });

  it('respects configured timezone', () => {
    setTimezone('Pacific/Auckland');
    expect(toLocalDateKey('2025-01-06T23:00:00.000Z')).toBe('2025-01-07');
  });

  it('throws on invalid date string', () => {
    expect(() => toLocalDateKey('not-a-date')).toThrow('Invalid date');
  });
});

describe('dateToString', () => {
  it('delegates to toLocalDateKey', () => {
    expect(dateToString(new Date('2025-03-15T12:00:00Z'))).toBe('2025-03-15');
  });
});

describe('localDateKeyToLocalMidnightMs', () => {
  it('returns UTC ms at start of day in configured timezone', () => {
    setTimezone('UTC');
    const ms = localDateKeyToLocalMidnightMs('2025-01-06');
    expect(new Date(ms).toISOString()).toBe('2025-01-06T00:00:00.000Z');
  });

  it('returns correct ms for non-UTC timezone', () => {
    setTimezone('Europe/Moscow');
    const ms = localDateKeyToLocalMidnightMs('2025-01-06');
    expect(new Date(ms).toISOString()).toBe('2025-01-05T21:00:00.000Z');
  });

  it('throws on invalid date key', () => {
    expect(() => localDateKeyToLocalMidnightMs('bad')).toThrow('Invalid local date key');
  });
});

describe('localDateKeyToLocalNoonMs', () => {
  it('keeps UTC calendar day equal to local date key for UTC+6 timezone', () => {
    setTimezone('Asia/Dhaka');
    const ms = localDateKeyToLocalNoonMs('2026-04-15');
    expect(new Date(ms).toISOString().slice(0, 10)).toBe('2026-04-15');
  });
});

describe('createDateAtStartOfWeek', () => {
  it('returns Monday for a Wednesday', () => {
    const result = createDateAtStartOfWeek('2025-01-08');
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it('returns Monday for a Sunday', () => {
    const result = createDateAtStartOfWeek('2025-01-12');
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it('returns Monday for a Monday', () => {
    const result = createDateAtStartOfWeek('2025-01-06');
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });
});

describe('getWeekRange', () => {
  it('returns 7-day range starting from selectedDate', () => {
    const date = new Date(2025, 0, 6);
    const range = getWeekRange(date);
    expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});

describe('formatDateRange', () => {
  it('returns formatted range string with 6-day span', () => {
    setTimezone('UTC');
    const date = new Date('2025-01-06T00:00:00.000Z');
    const result = formatDateRange(date);
    expect(result).toContain(' - ');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0ч 0мин');
  });

  it('formats full hours', () => {
    expect(formatDuration(7200)).toBe('2ч 0мин');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(5400)).toBe('1ч 30мин');
  });

  it('formats less than one hour', () => {
    expect(formatDuration(900)).toBe('0ч 15мин');
  });
});

describe('formatTime', () => {
  it('returns HH:MM in configured timezone', () => {
    setTimezone('UTC');
    const result = formatTime('2025-01-06T14:30:00.000Z');
    expect(result).toBe('14:30');
  });
});

describe('formatDate', () => {
  it('returns localized date string in ru-RU', () => {
    setTimezone('UTC');
    const result = formatDate('2025-01-06T00:00:00.000Z');
    expect(result).toMatch(/2025/);
  });
});

describe('roundToNearest5Minutes', () => {
  it('rounds down below midpoint', () => {
    expect(roundToNearest5Minutes(12)).toBe(10);
  });

  it('rounds up at midpoint', () => {
    expect(roundToNearest5Minutes(12.5)).toBe(15);
  });

  it('rounds up above midpoint', () => {
    expect(roundToNearest5Minutes(13)).toBe(15);
  });

  it('keeps multiples of 5 unchanged', () => {
    expect(roundToNearest5Minutes(30)).toBe(30);
  });

  it('handles zero', () => {
    expect(roundToNearest5Minutes(0)).toBe(0);
  });
});

describe('getConfiguredTimezone fallback', () => {
  it('falls back to browser timezone when localStorage is empty', () => {
    localStorage.clear();
    const result = toLocalDateKey(new Date('2025-01-06T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back when stored JSON is invalid', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    const result = toLocalDateKey(new Date('2025-01-06T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back when timezone is empty string', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timezone: '' }));
    const result = toLocalDateKey(new Date('2025-01-06T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back when timezone is whitespace only', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timezone: '   ' }));
    const result = toLocalDateKey(new Date('2025-01-06T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back when settings object has no timezone field', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ other: 'value' }));
    const result = toLocalDateKey(new Date('2025-01-06T12:00:00Z'));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('regression: timezone shift (red tests)', () => {
  it('maps UTC evening tracking to next local day for UTC+6 timezone', () => {
    setTimezone('Asia/Dhaka');

    const togglUtcStart = '2026-04-15T20:00:00.000Z';
    expect(toLocalDateKey(togglUtcStart)).toBe('2026-04-16');
  });

  it('generates Toggl week range aligned with UTC boundaries for local week', () => {
    setTimezone('Asia/Dhaka');

    const selectedDate = new Date('2026-04-13T00:00:00.000Z');
    const range = getWeekRange(selectedDate);

    expect(range).toEqual({
      startDate: '2026-04-12',
      endDate: '2026-04-19',
    });
  });
});
