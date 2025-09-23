import { useState, useCallback } from 'react';
import { TimeEntry, Tokens, WorkItem } from '@/shared/model';
import { extractIssueId, extractDescription, isEntryTransferred, GroupedTimeEntry } from '@/shared/lib';
import { useYouTrackTransfer, useYouTrackUser } from '@/shared/hooks';

export const useTransfer = (tokens: Tokens, timeEntries: TimeEntry[], selectedDate: string, workItemsMap: Record<string, WorkItem[]>, groupedEntries?: GroupedTimeEntry[]) => {
  const [transferredEntries, setTransferredEntries] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const transferMutation = useYouTrackTransfer();
  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);

  const checkExistingEntries = useCallback(async (): Promise<void> => {
    if (!tokens.youtrackToken) return;

    try {
      const transferred = new Set<number>();

      // Если есть группированные трекинги, используем их
      if (groupedEntries && groupedEntries.length > 0) {
        for (const groupedEntry of groupedEntries) {
          const issueId = extractIssueId(groupedEntry.description);
          if (!issueId) continue;

          const workItems = workItemsMap[issueId] || [];
          if (isEntryTransferred(groupedEntry, workItems, currentUser?.id)) {
            // Помечаем все оригинальные ID как перенесенные
            groupedEntry.originalIds.forEach(id => transferred.add(id));
          }
        }
      } else {
        // Обычная логика для негруппированных трекингов
        for (const entry of timeEntries) {
          const issueId = extractIssueId(entry.description);
          if (!issueId) continue;

          const workItems = workItemsMap[issueId] || [];
          if (isEntryTransferred(entry, workItems, currentUser?.id)) {
            transferred.add(entry.id);
          }
        }
      }

      setTransferredEntries(transferred);
    } catch (err: any) {
      console.error('Ошибка проверки существующих записей:', err);
    }
  }, [tokens.youtrackToken, timeEntries, selectedDate, workItemsMap, currentUser?.id, groupedEntries]);

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

      // Если это группированный трекинг, помечаем все оригинальные ID как перенесенные
      if (groupedEntries) {
        const groupedEntry = groupedEntries.find(ge => ge.id === entry.id);
        if (groupedEntry) {
          setTransferredEntries(prev => {
            const newSet = new Set(prev);
            groupedEntry.originalIds.forEach(id => newSet.add(id));
            return newSet;
          });
        } else {
          setTransferredEntries(prev => new Set([...prev, entry.id]));
        }
      } else {
        setTransferredEntries(prev => new Set([...prev, entry.id]));
      }

      setError('');

    } catch (err: any) {
      setError(`Ошибка переноса в YouTrack: ${err.message}`);
    }
  }, [tokens.youtrackToken, selectedDate, transferMutation, currentUser?.id, groupedEntries]);

  return {
    transferredEntries,
    error,
    transferToYouTrack,
    checkExistingEntries
  };
};
