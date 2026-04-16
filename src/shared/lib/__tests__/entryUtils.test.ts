// @vitest-environment jsdom
import {
  filterEntriesWithYouTrackId,
  sortEntriesByDate,
  groupEntriesByDate,
  groupEntriesByIssue,
  groupEntriesByIssueWithOriginalIds,
  extractIssueId,
  extractDescription,
  getGroupKeyForEntry,
  getGroupKeyForWorkItem,
  isEntryTransferred,
} from '../entryUtils';
import { buildTimeEntry, buildWorkItem } from '../../../__test-utils__/factories';

const STORAGE_KEY = 'time-tracker-settings';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ timezone: 'UTC' }));
});

describe('extractIssueId', () => {
  it('extracts issue id from plain description', () => {
    expect(extractIssueId('DEV-123 some task')).toBe('DEV-123');
  });

  it('extracts issue id with hash prefix', () => {
    expect(extractIssueId('#DEV-456 some task')).toBe('DEV-456');
  });

  it('extracts issue id followed by colon', () => {
    expect(extractIssueId('DEV-789: description')).toBe('DEV-789');
  });

  it('returns null when no match', () => {
    expect(extractIssueId('no issue here')).toBeNull();
  });

  it('returns null for undefined/null description', () => {
    expect(extractIssueId(undefined as unknown as string)).toBeNull();
    expect(extractIssueId(null as unknown as string)).toBeNull();
  });
});

describe('extractDescription', () => {
  it('extracts description after issue id with colon', () => {
    expect(extractDescription('DEV-123: Fix bug')).toBe('Fix bug');
  });

  it('extracts description after issue id without colon', () => {
    expect(extractDescription('DEV-123 Fix bug')).toBe('Fix bug');
  });

  it('extracts description with hash prefix', () => {
    expect(extractDescription('#DEV-123: Fix bug')).toBe('Fix bug');
  });

  it('returns "Без описания" for description without match', () => {
    expect(extractDescription(undefined as unknown as string)).toBe('Без описания');
  });
});

describe('filterEntriesWithYouTrackId', () => {
  it('filters entries that have YouTrack issue id', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task' }),
      buildTimeEntry({ description: 'no issue' }),
      buildTimeEntry({ description: '#DEV-2: another task' }),
    ];
    const result = filterEntriesWithYouTrackId(entries);
    expect(result).toHaveLength(2);
  });

  it('returns empty for non-array input', () => {
    expect(filterEntriesWithYouTrackId(null as any)).toEqual([]);
    expect(filterEntriesWithYouTrackId(undefined as any)).toEqual([]);
  });

  it('filters out entries with empty description', () => {
    const entries = [buildTimeEntry({ description: '' })];
    expect(filterEntriesWithYouTrackId(entries)).toHaveLength(0);
  });
});

describe('sortEntriesByDate', () => {
  it('sorts entries by start date descending', () => {
    const entries = [
      buildTimeEntry({ start: '2025-01-06T09:00:00Z' }),
      buildTimeEntry({ start: '2025-01-07T09:00:00Z' }),
      buildTimeEntry({ start: '2025-01-05T09:00:00Z' }),
    ];
    const sorted = sortEntriesByDate(entries);
    expect(new Date(sorted[0].start).getTime()).toBeGreaterThan(new Date(sorted[1].start).getTime());
    expect(new Date(sorted[1].start).getTime()).toBeGreaterThan(new Date(sorted[2].start).getTime());
  });
});

describe('groupEntriesByDate', () => {
  it('groups entries by their local date key', () => {
    const entries = [
      buildTimeEntry({ start: '2025-01-06T09:00:00Z' }),
      buildTimeEntry({ start: '2025-01-06T15:00:00Z' }),
      buildTimeEntry({ start: '2025-01-07T09:00:00Z' }),
    ];
    const grouped = groupEntriesByDate(entries);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['2025-01-06']).toHaveLength(2);
    expect(grouped['2025-01-07']).toHaveLength(1);
  });
});

