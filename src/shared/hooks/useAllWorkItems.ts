import { useState, useEffect, useMemo } from 'react';
import { TimeEntry, WorkItem } from '@/shared/model';
import { useYouTrackPagination } from './useYouTrackPagination';
import { extractIssueId } from '@/shared/lib';

export const useAllWorkItems = (tokens: any, timeEntries: TimeEntry[], selectedDate: string, refreshKey?: number) => {
  const [workItemsMap, setWorkItemsMap] = useState<Record<string, Record<string, WorkItem[]>>>({});
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
        const map: Record<string, Record<string, WorkItem[]>> = {};

        for (const issueId of issueIds) {
          try {
            const workItems = await pagination.searchWorkItems(tokens.youtrackToken, issueId, selectedDate);

            // Группируем WorkItems по text + date
            const groupedWorkItems: Record<string, WorkItem[]> = {};
            workItems.forEach(item => {
              const itemDate = new Date(item.date);
              const dateKey = itemDate.toISOString().split('T')[0];
              const groupKey = `${item.text}-${dateKey}`;

              if (!groupedWorkItems[groupKey]) {
                groupedWorkItems[groupKey] = [];
              }
              groupedWorkItems[groupKey].push(item);
            });

            map[issueId] = groupedWorkItems;
          } catch (err: any) {
            map[issueId] = {};
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
