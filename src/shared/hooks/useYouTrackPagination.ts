import { useState, useCallback } from 'react';
import { WorkItem } from '@/shared/model';
import { youtrackApi } from '@/shared/api';

interface PaginationState {
  skip: number;
  hasMore: boolean;
  loading: boolean;
}

export const useYouTrackPagination = () => {
  const [state, setState] = useState<PaginationState>({
    skip: 0,
    hasMore: true,
    loading: false
  });


  const searchWorkItems = useCallback(async (
    token: string,
    issueId: string,
    selectedDate: string
  ): Promise<WorkItem[]> => {
    setState(prev => ({ ...prev, loading: true }));

    const skipCache = JSON.parse(localStorage.getItem('youtrack_skips') || '{}');
    let skip = skipCache[issueId] || 0;

    const selectedDateObj = new Date(selectedDate);
    const startOfWeek = new Date(selectedDateObj);
    startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const allWorkItems: WorkItem[] = [];
    const pageSize = 100;
    const visitedSkips = new Set<number>();
    let maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      if (visitedSkips.has(skip)) {
        break;
      }
      visitedSkips.add(skip);

      const response = await youtrackApi.getWorkItems(token, issueId, skip);

      if (!response || response.length === 0) {
        const previousSkip = Math.max(0, skip - pageSize);
        skipCache[issueId] = previousSkip;
        localStorage.setItem('youtrack_skips', JSON.stringify(skipCache));
        break;
      }

      const relevantInPage = response.filter((item: WorkItem) => {
        const itemDate = new Date(item.date);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      });

      if (relevantInPage.length > 0) {
        allWorkItems.push(...relevantInPage);
        skipCache[issueId] = skip;
        localStorage.setItem('youtrack_skips', JSON.stringify(skipCache));
        skip += pageSize;
      } else {
        const dates = response.map((item: WorkItem) => new Date(item.date).getTime());
        const oldestInPage = Math.min(...dates);
        const newestInPage = Math.max(...dates);
        const weekStart = startOfWeek.getTime();
        const weekEnd = endOfWeek.getTime();

        if (newestInPage < weekStart) {
          skip += pageSize;
        } else if (oldestInPage > weekEnd) {
          const newSkip = Math.max(0, skip - pageSize);
          if (newSkip === skip || visitedSkips.has(newSkip)) {
            break;
          }
          skip = newSkip;
        } else {
          break;
        }
      }
    }

    setState(prev => ({ ...prev, loading: false, skip, hasMore: false }));

    return allWorkItems;
  }, []);

  return {
    state,
    searchWorkItems
  };
};