describe('groupEntriesByIssue', () => {
  it('groups entries with same issue and date', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T09:00:00Z', duration: 1800 }),
      buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T10:00:00Z', duration: 1800 }),
    ];
    const result = groupEntriesByIssue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].duration).toBe(3600);
  });

  it('keeps separate groups for different issues', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task A', start: '2025-01-06T09:00:00Z' }),
      buildTimeEntry({ description: 'DEV-2: task B', start: '2025-01-06T10:00:00Z' }),
    ];
    const result = groupEntriesByIssue(entries);
    expect(result).toHaveLength(2);
  });

  it('skips entries without issue id', () => {
    const entries = [
      buildTimeEntry({ description: 'no issue' }),
    ];
    const result = groupEntriesByIssue(entries);
    expect(result).toHaveLength(0);
  });

  it('uses start+duration as stop fallback when stop is null', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T09:00:00Z', stop: null, duration: 3600 }),
    ];
    const result = groupEntriesByIssue(entries);
    expect(result).toHaveLength(1);
    expect(result[0].stop).toBeTruthy();
  });
});

describe('groupEntriesByIssueWithOriginalIds', () => {
  it('preserves original ids in grouped entry', () => {
    const entries = [
      buildTimeEntry({ id: 100, description: 'DEV-1: task', start: '2025-01-06T09:00:00Z', duration: 1800 }),
      buildTimeEntry({ id: 101, description: 'DEV-1: task', start: '2025-01-06T10:00:00Z', duration: 1800 }),
    ];
    const result = groupEntriesByIssueWithOriginalIds(entries);
    expect(result).toHaveLength(1);
    expect(result[0].originalIds).toEqual([100, 101]);
    expect(result[0].duration).toBe(3600);
  });

  it('groups by description + issue + date', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task A', start: '2025-01-06T09:00:00Z' }),
      buildTimeEntry({ description: 'DEV-1: task B', start: '2025-01-06T10:00:00Z' }),
    ];
    const result = groupEntriesByIssueWithOriginalIds(entries);
    expect(result).toHaveLength(2);
  });

  it('uses start+duration as stop fallback when stop is null', () => {
    const entries = [
      buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T09:00:00Z', stop: null, duration: 3600 }),
    ];
    const result = groupEntriesByIssueWithOriginalIds(entries);
    expect(result[0].stop).toBeTruthy();
    expect(result[0].originalIds).toHaveLength(1);
  });
});

describe('getGroupKeyForEntry', () => {
  it('returns description-date key when grouped', () => {
    const entry = buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T09:00:00Z' });
    const key = getGroupKeyForEntry(entry, true);
    expect(key).toBe('task-2025-01-06');
  });

  it('returns description-id-date key when not grouped', () => {
    const entry = buildTimeEntry({ id: 42, description: 'DEV-1: task', start: '2025-01-06T09:00:00Z' });
    const key = getGroupKeyForEntry(entry, false);
    expect(key).toBe('task-42-2025-01-06');
  });
});

describe('getGroupKeyForWorkItem', () => {
  it('returns text-date key when grouped', () => {
    const item = buildWorkItem({ text: 'task', date: new Date('2025-01-06').getTime() });
    const key = getGroupKeyForWorkItem(item, true);
    expect(key).toBe('task-2025-01-06');
  });

  it('returns text-togglId-date key when not grouped with togglId', () => {
    const item = buildWorkItem({ text: 'task', date: new Date('2025-01-06').getTime() });
    const key = getGroupKeyForWorkItem(item, false, 42);
    expect(key).toBe('task-42-2025-01-06');
  });

  it('falls back to item.date when no togglId in ungrouped mode', () => {
    const timestamp = new Date('2025-01-06').getTime();
    const item = buildWorkItem({ text: 'task', date: timestamp });
    const key = getGroupKeyForWorkItem(item, false);
    expect(key).toBe(`task-${timestamp}-2025-01-06`);
  });
});

