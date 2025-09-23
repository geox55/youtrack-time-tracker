import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkItem } from '@/shared/model';
import { youtrackApi } from '@/shared/api';

export const useYouTrackTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      issueId,
      workItem,
    }: {
      token: string;
      issueId: string;
      workItem: WorkItem;
    }): Promise<void> => {
      await youtrackApi.createWorkItem(token, issueId, workItem);
    },
    onSuccess: (_: void, { issueId }: { token: string; issueId: string; workItem: WorkItem }) => {
      queryClient.invalidateQueries({
        queryKey: ['youtrack-work-items', issueId],
      });
      queryClient.invalidateQueries({
        queryKey: ['toggl-entries'],
      });
    },
  });
};
