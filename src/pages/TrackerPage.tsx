import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTokens } from '@/features/auth';
import { TimeEntriesList, useTimeEntries } from '@/features/time-tracking';
import { useTransfer } from '@/features/transfer';
import { useTimeValidation } from '@/features/time-validation';
import { SettingsModal } from '@/features/settings';
import { useAllWorkItems, useYouTrackUser, useSettings } from '@/shared/hooks';
import { formatDateRange } from '@/shared/lib';

export const TrackerPage = () => {
  const queryClient = useQueryClient();
  const { tokens } = useTokens();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateFromUrl = urlParams.get('date');
    return dateFromUrl || new Date().toISOString().split('T')[0];
  });

  const startOfWeek = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const startOfWeek = new Date(baseDate);
    const dayOfWeek = baseDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(baseDate.getDate() + daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }, [selectedDate]);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { settings } = useSettings();

  const isApiConfigured = tokens.togglToken && tokens.youtrackToken && settings.togglWorkspaceId;


  const { data: currentUser } = useYouTrackUser(tokens.youtrackToken);

  const { timeEntries, groupedEntries, loading, error: timeEntriesError, loadTimeEntries } = useTimeEntries(tokens, startOfWeek, settings.groupTogglTracks);
  const { workItemsMap, loading: workItemsLoading, error: workItemsError } = useAllWorkItems(tokens, timeEntries, startOfWeek, currentUser?.id);
  const {
    transferredEntries,
    transferringEntries,
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
    setSelectedDate(newDate);

    const url = new URL(window.location.href);
    url.searchParams.set('date', newDate);
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['toggl-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['youtrack-work-items'] });
    await loadTimeEntries();
  }, [queryClient, loadTimeEntries]);

  return (
    <>
      <div className="page-header">
        <h1>Toggl ↔ YouTrack Integration</h1>
        <div className="header-actions">
          <a
            href="https://youtrack.infra.gbooking.ru/timesheets"
            target="_blank"
            rel="noopener noreferrer"
            className="timesheets-link"
          >
            📊 Таймшиты ↗
          </a>
          <button
            className={`settings-button ${!isApiConfigured ? 'error' : ''}`}
            onClick={() => setIsSettingsOpen(true)}
          >
            ⚙️ Настройки
            {!isApiConfigured && <span className="settings-error-indicator">⚠️</span>}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <TimeEntriesList
        timeEntries={timeEntries}
        loading={loading || workItemsLoading || validationLoading}
        selectedDate={selectedDate}
        dateRange={formatDateRange(startOfWeek)}
        transferredEntries={transferredEntries}
        transferringEntries={transferringEntries}
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
