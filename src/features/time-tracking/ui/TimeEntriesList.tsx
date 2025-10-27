import { memo } from 'react';
import { TimeEntriesListProps } from '../types';
import { dateToString } from '@/shared/lib';
import { TimeEntryCard } from './TimeEntryCard';
import { formatDuration, formatTime, formatDate, groupEntriesByDate } from '@/shared/lib';

export const TimeEntriesList = memo(({
  timeEntries,
  loading,
  selectedDate,
  dateRange,
  transferredEntries,
  onDateChange,
  onTransfer,
  onRefresh,
  validationResults,
  validationErrors
}: TimeEntriesListProps) => {
  // Группируем трекинги по датам
  const groupedEntries = groupEntriesByDate(timeEntries);

  // Сортируем даты по убыванию
  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="time-entries-list">
      <div className="entries-header">
        <div className="date-selector">
          <label>Период:</label>
          <input
            type="date"
            value={dateToString(selectedDate)}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <span className="date-range">{dateRange}</span>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          {loading ? '⏳' : '🔄'} Обновить
        </button>
      </div>

      {loading && <div className="loading">Загрузка трекингов...</div>}

      {!loading && sortedDates.map(date => {
        const totalDuration = groupedEntries[date].reduce(
          (sum, entry) => sum + entry.duration, 0
        );

        return (
          <div key={date} className="date-group">
            <div className="date-header">
              <h3>{formatDate(date)}</h3>
              <span className="date-total">
                {formatDuration(totalDuration)}
              </span>
              <span className="date-count">
                {groupedEntries[date].length} трекингов
              </span>
            </div>

            <div className="entries-grid">
              {groupedEntries[date].map(entry => (
                <TimeEntryCard
                  key={entry.id}
                  entry={entry}
                  isTransferred={transferredEntries.has(entry.id)}
                  formatDuration={formatDuration}
                  formatTime={formatTime}
                  onTransfer={onTransfer}
                  validationResult={validationResults?.[entry.id]}
                  validationError={validationErrors?.[entry.id]}
                />
              ))}
            </div>
          </div>
        );
      })}

      {!loading && sortedDates.length === 0 && (
        <div className="no-entries">
          <p>Нет трекингов за выбранный период</p>
        </div>
      )}
    </div>
  );
});
