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

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { settings } = useSettings();

  // Проверяем, заполнены ли токены для индикации ошибки
  const isApiConfigured = tokens.togglToken && tokens.youtrackToken;

  console.log('TrackerPage: settings.groupTogglTracks =', settings.groupTogglTracks);

  const { timeEntries, groupedEntries, loading, error: timeEntriesError, loadTimeEntries } = useTimeEntries(tokens, selectedDate, settings.groupTogglTracks);
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

  // Обработчик изменения даты с обновлением URL
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);

    // Обновляем URL с новым параметром даты
    const url = new URL(window.location.href);
    url.searchParams.set('date', newDate);
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['toggl-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['youtrack-user'] });

    setRefreshKey(prev => prev + 1);

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
        selectedDate={selectedDate}
        dateRange={formatDateRange(selectedDate)}
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
