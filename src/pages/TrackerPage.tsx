import { useState, useEffect } from 'react';
import { TokensForm, useTokens } from '@/features/auth';
import { TimeEntriesList, useTimeEntries } from '@/features/time-tracking';
import { useTransfer } from '@/features/transfer';
import { useAllWorkItems } from '@/shared/hooks';
import { formatDateRange } from '@/shared/lib';

export const TrackerPage = () => {
  const { tokens, setTokens } = useTokens();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { timeEntries, groupedEntries, loading, error: timeEntriesError, loadTimeEntries } = useTimeEntries(tokens, selectedDate);
  const { workItemsMap, loading: workItemsLoading, error: workItemsError } = useAllWorkItems(tokens, timeEntries, selectedDate);
  const {
    transferredEntries,
    error: transferError,
    transferToYouTrack,
    checkExistingEntries
  } = useTransfer(tokens, timeEntries, selectedDate, workItemsMap, groupedEntries);

  const error = timeEntriesError || workItemsError || transferError;

  // Проверка существующих записей после загрузки трекингов
  useEffect(() => {
    if (timeEntries.length > 0) {
      checkExistingEntries();
    }
  }, [timeEntries, checkExistingEntries]);

  return (
    <>
      <TokensForm tokens={tokens} setTokens={setTokens} />

      {error && <div className="error">{error}</div>}

      <TimeEntriesList
        timeEntries={timeEntries}
        loading={loading || workItemsLoading}
        selectedDate={selectedDate}
        dateRange={formatDateRange(selectedDate)}
        transferredEntries={transferredEntries}
        onDateChange={setSelectedDate}
        onTransfer={transferToYouTrack}
        onRefresh={loadTimeEntries}
      />
    </>
  );
};
