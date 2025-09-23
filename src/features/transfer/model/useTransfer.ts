import { useState, useCallback } from 'react';
import { TimeEntry, Tokens, WorkItem } from '@/shared/model';
import { extractIssueId, extractDescription, isEntryTransferred } from '@/shared/lib';
import { useYouTrackTransfer, useYouTrackUser } from '@/shared/hooks';

export const useTransfer = (tokens: Tokens, timeEntries: TimeEntry[], selectedDate: string, workItemsMap: Record<string, WorkItem[]>) => {
  const [transferredEntries, setTransferredEntries] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const transferMutation = useYouTrackTransfer();
  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);

  const checkExistingEntries = useCallback(async (): Promise<void> => {
    if (!tokens.youtrackToken) return;

    try {
      const transferred = new Set<number>();

      for (const entry of timeEntries) {
        const issueId = extractIssueId(entry.description);
        if (!issueId) continue;

        const workItems = workItemsMap[issueId] || [];
        if (isEntryTransferred(entry, workItems, currentUser?.id)) {
          transferred.add(entry.id);
        }
      }

      setTransferredEntries(transferred);
    } catch (err: any) {
      console.error('Ошибка проверки существующих записей:', err);
    }
  }, [tokens.youtrackToken, timeEntries, selectedDate, workItemsMap, currentUser?.id]);

  const transferToYouTrack = useCallback(async (entry: TimeEntry): Promise<void> => {
    if (!tokens.youtrackToken) {
      setError('Не заполнен YouTrack токен');
      return;
    }

    const issueId = extractIssueId(entry.description);
    if (!issueId) {
      setError('Не найден ID задачи в описании');
      return;
    }

    try {
      const workItems = workItemsMap[issueId] || [];

      if (isEntryTransferred(entry, workItems, currentUser?.id)) {
        setError('Этот трекинг уже перенесен в YouTrack');
        return;
      }

      const entryDate = entry.start.split('T')[0];
      const description = extractDescription(entry.description);
      const entryDateObj = new Date(entryDate);
      const timestamp = entryDateObj.getTime();

      const workItem = {
        duration: { minutes: Math.round(entry.duration / 60) },
        text: description,
        date: timestamp
      };

      await transferMutation.mutateAsync({
        token: tokens.youtrackToken,
        issueId,
        workItem,
      });

      setTransferredEntries(prev => new Set([...prev, entry.id]));
      setError('');

    } catch (err: any) {
      setError(`Ошибка переноса в YouTrack: ${err.message}`);
    }
  }, [tokens.youtrackToken, selectedDate, transferMutation, currentUser?.id]);

  return {
    transferredEntries,
    error,
    transferToYouTrack,
    checkExistingEntries
  };
};
