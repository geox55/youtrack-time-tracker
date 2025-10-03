import { TimeEntry, WorkItem } from '../model/types';

export const filterEntriesWithYouTrackId = (entries: TimeEntry[]): TimeEntry[] => {
  if (!Array.isArray(entries)) {
    console.warn('filterEntriesWithYouTrackId: entries is not an array', entries);
    return [];
  }
  return entries.filter(entry =>
    entry.description && entry.description.match(/^[A-Z]+-\d+\s*:/)
  );
};

export const sortEntriesByDate = (entries: TimeEntry[]): TimeEntry[] => {
  return entries.sort((a, b) =>
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );
};

export const groupEntriesByDate = (entries: TimeEntry[]): Record<string, TimeEntry[]> => {
  return entries.reduce((groups: Record<string, TimeEntry[]>, entry: TimeEntry) => {
    const date = entry.start.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});
};

export const groupEntriesByIssue = (entries: TimeEntry[]): TimeEntry[] => {
  const groupedMap = new Map<string, TimeEntry[]>();

  entries.forEach(entry => {
    const issueId = extractIssueId(entry.description);
    const entryDate = entry.start.split('T')[0];
    const groupKey = `${issueId}-${entryDate}`;

    if (issueId) {
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, []);
      }
      groupedMap.get(groupKey)!.push(entry);
    }
  });

  const groupedEntries: TimeEntry[] = [];

  groupedMap.forEach((issueEntries) => {
    if (issueEntries.length === 0) return;

    issueEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const firstEntry = issueEntries[0];

    const totalDuration = issueEntries.reduce((sum, entry) => sum + entry.duration, 0);

    const startTimes = issueEntries.map(entry => new Date(entry.start).getTime());
    const stopTimes = issueEntries
      .map(entry => entry.stop ? new Date(entry.stop).getTime() : new Date(entry.start).getTime() + entry.duration * 1000)
      .filter(time => !isNaN(time));

    const earliestStart = new Date(Math.min(...startTimes));
    const latestStop = stopTimes.length > 0 ? new Date(Math.max(...stopTimes)) : null;

    const groupedEntry: TimeEntry = {
      id: firstEntry.id,
      description: firstEntry.description,
      start: earliestStart.toISOString(),
      stop: latestStop ? latestStop.toISOString() : null,
      duration: totalDuration
    };

    groupedEntries.push(groupedEntry);
  });

  return groupedEntries;
};

// Расширенный тип для группированных трекингов с информацией об оригинальных ID
export interface GroupedTimeEntry extends TimeEntry {
  originalIds: number[];
}

export const groupEntriesByIssueWithOriginalIds = (entries: TimeEntry[]): GroupedTimeEntry[] => {
  const groupedMap = new Map<string, TimeEntry[]>();

  // Группируем трекинги по issue ID + дате
  entries.forEach(entry => {
    const issueId = extractIssueId(entry.description);
    const entryDate = entry.start.split('T')[0];
    const groupKey = `${issueId}-${entryDate}`; // Ключ: issueId-дата

    if (issueId) {
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, []);
      }
      groupedMap.get(groupKey)!.push(entry);
    }
  });

  // Объединяем трекинги в один для каждой задачи в рамках одного дня
  const groupedEntries: GroupedTimeEntry[] = [];

  groupedMap.forEach((issueEntries) => {
    if (issueEntries.length === 0) return;

    // Сортируем по времени начала
    issueEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Берем первый трекинг как основу
    const firstEntry = issueEntries[0];

    // Суммируем общую продолжительность
    const totalDuration = issueEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Находим самое раннее время начала и самое позднее время окончания
    const startTimes = issueEntries.map(entry => new Date(entry.start).getTime());
    const stopTimes = issueEntries
      .map(entry => entry.stop ? new Date(entry.stop).getTime() : new Date(entry.start).getTime() + entry.duration * 1000)
      .filter(time => !isNaN(time));

    const earliestStart = new Date(Math.min(...startTimes));
    const latestStop = stopTimes.length > 0 ? new Date(Math.max(...stopTimes)) : null;

    // Создаем объединенный трекинг с информацией об оригинальных ID
    const groupedEntry: GroupedTimeEntry = {
      id: firstEntry.id, // Используем ID первого трекинга
      description: firstEntry.description, // Берем описание из первого трекинга
      start: earliestStart.toISOString(),
      stop: latestStop ? latestStop.toISOString() : null,
      duration: totalDuration,
      originalIds: issueEntries.map(entry => entry.id) // Сохраняем все оригинальные ID
    };

    groupedEntries.push(groupedEntry);
  });

  return groupedEntries;
};

export const extractIssueId = (description: string): string | null => {
  const match = description?.match(/^([A-Z]+-\d+)/);
  return match ? match[1] : null;
};

export const extractDescription = (description: string): string => {
  const match = description?.match(/^[A-Z]+-\d+\s*:\s*(.+)/);
  return match ? match[1].trim() : description?.replace(/^[A-Z]+-\d+\s*:\s*/, '').trim() || 'Без описания';
};

export const isEntryTransferred = (entry: TimeEntry, workItems: WorkItem[], currentUserId?: string): boolean => {
  const issueId = extractIssueId(entry.description);
  if (!issueId) return false;

  const entryDate = entry.start.split('T')[0];
  const entryDurationMinutes = Math.round(entry.duration / 60);

  const entryDateObj = new Date(entryDate);

  // Фильтруем WorkItems по пользователю, если указан currentUserId
  let relevantItems = workItems.filter(item => {
    const itemDate = new Date(item.date);
    const dateDiff = Math.abs(itemDate.getTime() - entryDateObj.getTime());
    return dateDiff <= 7 * 24 * 60 * 60 * 1000;
  });

  // Если указан currentUserId, фильтруем только WorkItems текущего пользователя
  if (currentUserId) {
    relevantItems = relevantItems.filter(item =>
      item.author?.id === currentUserId
    );
  }

  return relevantItems.some(item => {
    const itemDate = new Date(item.date);

    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const entryDateOnly = new Date(entryDateObj.getFullYear(), entryDateObj.getMonth(), entryDateObj.getDate());
    const isSameDate = itemDateOnly.getTime() === entryDateOnly.getTime();

    const isSameDuration = Math.abs((item.duration?.minutes || 0) - entryDurationMinutes) <= 2;

    return isSameDate && isSameDuration;
  });
};
