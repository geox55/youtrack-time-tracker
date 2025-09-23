import { useQuery } from '@tanstack/react-query';
import { youtrackApi } from '@/shared/api';

export const useYouTrackUser = (youtrackToken: string) => {
  return useQuery({
    queryKey: ['youtrack-user', youtrackToken],
    queryFn: async () => {
      if (!youtrackToken) return null;
      return youtrackApi.getMe(youtrackToken);
    },
    enabled: !!youtrackToken,
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};
