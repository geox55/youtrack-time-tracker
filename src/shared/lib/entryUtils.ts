import { TimeEntry, WorkItem } from '../model/types';

export const filterEntriesWithYouTrackId = (entries: TimeEntry[]): TimeEntry[] => {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.filter(entry =>
    entry.description && entry.description.match(/^(?:#?)([A-Z]+-\d+)/)
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

export const groupEntriesByIssueWithOriginalIds = (entries: TimeEntry[]): TimeEntry[] => {
  const groupedMap = new Map<string, TimeEntry[]>();

  // Группируем трекинги по issue ID + полное описание + дате
  entries.forEach(entry => {
    const issueId = extractIssueId(entry.description);
    const entryDate = entry.start.split('T')[0];
    const description = extractDescription(entry.description);
    const groupKey = `${issueId}-${description}-${entryDate}`; // Ключ: issueId-описание-дата

    if (issueId) {
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, []);
      }
      groupedMap.get(groupKey)!.push(entry);
    }
  });

  // Объединяем трекинги в один для каждой задачи в рамках одного дня
  const groupedEntries: TimeEntry[] = [];

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
    const groupedEntry: TimeEntry = {
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

  const match = description?.match(/(?:#?)([A-Z]+-\d+)/);
  const issueId = match ? match[1] : null;


  return issueId;
};

export const extractDescription = (description: string): string => {

  const match = description?.match(/(?:#?)([A-Z]+-\d+)\s*:?\s*(.+)/);
  const extractedDescription = match ? match[2].trim() : description?.replace(/^(?:#?)([A-Z]+-\d+)\s*:?\s*/, '').trim() || 'Без описания';


  return extractedDescription;
};

/**
 * Генерирует ключ группировки для TimeEntry
 * @param entry - трекинг времени
 * @param isGrouped - режим группировки
 * @returns ключ группировки: для группированного режима `${description}-${date}`, для несгруппированного `${description}-${entryId}-${date}`
 */
export const getGroupKeyForEntry = (entry: TimeEntry, isGrouped: boolean): string => {
  const entryDate = entry.start.split('T')[0];
  const entryDescription = extractDescription(entry.description);

  if (isGrouped) {
    return `${entryDescription}-${entryDate}`;
  } else {
    return `${entryDescription}-${entry.id}-${entryDate}`;
  }
};

/**
 * Генерирует ключ группировки для WorkItem
 * @param item - элемент работы из YouTrack
 * @param isGrouped - режим группировки
 * @param togglId - опциональный Toggl ID для несгруппированного режима
 * @returns ключ группировки: для группированного режима `${text}-${date}`, для несгруппированного `${text}-${togglId || item.date}-${date}`
 */
export const getGroupKeyForWorkItem = (item: WorkItem, isGrouped: boolean, togglId?: number): string => {
  const itemDate = new Date(item.date);
  const dateKey = itemDate.toISOString().split('T')[0];

  if (isGrouped) {
    return `${item.text}-${dateKey}`;
  } else {
    // В несгруппированном режиме используем Toggl ID если доступен, иначе fallback на дату
    const uniqueId = togglId || item.date;
    return `${item.text}-${uniqueId}-${dateKey}`;
  }
};

export const isEntryTransferred = (entry: TimeEntry, workItemsMap: Record<string, Record<string, WorkItem[]>>, currentUserId?: string, isGrouped: boolean = true): boolean => {
  const issueId = extractIssueId(entry.description);
  if (!issueId) return false;

  const entryDurationMinutes = Math.round(entry.duration / 60);
  const entryDescription = extractDescription(entry.description);

  // Получаем WorkItems для этой задачи
  const issueWorkItems = workItemsMap[issueId] || {};

  // Генерируем ключ для трекинга
  const entryGroupKey = getGroupKeyForEntry(entry, isGrouped);
  const matchingGroup = issueWorkItems[entryGroupKey] || [];

  // Фильтруем по пользователю, если указан currentUserId
  let relevantItems = matchingGroup;
  if (currentUserId) {
    relevantItems = matchingGroup.filter(item =>
      item.author?.id === currentUserId
    );
  }

  if (isGrouped) {
    // Группированный режим: проверяем совпадение длительности (сумма группы)
    const totalDuration = relevantItems.reduce((sum, item) =>
      sum + (item.duration?.minutes || 0), 0
    );

    const isSameDuration = Math.abs(totalDuration - entryDurationMinutes) <= 2;

    return relevantItems.length > 0 && isSameDuration;
  } else {
    // Несгруппированный режим: если точный ключ не найден, используем fallback
    if (relevantItems.length === 0) {
      // Fallback: ищем все группы с совпадающей датой
      const entryDate = entry.start.split('T')[0];
      let matchingItems: WorkItem[] = [];

      Object.keys(issueWorkItems).forEach(groupKey => {
        // Проверяем, что дата совпадает
        if (groupKey.endsWith(`-${entryDate}`)) {
          matchingItems.push(...issueWorkItems[groupKey]);
        }
      });

      // Фильтруем по пользователю
      if (currentUserId) {
        matchingItems = matchingItems.filter(item =>
          item.author?.id === currentUserId
        );
      }

      // Проверяем, есть ли WorkItem с точным совпадением описания и длительности
      const exactMatch = matchingItems.find(item => {
        const itemDuration = item.duration?.minutes || 0;
        const isSameDescription = item.text === entryDescription;
        const isSameDuration = Math.abs(itemDuration - entryDurationMinutes) <= 2;

        return isSameDescription && isSameDuration;
      });

      return !!exactMatch;
    }

    // Если точный ключ найден, проверяем совпадение длительности
    const exactMatch = relevantItems.find(item => {
      const itemDuration = item.duration?.minutes || 0;
      const isSameDuration = Math.abs(itemDuration - entryDurationMinutes) <= 2;
      return isSameDuration;
    });

    return !!exactMatch;
  }
};
