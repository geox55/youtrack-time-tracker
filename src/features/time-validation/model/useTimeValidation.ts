import { useState, useEffect } from 'react';
import { TimeEntry, WorkItem, Tokens } from '@/shared/model';
import { extractIssueId, extractDescription, roundToNearest5Minutes, getGroupKeyForEntry } from '@/shared/lib';
import { TimeValidationResult, ValidationError } from '../types';

export const useTimeValidation = (
  tokens: Tokens,
  timeEntries: TimeEntry[],
  workItemsMap: Record<string, Record<string, WorkItem[]>>,
  currentUserId?: string,
  isGrouped: boolean = true
) => {
  const [validationResults, setValidationResults] = useState<TimeValidationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const validateTimeEntries = async () => {
    if (!tokens.youtrackToken || !currentUserId) {
      return;
    }

    setLoading(true);
    const results: TimeValidationResult[] = [];
    const errors: ValidationError[] = [];

    for (const entry of timeEntries) {
      const issueId = extractIssueId(entry.description);
      if (!issueId) continue;

      const entryDate = entry.start.split('T')[0];
      const entryDescription = extractDescription(entry.description);

      const issueWorkItems = workItemsMap[issueId] || {};

      // Генерируем ключ для трекинга
      const entryGroupKey = getGroupKeyForEntry(entry, isGrouped);
      const matchingGroup = issueWorkItems[entryGroupKey] || [];

      // Фильтруем по пользователю
      let userWorkItems: WorkItem[] = matchingGroup.filter(item =>
        item.author?.id === currentUserId
      );

      // Fallback для несгруппированного режима, если точный ключ не найден
      if (!isGrouped && userWorkItems.length === 0) {
        Object.keys(issueWorkItems).forEach(groupKey => {
          // Проверяем, что дата совпадает
          if (groupKey.endsWith(`-${entryDate}`)) {
            const items = issueWorkItems[groupKey] || [];
            const matchingItems = items.filter(item =>
              item.author?.id === currentUserId && item.text === entryDescription
            );
            userWorkItems.push(...matchingItems);
          }
        });
      }

      const togglDurationMinutes = roundToNearest5Minutes(entry.duration / 60);

      let youtrackDurationMinutes: number;
      if (isGrouped) {
        // В группированном режиме суммируем длительность всех WorkItems
        youtrackDurationMinutes = userWorkItems.reduce((sum, item) =>
          sum + (item.duration?.minutes || 0), 0
        );
      } else {
        // В индивидуальном режиме ищем точное совпадение по длительности
        // Сравниваем с каждым WorkItem отдельно
        const matchingItem = userWorkItems.find(item => {
          const itemDuration = item.duration?.minutes || 0;
          return Math.abs(itemDuration - togglDurationMinutes) <= 2;
        });
        youtrackDurationMinutes = matchingItem ? (matchingItem.duration?.minutes || 0) : 0;
      }

      const durationDiff = Math.abs(togglDurationMinutes - youtrackDurationMinutes);

      const hasYouTrackTime = youtrackDurationMinutes > 0;
      const isValid = !hasYouTrackTime || durationDiff <= 5;

      // Показываем результат валидации всегда, даже если нет времени в YouTrack

      const result: TimeValidationResult = {
        entryId: entry.id,
        issueId,
        togglDuration: entry.duration,
        youtrackDuration: youtrackDurationMinutes,
        togglDurationMinutes,
        youtrackDurationMinutes,
        isValid,
        workItems: userWorkItems.map(item => ({
          id: item.date.toString(),
          duration: item.duration?.minutes || 0,
          text: item.text,
          date: item.date,
          author: item.author
        }))
      };

      // Показываем ошибку только если время не совпадает
      if (!isValid) {
        const errorMessage = `Время не сходится за ${entryDate}: Toggl ${togglDurationMinutes}м, YouTrack ${youtrackDurationMinutes}м`;
        result.errorMessage = errorMessage;

        errors.push({
          entryId: entry.id,
          issueId,
          message: errorMessage,
          severity: durationDiff > 10 ? 'error' : 'warning'
        });
      }

      results.push(result);
    }

    setValidationResults(results);
    setValidationErrors(errors);
    setLoading(false);
  };

  useEffect(() => {
    if (timeEntries.length > 0 && workItemsMap && currentUserId) {
      validateTimeEntries();
    }
  }, [timeEntries, workItemsMap, currentUserId, isGrouped]);

  const getValidationResult = (entryId: number): TimeValidationResult | undefined => {
    return validationResults.find(result => result.entryId === entryId);
  };

  const hasValidationErrors = (entryId: number): boolean => {
    return validationErrors.some(error => error.entryId === entryId);
  };

  const getValidationError = (entryId: number): ValidationError | undefined => {
    return validationErrors.find(error => error.entryId === entryId);
  };

  return {
    validationResults,
    validationErrors,
    loading,
    validateTimeEntries,
    getValidationResult,
    hasValidationErrors,
    getValidationError
  };
};
