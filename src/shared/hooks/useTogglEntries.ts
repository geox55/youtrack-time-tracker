import { useQuery } from '@tanstack/react-query';
import { TimeEntry, Tokens } from '@/shared/model';
import { togglApi } from '@/shared/api';
import { getWeekRange } from '@/shared/lib';

export const useTogglEntries = (tokens: Tokens, selectedDate: string) => {
  return useQuery({
    queryKey: ['toggl-entries', tokens.togglToken, selectedDate],
    queryFn: async (): Promise<TimeEntry[]> => {
      if (!tokens.togglToken) return [];

      const { startDate, endDate } = getWeekRange(selectedDate);
      return togglApi.getTimeEntries(tokens.togglToken, startDate, endDate);
    },
    enabled: !!tokens.togglToken,
    staleTime: 2 * 60 * 1000,
  });
};
