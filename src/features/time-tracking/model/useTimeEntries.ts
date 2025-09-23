import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, Tokens } from '@/shared/model';
import { useTogglEntries } from '@/shared/hooks';
import { filterEntriesWithYouTrackId, sortEntriesByDate } from '@/shared/lib';

export const useTimeEntries = (tokens: Tokens, selectedDate: string) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
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
      const sortedEntries = sortEntriesByDate(filteredEntries);
      setTimeEntries(sortedEntries);
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
    loading: loading || isLoading,
    error,
    loadTimeEntries
  };
};
