import { memo, useState } from 'react';
import { TimeEntryCardProps } from '../types';
import { extractIssueId, extractDescription, toLocalDateKey } from '@/shared/lib';
import { ValidationIndicator, ValidationDetails } from '../../time-validation';
import { YOUTRACK_BASE_URL } from '@/shared/config';

export const TimeEntryCard = memo(({
  entry,
  isTransferred,
  isTransferring = false,
  formatDuration,
  formatTime,
  onTransfer,
  validationResult,
  validationError
}: TimeEntryCardProps) => {
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const issueId = extractIssueId(entry.description) || 'Неизвестная задача';
  const description = extractDescription(entry.description);

  const hasValidationError = validationError || (validationResult && !validationResult.isValid);

  return (
    <div className={`time-entry-card ${isTransferred ? 'transferred' : ''} ${hasValidationError ? 'validation-error' : ''}`}>
      <div className="entry-header">
        {issueId !== 'Неизвестная задача' ? (
          <a
            href={`${YOUTRACK_BASE_URL}/issue/${issueId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="entry-issue-id entry-issue-id-link"
          >
            {issueId}
          </a>
        ) : (
          <span className="entry-issue-id">{issueId}</span>
        )}
        <span className="entry-duration">{formatDuration(entry.duration)}</span>
        <ValidationIndicator
          validationResult={validationResult}
          validationError={validationError}
          className="validation-indicator"
        />
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
        <span className="entry-date">{toLocalDateKey(entry.start)}</span>

        <div className="entry-actions">
          {hasValidationError && (
            <button
              className="validation-details-button"
              onClick={() => setShowValidationDetails(true)}
              title="Показать детали валидации"
            >
              🔍 Детали
            </button>
          )}

          {isTransferred ? (
            <span className="transferred-status">
              ✅ Перенесено
            </span>
          ) : (
            <button
              className="transfer-button"
              onClick={() => onTransfer(entry)}
              disabled={isTransferring}
              title={isTransferring ? 'Перенос в процессе...' : 'Перенести в YouTrack timesheet'}
            >
              {isTransferring ? '⏳ Перенос...' : '📤 Перенести'}
            </button>
          )}
        </div>
      </div>

      <ValidationDetails
        validationResult={validationResult}
        validationError={validationError}
        isOpen={showValidationDetails}
        onClose={() => setShowValidationDetails(false)}
      />
    </div>
  );
});
