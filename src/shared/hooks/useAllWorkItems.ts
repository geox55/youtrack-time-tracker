import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { TimeEntry, WorkItem } from '@/shared/model';
import { extractIssueId } from '@/shared/lib';
import { youtrackApi } from '@/shared/api';

const searchWorkItems = async (
  token: string,
  issueId: string,
  selectedDate: string
): Promise<WorkItem[]> => {
  const selectedDateObj = new Date(selectedDate);
  const startOfWeek = new Date(selectedDateObj);
  startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const allWorkItems: WorkItem[] = [];
  const pageSize = 100;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await youtrackApi.getWorkItems(token, issueId, skip, pageSize);

    if (!response || !Array.isArray(response) || response.length === 0) {
      break;
    }

    const relevantInPage = response.filter((item: WorkItem) => {
      const itemDate = new Date(item.date);
      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    });

    if (relevantInPage.length > 0) {
      allWorkItems.push(...relevantInPage);
      skip += pageSize;
    } else {
      hasMore = false;
    }
  }

  return allWorkItems;
};

export const useAllWorkItems = (tokens: any, timeEntries: TimeEntry[], selectedDate: string) => {
  const issueIds = useMemo(() => {
    const ids = new Set<string>();
    timeEntries.forEach(entry => {
      const issueId = extractIssueId(entry.description);
      if (issueId) {
        ids.add(issueId);
      }
    });
    return Array.from(ids);
  }, [timeEntries]);

  const queries = useQueries({
    queries: issueIds.map(issueId => ({
      queryKey: ['youtrack-work-items', issueId, selectedDate],
      queryFn: async () => {
        const workItems = await searchWorkItems(tokens.youtrackToken, issueId, selectedDate);

        const grouped: Record<string, WorkItem[]> = {};
        workItems.forEach(item => {
          const itemDate = new Date(item.date);
          const dateKey = itemDate.toISOString().split('T')[0];
          const groupKey = `${item.text}-${dateKey}`;
          if (!grouped[groupKey]) grouped[groupKey] = [];
          grouped[groupKey].push(item);
        });

        return { issueId, data: grouped };
      },
      enabled: !!tokens.youtrackToken && !!issueId,
    }))
  });

  const workItemsMap = useMemo(() => {
    const map: Record<string, Record<string, WorkItem[]>> = {};
    queries.forEach(query => {
      if (query.data) {
        map[query.data.issueId] = query.data.data;
      }
    });
    return map;
  }, [queries]);

  const loading = queries.some(query => query.isLoading);
  const error = queries.find(query => query.error)?.error?.message || '';

  return {
    workItemsMap,
    loading,
    error
  };
};