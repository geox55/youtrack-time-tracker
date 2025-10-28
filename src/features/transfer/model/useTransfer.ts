import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { TimeEntry, Tokens, WorkItem } from '@/shared/model';
import { extractIssueId, extractDescription, isEntryTransferred, GroupedTimeEntry, roundToNearest5Minutes } from '@/shared/lib';
import { useYouTrackTransfer, useYouTrackUser, useSettings } from '@/shared/hooks';
import { togglApi, youtrackApi } from '@/shared/api';

export const useTransfer = (tokens: Tokens, timeEntries: TimeEntry[], startOfWeek: Date, workItemsMap: Record<string, Record<string, WorkItem[]>>, groupedEntries?: GroupedTimeEntry[]) => {
  const [transferredEntries, setTransferredEntries] = useState<Set<number>>(new Set());
  const [transferringEntries, setTransferringEntries] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const transferMutation = useYouTrackTransfer();
  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);
  const { settings } = useSettings();

  const checkExistingEntries = useCallback(async (): Promise<void> => {
    if (!tokens.youtrackToken) return;

    try {
      const transferred = new Set<number>();

      if (groupedEntries && groupedEntries.length > 0) {
        for (const groupedEntry of groupedEntries) {
          const issueId = extractIssueId(groupedEntry.description);
          if (!issueId) continue;

          if (isEntryTransferred(groupedEntry, workItemsMap, currentUser?.id)) {
            groupedEntry.originalIds.forEach(id => transferred.add(id));
          }
        }
      } else {
        for (const entry of timeEntries) {
          const issueId = extractIssueId(entry.description);
          if (!issueId) continue;

          if (isEntryTransferred(entry, workItemsMap, currentUser?.id)) {
            transferred.add(entry.id);
          }
        }
      }

      setTransferredEntries(transferred);
    } catch (err: any) {
    }
  }, [tokens.youtrackToken, timeEntries, startOfWeek, workItemsMap, currentUser?.id, groupedEntries]);

  const transferToYouTrack = useCallback(async (entry: TimeEntry): Promise<void> => {
    if (!tokens.youtrackToken) {
      const errorMsg = 'Не заполнен YouTrack токен';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const issueId = extractIssueId(entry.description);
    if (!issueId) {
      const errorMsg = 'Не найден ID задачи в описании';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Add entry to transferring set
    setTransferringEntries(prev => new Set([...prev, entry.id]));

    let createdWorkItemId: string | null = null;

    try {
      if (isEntryTransferred(entry, workItemsMap, currentUser?.id)) {
        const errorMsg = 'Этот трекинг уже перенесен в YouTrack';
        setError(errorMsg);
        toast.error(errorMsg);
        setTransferringEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entry.id);
          return newSet;
        });
        return;
      }

      const entryDateStr = entry.start.split('T')[0];
      const entryDescription = extractDescription(entry.description);
      const entryDateObj = new Date(entryDateStr);
      const timestamp = entryDateObj.getTime();

      const workItem = {
        duration: { minutes: roundToNearest5Minutes(entry.duration / 60) },
        text: entryDescription,
        date: timestamp
      };

      createdWorkItemId = await transferMutation.mutateAsync({
        token: tokens.youtrackToken,
        issueId,
        workItem,
      });


      if (settings.togglWorkspaceId) {
        const idsToTag = (entry as GroupedTimeEntry).originalIds || [entry.id];

        const tagResults = await Promise.all(
          idsToTag.map(id =>
            togglApi.updateTimeEntry(tokens.togglToken, settings.togglWorkspaceId, id, ['youtrack'])
              .catch(err => ({ id, error: err }))
          )
        );

        const failedTags = tagResults.filter(r => r && 'error' in r);
        if (failedTags.length > 0) {
          await youtrackApi.deleteWorkItem(tokens.youtrackToken, issueId, createdWorkItemId);
          throw new Error(`Не удалось проставить теги в Toggl (${failedTags.length}/${idsToTag.length}). Изменения откачены.`);
        }
      }

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

      const entryDate = new Date(entry.start);
      const dateStr = entryDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      });
      const dayOfWeek = entryDate.toLocaleDateString('ru-RU', { weekday: 'long' });
      toast.success(`${issueId}: ${entryDescription} перенесена (${dayOfWeek}, ${dateStr})`);

    } catch (err: any) {
      let errorMessage: string;
      if (createdWorkItemId) {
        errorMessage = `Ошибка тегирования Toggl: ${err.message}`;
      } else {
        errorMessage = `Ошибка создания в YouTrack: ${err.message}`;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Remove entry from transferring set
      setTransferringEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  }, [tokens.youtrackToken, startOfWeek, transferMutation, currentUser?.id, groupedEntries, settings.togglWorkspaceId, workItemsMap]);

  return {
    transferredEntries,
    transferringEntries,
    error,
    transferToYouTrack,
    checkExistingEntries
  };
};
