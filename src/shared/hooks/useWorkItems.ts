import { useQuery } from '@tanstack/react-query';
import { youtrackApi } from '@/shared/api';
import { WorkItem } from '@/shared/model';

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

export const useWorkItems = (token: string, issueId: string, selectedDate: string) => {
  return useQuery({
    queryKey: ['youtrack-work-items', issueId, selectedDate],
    queryFn: async () => {
      const workItems = await searchWorkItems(token, issueId, selectedDate);

      // Группируем по text + date
      const grouped: Record<string, WorkItem[]> = {};
      workItems.forEach(item => {
        const itemDate = new Date(item.date);
        const dateKey = itemDate.toISOString().split('T')[0];
        const groupKey = `${item.text}-${dateKey}`;
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(item);
      });

      return grouped;
    },
    enabled: !!token && !!issueId,
  });
};
