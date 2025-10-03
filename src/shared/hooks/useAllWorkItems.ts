import { useState, useEffect, useMemo } from 'react';
import { TimeEntry, WorkItem } from '@/shared/model';
import { useYouTrackPagination } from './useYouTrackPagination';
import { extractIssueId } from '@/shared/lib';

export const useAllWorkItems = (tokens: any, timeEntries: TimeEntry[], selectedDate: string, refreshKey?: number) => {
  const [workItemsMap, setWorkItemsMap] = useState<Record<string, WorkItem[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const pagination = useYouTrackPagination();

  // Получаем уникальные issueId из timeEntries
  const issueIds = useMemo(() => {
    const ids = new Set<string>();
    timeEntries.forEach(entry => {
      const issueId = extractIssueId(entry.description);
      if (issueId) {
        ids.add(issueId);
      } else {
      }
    });
    const uniqueIds = Array.from(ids);
    return uniqueIds;
  }, [timeEntries]);

  useEffect(() => {
    if (!tokens.youtrackToken || issueIds.length === 0) {
      setWorkItemsMap({});
      return;
    }

    const fetchAllWorkItems = async () => {
      setLoading(true);
      setError('');


      try {
        const map: Record<string, WorkItem[]> = {};

        for (const issueId of issueIds) {
          try {
            const workItems = await pagination.searchWorkItems(tokens.youtrackToken, issueId, selectedDate);
            map[issueId] = workItems;
          } catch (err: any) {
            map[issueId] = [];
          }
        }

        setWorkItemsMap(map);
      } catch (err: any) {
        setError(`Ошибка загрузки work items: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWorkItems();
  }, [tokens.youtrackToken, issueIds, selectedDate, refreshKey]);

  return {
    workItemsMap,
    loading,
    error
  };
};
