import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { TimeEntry, WorkItem } from '@/shared/model';
import { extractIssueId, getGroupKeyForWorkItem } from '@/shared/lib';
import { youtrackApi } from '@/shared/api';

const searchWorkItems = async (
  token: string,
  issueId: string,
  startOfWeek: Date,
  currentUserId?: string
): Promise<WorkItem[]> => {

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const allWorkItems: WorkItem[] = [];
  const pageSize = 2000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await youtrackApi.getWorkItems(token, issueId, skip, pageSize);

    if (!response || !Array.isArray(response) || response.length === 0) {
      break;
    }

    const relevantInPage = response.filter((item: WorkItem) => {
      const itemDate = new Date(item.date);
      const isInDateRange = itemDate >= startOfWeek && itemDate <= endOfWeek;
      const isCurrentUser = !currentUserId || item.author?.id === currentUserId;
      return isInDateRange && isCurrentUser;
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

export const useAllWorkItems = (tokens: any, timeEntries: TimeEntry[], startOfWeek: Date, currentUserId?: string, isGrouped: boolean = true) => {
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
      queryKey: ['youtrack-work-items', issueId, startOfWeek.getTime(), currentUserId, isGrouped],
      queryFn: async () => {
        const workItems = await searchWorkItems(tokens.youtrackToken, issueId, startOfWeek, currentUserId);

        const grouped: Record<string, WorkItem[]> = {};
        
        // В несгруппированном режиме создаём группы и с Toggl ID (если доступен в метаданных), и без
        // Пока Toggl ID недоступен из WorkItem, используем fallback на дату
        workItems.forEach(item => {
          if (isGrouped) {
            // Группированный режим: используем стандартную группировку
            const groupKey = getGroupKeyForWorkItem(item, isGrouped);
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(item);
          } else {
            // Несгруппированный режим: создаём группы для возможных вариантов
            // Пока Toggl ID недоступен в WorkItem, используем fallback на дату
            const groupKey = getGroupKeyForWorkItem(item, isGrouped);
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(item);
          }
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