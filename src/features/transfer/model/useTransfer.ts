import { useState, useCallback } from 'react';
import { TimeEntry, Tokens, WorkItem } from '@/shared/model';
import { extractIssueId, extractDescription, isEntryTransferred, GroupedTimeEntry, roundToNearest5Minutes } from '@/shared/lib';
import { useYouTrackTransfer, useYouTrackUser, useSettings } from '@/shared/hooks';
import { togglApi, youtrackApi } from '@/shared/api';

export const useTransfer = (tokens: Tokens, timeEntries: TimeEntry[], startOfWeek: Date, workItemsMap: Record<string, Record<string, WorkItem[]>>, groupedEntries?: GroupedTimeEntry[]) => {
  const [transferredEntries, setTransferredEntries] = useState<Set<number>>(new Set());
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
      setError('Не заполнен YouTrack токен');
      return;
    }

    const issueId = extractIssueId(entry.description);
    if (!issueId) {
      setError('Не найден ID задачи в описании');
      return;
    }

    let createdWorkItemId: string | null = null;

    try {
      if (isEntryTransferred(entry, workItemsMap, currentUser?.id)) {
        setError('Этот трекинг уже перенесен в YouTrack');
        return;
      }

      const entryDate = entry.start.split('T')[0];
      const description = extractDescription(entry.description);
      const entryDateObj = new Date(entryDate);
      const timestamp = entryDateObj.getTime();

      const workItem = {
        duration: { minutes: roundToNearest5Minutes(entry.duration / 60) },
        text: description,
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

    } catch (err: any) {
      // Различаем ошибки по типу
      if (createdWorkItemId) {
        setError(`Ошибка тегирования Toggl: ${err.message}`);
      } else {
        setError(`Ошибка создания в YouTrack: ${err.message}`);
      }
    }
  }, [tokens.youtrackToken, startOfWeek, transferMutation, currentUser?.id, groupedEntries, settings.togglWorkspaceId, workItemsMap]);

  return {
    transferredEntries,
    error,
    transferToYouTrack,
    checkExistingEntries
  };
};
