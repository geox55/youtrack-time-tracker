import { useQuery } from '@tanstack/react-query';
import { TimeEntry, Tokens } from '@/shared/model';
import { togglApi } from '@/shared/api';
import { getWeekRange } from '@/shared/lib';

export const useTogglEntries = (tokens: Tokens, startOfWeek: Date) => {
  return useQuery({
    queryKey: ['toggl-entries', tokens.togglToken, startOfWeek.getTime()],
    queryFn: async (): Promise<TimeEntry[]> => {
      if (!tokens.togglToken) return [];

      const { startDate, endDate } = getWeekRange(startOfWeek);

      const entries = await togglApi.getTimeEntries(tokens.togglToken, startDate, endDate);

      return entries;
    },
    enabled: !!tokens.togglToken,
    staleTime: 2 * 60 * 1000,
  });
};
