import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TokensForm, useTokens } from '@/features/auth';
import { TimeEntriesList, useTimeEntries } from '@/features/time-tracking';
import { useTransfer } from '@/features/transfer';
import { useTimeValidation } from '@/features/time-validation';
import { useAllWorkItems, useYouTrackUser } from '@/shared/hooks';
import { formatDateRange } from '@/shared/lib';

export const TrackerPage = () => {
  const queryClient = useQueryClient();
  const { tokens, setTokens } = useTokens();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const { timeEntries, groupedEntries, loading, error: timeEntriesError, loadTimeEntries } = useTimeEntries(tokens, selectedDate);
  const { workItemsMap, loading: workItemsLoading, error: workItemsError } = useAllWorkItems(tokens, timeEntries, selectedDate, refreshKey);
  const {
    transferredEntries,
    error: transferError,
    transferToYouTrack,
    checkExistingEntries
  } = useTransfer(tokens, timeEntries, selectedDate, workItemsMap, groupedEntries);

  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);

  const {
    validationResults,
    validationErrors,
    loading: validationLoading,
  } = useTimeValidation(tokens, timeEntries, workItemsMap, currentUser?.id);

  const error = timeEntriesError || workItemsError || transferError;

  // Проверка существующих записей после загрузки трекингов
  useEffect(() => {
    if (timeEntries.length > 0) {
      checkExistingEntries();
    }
  }, [timeEntries, checkExistingEntries]);

  const validationResultsMap = useMemo(() => {
    const map: Record<number, any> = {};
    validationResults.forEach(result => {
      map[result.entryId] = result;
    });
    return map;
  }, [validationResults]);

  const validationErrorsMap = useMemo(() => {
    const map: Record<number, any> = {};
    validationErrors.forEach(error => {
      map[error.entryId] = error;
    });
    return map;
  }, [validationErrors]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['toggl-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['youtrack-user'] });

    setRefreshKey(prev => prev + 1);

    await loadTimeEntries();
  }, [queryClient, loadTimeEntries]);

  return (
    <>
      <TokensForm tokens={tokens} setTokens={setTokens} />

      {error && <div className="error">{error}</div>}

      <TimeEntriesList
        timeEntries={timeEntries}
        loading={loading || workItemsLoading || validationLoading}
        selectedDate={selectedDate}
        dateRange={formatDateRange(selectedDate)}
        transferredEntries={transferredEntries}
        onDateChange={setSelectedDate}
        onTransfer={transferToYouTrack}
        onRefresh={handleRefresh}
        validationResults={validationResultsMap}
        validationErrors={validationErrorsMap}
      />
    </>
  );
};
