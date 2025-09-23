import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, Tokens } from '@/shared/model';
import { useTogglEntries } from '@/shared/hooks';
import { filterEntriesWithYouTrackId, sortEntriesByDate, groupEntriesByIssueWithOriginalIds, GroupedTimeEntry } from '@/shared/lib';

export const useTimeEntries = (tokens: Tokens, selectedDate: string) => {
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
    if (rawEntries.length > 0) {
      const filteredEntries = filterEntriesWithYouTrackId(rawEntries);
      const grouped = groupEntriesByIssueWithOriginalIds(filteredEntries);
      const sortedEntries = sortEntriesByDate(grouped);
      setTimeEntries(sortedEntries);
      setGroupedEntries(grouped);
      setError('');
    }
  }, [rawEntries]);

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
