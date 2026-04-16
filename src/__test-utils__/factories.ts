import { TimeEntry, WorkItem, Tokens } from '../shared/model/types';

let idCounter = 1;

export function buildTimeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  const id = overrides.id ?? idCounter++;
  return {
    id,
    description: `DEV-${id}: Some task`,
    start: '2025-01-06T09:00:00.000Z',
    stop: '2025-01-06T10:00:00.000Z',
    duration: 3600,
    ...overrides,
  };
}

export function buildWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    date: new Date('2025-01-06').getTime(),
    duration: { minutes: 60 },
    text: 'Some task',
    author: { id: 'user-1', login: 'testuser', name: 'Test User' },
    ...overrides,
  };
}

export function buildTokens(overrides: Partial<Tokens> = {}): Tokens {
  return {
    togglToken: 'test-toggl-token',
    youtrackToken: 'test-youtrack-token',
    ...overrides,
  };
}

export function resetIdCounter(): void {
  idCounter = 1;
}
