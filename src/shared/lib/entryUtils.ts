import { TimeEntry, WorkItem } from '../model/types';

export const filterEntriesWithYouTrackId = (entries: TimeEntry[]): TimeEntry[] => {
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
  const trackingDescription = extractDescription(entry.description);
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

    const isSameDescription = item.text && trackingDescription &&
      (item.text.toLowerCase().includes(trackingDescription.toLowerCase()) ||
        trackingDescription.toLowerCase().includes(item.text.toLowerCase()));

    const isSameDuration = Math.abs((item.duration?.minutes || 0) - entryDurationMinutes) <= 2;

    return isSameDate && isSameDescription && isSameDuration;
  });
};
