import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { WorkItem } from '@/shared/model';
import { youtrackApi } from '@/shared/api';

const CHEAT_MODE_ISSUES = ['DEV-710', 'DEV-2349', 'DEV-2575', 'DEV-2698'];
const DAYS_IN_MONTH = 30;

const getAllWorkItems = async (
  token: string,
  issueId: string,
  startDate: Date
): Promise<WorkItem[]> => {
  const allWorkItems: WorkItem[] = [];
  const pageSize = 2000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await youtrackApi.getWorkItems(token, issueId, skip, pageSize);

    if (!response || !Array.isArray(response) || response.length === 0) {
      break;
    }

    // Фильтруем только за последний месяц
    const filteredItems = response.filter((item: WorkItem) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });

    allWorkItems.push(...filteredItems);
    
    // Проверяем, есть ли еще данные за нужный период
    const lastItemDate = response.length > 0 ? new Date(response[response.length - 1].date) : null;
    if (lastItemDate && lastItemDate < startDate) {
      hasMore = false;
    } else if (response.length < pageSize) {
      hasMore = false;
    } else {
      skip += pageSize;
    }
  }

  return allWorkItems;
};

export const useAverageTimePerDay = (youtrackToken: string | null) => {
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - DAYS_IN_MONTH);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const queries = useQueries({
    queries: CHEAT_MODE_ISSUES.map(issueId => ({
      queryKey: ['cheatmode-work-items', issueId, startDate.getTime()],
      queryFn: async () => {
        if (!youtrackToken) return [];
        const workItems = await getAllWorkItems(youtrackToken, issueId, startDate);
        return { issueId, workItems };
      },
      enabled: !!youtrackToken,
    }))
  });

  const dailyData = useMemo(() => {
    const allWorkItems: WorkItem[] = [];
    
    queries.forEach(query => {
      if (query.data?.workItems) {
        allWorkItems.push(...query.data.workItems);
      }
    });

    if (allWorkItems.length === 0) {
      return null;
    }

    // Группируем по дням с сохранением всех work items
    const dailyGroups: Record<string, WorkItem[]> = {};
    
    allWorkItems.forEach(item => {
      const date = new Date(item.date);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!dailyGroups[dayKey]) {
        dailyGroups[dayKey] = [];
      }
      
      dailyGroups[dayKey].push(item);
    });

    // Сортируем дни по дате (от новых к старым)
    const sortedDays = Object.keys(dailyGroups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    if (sortedDays.length === 0) {
      return null;
    }

    // Формируем массив данных по дням с трекингами
    const dailyEntries = sortedDays.map(day => {
      const items = dailyGroups[day];
      const totalMinutes = items.reduce((sum, item) => sum + item.duration.minutes, 0);
      
      return {
        date: day,
        items: items,
        totalMinutes: totalMinutes,
      };
    });

    // Считаем среднее время за день
    const totalMinutes = dailyEntries.reduce((sum, entry) => sum + entry.totalMinutes, 0);
    const averageMinutes = totalMinutes / sortedDays.length;

    return {
      dailyEntries,
      averageMinutes,
      totalDays: sortedDays.length,
      totalMinutes,
    };
  }, [queries]);

  const loading = queries.some(query => query.isLoading);
  const error = queries.find(query => query.error)?.error?.message || '';

  return {
    dailyData,
    loading,
    error
  };
};

