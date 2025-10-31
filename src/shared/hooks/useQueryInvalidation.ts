import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateTimeEntries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['toggl-entries'],
    });
  }, [queryClient]);

  const invalidateWorkItems = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['youtrack-work-items'],
    });
  }, [queryClient]);

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      invalidateTimeEntries(),
      invalidateWorkItems(),
    ]);
  }, [invalidateTimeEntries, invalidateWorkItems]);

  return {
    invalidateTimeEntries,
    invalidateWorkItems,
    invalidateAll,
  };
};