describe('isEntryTransferred', () => {
  const userId = 'user-1';

  it('returns false when entry has no issue id', () => {
    const entry = buildTimeEntry({ description: 'no issue' });
    expect(isEntryTransferred(entry, {}, userId)).toBe(false);
  });

  it('returns true when grouped mode finds matching duration', () => {
    const entry = buildTimeEntry({
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const groupKey = getGroupKeyForEntry(entry, true);
    const workItemsMap = {
      'DEV-1': {
        [groupKey]: [buildWorkItem({ text: 'task', duration: { minutes: 60 }, author: { id: 'user-1', login: 'u', name: 'U' } })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, true)).toBe(true);
  });

  it('returns false when duration difference is too large in grouped mode', () => {
    const entry = buildTimeEntry({
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const groupKey = getGroupKeyForEntry(entry, true);
    const workItemsMap = {
      'DEV-1': {
        [groupKey]: [buildWorkItem({ text: 'task', duration: { minutes: 30 }, author: { id: 'user-1', login: 'u', name: 'U' } })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, true)).toBe(false);
  });

  it('returns false when no work items exist for issue', () => {
    const entry = buildTimeEntry({ description: 'DEV-1: task', start: '2025-01-06T09:00:00Z' });
    expect(isEntryTransferred(entry, {}, userId, true)).toBe(false);
  });

  it('filters by currentUserId', () => {
    const entry = buildTimeEntry({
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const groupKey = getGroupKeyForEntry(entry, true);
    const workItemsMap = {
      'DEV-1': {
        [groupKey]: [buildWorkItem({ text: 'task', duration: { minutes: 60 }, author: { id: 'other-user', login: 'o', name: 'O' } })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, true)).toBe(false);
  });

  it('works without currentUserId', () => {
    const entry = buildTimeEntry({
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const groupKey = getGroupKeyForEntry(entry, true);
    const workItemsMap = {
      'DEV-1': {
        [groupKey]: [buildWorkItem({ text: 'task', duration: { minutes: 60 } })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, undefined, true)).toBe(true);
  });

  it('ungrouped mode: finds exact key match', () => {
    const entry = buildTimeEntry({
      id: 42,
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const groupKey = getGroupKeyForEntry(entry, false);
    const workItemsMap = {
      'DEV-1': {
        [groupKey]: [buildWorkItem({ text: 'task', duration: { minutes: 60 }, author: { id: 'user-1', login: 'u', name: 'U' } })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, false)).toBe(true);
  });

  it('ungrouped mode: uses fallback by date when exact key not found', () => {
    const entry = buildTimeEntry({
      id: 42,
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const workItemsMap = {
      'DEV-1': {
        'task-99-2025-01-06': [buildWorkItem({
          text: 'task',
          duration: { minutes: 60 },
          author: { id: 'user-1', login: 'u', name: 'U' },
        })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, false)).toBe(true);
  });

  it('ungrouped mode: fallback returns false when description does not match', () => {
    const entry = buildTimeEntry({
      id: 42,
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const workItemsMap = {
      'DEV-1': {
        'different-99-2025-01-06': [buildWorkItem({
          text: 'different',
          duration: { minutes: 60 },
          author: { id: 'user-1', login: 'u', name: 'U' },
        })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, false)).toBe(false);
  });

  it('ungrouped mode: fallback filters by userId', () => {
    const entry = buildTimeEntry({
      id: 42,
      description: 'DEV-1: task',
      start: '2025-01-06T09:00:00Z',
      duration: 3600,
    });
    const workItemsMap = {
      'DEV-1': {
        'task-99-2025-01-06': [buildWorkItem({
          text: 'task',
          duration: { minutes: 60 },
          author: { id: 'other', login: 'o', name: 'O' },
        })],
      },
    };
    expect(isEntryTransferred(entry, workItemsMap, userId, false)).toBe(false);
  });
});
