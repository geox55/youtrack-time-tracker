import { memo } from 'react';
import { TimeValidationResult, ValidationError } from '../types';

interface ValidationIndicatorProps {
  validationResult?: TimeValidationResult;
  validationError?: ValidationError;
  className?: string;
}

export const ValidationIndicator = memo(({
  validationResult,
  validationError,
  className = ''
}: ValidationIndicatorProps) => {
  if (!validationResult && !validationError) {
    return null;
  }

  // Не показываем индикатор, если в YouTrack нет времени
  const hasYouTrackTime = validationResult && validationResult.youtrackDurationMinutes > 0;
  if (!hasYouTrackTime && !validationError) {
    return null;
  }

  const severity = validationError?.severity || (validationResult && !validationResult.isValid ? 'error' : undefined);

  const isValidWithTime = validationResult && validationResult.isValid && hasYouTrackTime;

  if (isValidWithTime) {
    return (
      <span className={`validation-indicator valid ${className}`} title="Время совпадает">
        ✅
      </span>
    );
  }

  const getIcon = () => {
    if (severity === 'error') return '❌';
    if (severity === 'warning') return '⚠️';
    return '❌';
  };

  const getTitle = () => {
    if (validationError) {
      return validationError.message;
    }
    if (validationResult) {
      return `Toggl: ${validationResult.togglDurationMinutes}м, YouTrack: ${validationResult.youtrackDurationMinutes}м`;
    }
    return 'Ошибка валидации';
  };

  return (
    <span
      className={`validation-indicator ${severity || 'error'} ${className}`}
      title={getTitle()}
    >
      {getIcon()}
    </span>
  );
});
