import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, Tokens } from '@/shared/model';
import { useTogglEntries } from '@/shared/hooks';
import { filterEntriesWithYouTrackId, sortEntriesByDate, groupEntriesByIssueWithOriginalIds, GroupedTimeEntry } from '@/shared/lib';

interface UseTimeEntriesProps {
  tokens: Tokens;
  selectedDate: string;
  groupTracks: boolean;
}

export const useTimeEntries = (tokens: Tokens, selectedDate: string, groupTracks: boolean = true) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<GroupedTimeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { data: rawEntries = [], isLoading, error: queryError, refetch } = useTogglEntries(tokens, selectedDate);

  const loadTimeEntries = useCallback(async () => {
    setLoading(true);
    try {
      await refetch();
    } catch (err: any) {
      setError(`Ошибка загрузки трекингов: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (Array.isArray(rawEntries) && rawEntries.length > 0) {
      const filteredEntries = filterEntriesWithYouTrackId(rawEntries);

      console.log('useTimeEntries: groupTracks =', groupTracks, 'filteredEntries count =', filteredEntries.length);

      if (groupTracks) {
        // Группируем трекинги по issue ID
        const grouped = groupEntriesByIssueWithOriginalIds(filteredEntries);
        const sortedEntries = sortEntriesByDate(grouped);
        console.log('useTimeEntries: grouped entries count =', sortedEntries.length);
        setTimeEntries(sortedEntries);
        setGroupedEntries(grouped);
      } else {
        // Показываем все трекинги без группировки
        const sortedEntries = sortEntriesByDate(filteredEntries);
        console.log('useTimeEntries: ungrouped entries count =', sortedEntries.length);
        setTimeEntries(sortedEntries);
        setGroupedEntries([]);
      }
      setError('');
    }
  }, [rawEntries, groupTracks]);

  useEffect(() => {
    if (queryError) {
      setError(`Ошибка загрузки трекингов: ${queryError.message}`);
    }
  }, [queryError]);

  return {
    timeEntries,
    groupedEntries,
    loading: loading || isLoading,
    error,
    loadTimeEntries
  };
};
