import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTokens } from '@/features/auth';
import { TimeEntriesList, useTimeEntries } from '@/features/time-tracking';
import { useTransfer } from '@/features/transfer';
import { useTimeValidation } from '@/features/time-validation';
import { SettingsModal } from '@/features/settings';
import { useAllWorkItems, useYouTrackUser, useSettings } from '@/shared/hooks';
import { formatDateRange, createDateAtStartOfWeek, dateToString } from '@/shared/lib';

export const TrackerPage = () => {
  const queryClient = useQueryClient();
  const { tokens } = useTokens();

  const [startOfWeek, setStartOfWeek] = useState<Date>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateFromUrl = urlParams.get('date');
    const baseDate = dateFromUrl ? new Date(dateFromUrl) : new Date();

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return startOfWeek;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { settings } = useSettings();

  const isApiConfigured = tokens.togglToken && tokens.youtrackToken && settings.togglWorkspaceId;


  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);

  const { timeEntries, groupedEntries, loading, error: timeEntriesError, loadTimeEntries } = useTimeEntries(tokens, startOfWeek, settings.groupTogglTracks);
  const { workItemsMap, loading: workItemsLoading, error: workItemsError } = useAllWorkItems(tokens, timeEntries, startOfWeek, currentUser?.id);
  const {
    transferredEntries,
    error: transferError,
    transferToYouTrack,
    checkExistingEntries
  } = useTransfer(tokens, timeEntries, startOfWeek, workItemsMap, groupedEntries);

  const {
    validationResults,
    validationErrors,
    loading: validationLoading,
  } = useTimeValidation(tokens, timeEntries, workItemsMap, currentUser?.id);

  const error = timeEntriesError || workItemsError || transferError;

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

  const handleDateChange = useCallback((newDate: string) => {
    const newStartOfWeek = createDateAtStartOfWeek(newDate);
    setStartOfWeek(newStartOfWeek);

    const url = new URL(window.location.href);
    url.searchParams.set('date', dateToString(newStartOfWeek));
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['toggl-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['youtrack-user'] });


    await loadTimeEntries();
  }, [queryClient, loadTimeEntries]);

  return (
    <>
      <div className="page-header">
        <h1>Toggl ↔ YouTrack Integration</h1>
        <button
          className={`settings-button ${!isApiConfigured ? 'error' : ''}`}
          onClick={() => setIsSettingsOpen(true)}
        >
          ⚙️ Настройки
          {!isApiConfigured && <span className="settings-error-indicator">⚠️</span>}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <TimeEntriesList
        timeEntries={timeEntries}
        loading={loading || workItemsLoading || validationLoading}
        selectedDate={startOfWeek}
        dateRange={formatDateRange(startOfWeek)}
        transferredEntries={transferredEntries}
        onDateChange={handleDateChange}
        onTransfer={transferToYouTrack}
        onRefresh={handleRefresh}
        validationResults={validationResultsMap}
        validationErrors={validationErrorsMap}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
