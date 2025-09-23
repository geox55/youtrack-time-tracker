import { memo } from 'react';
import { TimeEntryCardProps } from '../types';
import { extractIssueId, extractDescription } from '@/shared/lib';

export const TimeEntryCard = memo(({
  entry,
  isTransferred,
  formatDuration,
  formatTime,
  onTransfer
}: TimeEntryCardProps) => {
  const issueId = extractIssueId(entry.description) || 'Неизвестная задача';
  const description = extractDescription(entry.description);

  return (
    <div className={`time-entry-card ${isTransferred ? 'transferred' : ''}`}>
      <div className="entry-header">
        <span className="entry-issue-id">{issueId}</span>
        <span className="entry-duration">{formatDuration(entry.duration)}</span>
      </div>

      <div className="entry-description" title={entry.description}>
        {description}
      </div>

      <div className="entry-time">
        <span className="entry-start">{formatTime(entry.start)}</span>
        {entry.stop && (
          <span className="entry-stop"> - {formatTime(entry.stop)}</span>
        )}
      </div>

      <div className="entry-footer">
        <span className="entry-date">{entry.start.split('T')[0]}</span>

        {isTransferred ? (
          <span className="transferred-status">
            ✅ Перенесено
          </span>
        ) : (
          <button
            className="transfer-button"
            onClick={() => onTransfer(entry)}
            title={`Перенести в YouTrack timesheet`}
          >
            📤 Перенести
          </button>
        )}
      </div>
    </div>
  );
});
