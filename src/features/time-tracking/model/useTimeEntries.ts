import { useState, useEffect, useMemo } from 'react';
import { TimeEntry, Tokens } from '@/shared/model';
import { useTogglEntries } from '@/shared/hooks';
import { filterEntriesWithYouTrackId, sortEntriesByDate, groupEntriesByIssueWithOriginalIds } from '@/shared/lib';

export const useTimeEntries = (tokens: Tokens, startOfWeek: Date, groupTracks: boolean = true) => {
  const [error, setError] = useState<string>('');

  const { data: rawEntries = [], isLoading, error: queryError } = useTogglEntries(tokens, startOfWeek);

  // Используем useMemo для автоматического пересчёта при изменении rawEntries или groupTracks
  const timeEntries = useMemo(() => {
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      return [] as TimeEntry[];
    }

    const filteredEntries = filterEntriesWithYouTrackId(rawEntries);

    console.log('useTimeEntries: groupTracks =', groupTracks, 'filteredEntries count =', filteredEntries.length);

    if (groupTracks) {
      // Группируем трекинги по issue ID
      const grouped = groupEntriesByIssueWithOriginalIds(filteredEntries);
      const sortedEntries = sortEntriesByDate(grouped);
      console.log('useTimeEntries: grouped entries count =', sortedEntries.length);
      return sortedEntries;
    } else {
      // Показываем все трекинги без группировки
      const sortedEntries = sortEntriesByDate(filteredEntries);
      console.log('useTimeEntries: ungrouped entries count =', sortedEntries.length);
      return sortedEntries;
    }
  }, [rawEntries, groupTracks]);

  useEffect(() => {
    if (queryError) {
      setError(`Ошибка загрузки трекингов: ${queryError.message}`);
    } else if (Array.isArray(rawEntries)) {
      setError('');
    }
  }, [queryError, rawEntries]);

  return {
    timeEntries,
    loading: isLoading,
    error
  };
};
