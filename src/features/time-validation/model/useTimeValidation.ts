import { useState, useEffect, useCallback } from 'react';
import { TimeEntry, WorkItem, Tokens } from '@/shared/model';
import { extractIssueId } from '@/shared/lib';
import { TimeValidationResult, ValidationError } from '../types';

export const useTimeValidation = (
  tokens: Tokens,
  timeEntries: TimeEntry[],
  workItemsMap: Record<string, WorkItem[]>,
  currentUserId?: string
) => {
  const [validationResults, setValidationResults] = useState<TimeValidationResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const validateTimeEntries = useCallback(async () => {
    if (!tokens.youtrackToken || !currentUserId) {
      return;
    }

    setLoading(true);
    const results: TimeValidationResult[] = [];
    const errors: ValidationError[] = [];

    for (const entry of timeEntries) {
      const issueId = extractIssueId(entry.description);
      if (!issueId) continue;

      const workItems = workItemsMap[issueId] || [];
      const entryDate = new Date(entry.start);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

      const relevantWorkItems = workItems.filter(item => {
        const itemDate = new Date(item.date);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        return itemDateOnly.getTime() === entryDateOnly.getTime();
      });

      const userWorkItems = relevantWorkItems.filter(item =>
        item.author?.id === currentUserId
      );

      const togglDurationMinutes = Math.round(entry.duration / 60);
      const youtrackDurationMinutes = userWorkItems.reduce((sum, item) =>
        sum + (item.duration?.minutes || 0), 0
      );

      const durationDiff = Math.abs(togglDurationMinutes - youtrackDurationMinutes);

      const hasYouTrackTime = youtrackDurationMinutes > 0;
      const isValid = !hasYouTrackTime || durationDiff <= 2;

      if (!hasYouTrackTime) {
        continue;
      }

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
        const errorMessage = `Время не сходится за ${entryDateOnly.toLocaleDateString()}: Toggl ${togglDurationMinutes}м, YouTrack ${youtrackDurationMinutes}м`;
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
  }, [tokens.youtrackToken, timeEntries, workItemsMap, currentUserId]);

  useEffect(() => {
    if (timeEntries.length > 0 && workItemsMap && currentUserId) {
      validateTimeEntries();
    }
  }, [validateTimeEntries]);

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
