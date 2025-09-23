import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TimeValidationResult, ValidationError } from '../types';

interface ValidationDetailsProps {
  validationResult?: TimeValidationResult;
  validationError?: ValidationError;
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationDetails = memo(({
  validationResult,
  validationError,
  isOpen,
  onClose
}: ValidationDetailsProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || (!validationResult && !validationError)) {
    return null;
  }

  return createPortal(
    <div className="validation-details-overlay" onClick={onClose}>
      <div className="validation-details" onClick={e => e.stopPropagation()}>
        <div className="validation-details-header">
          <h3>Детали валидации времени</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="validation-details-content">
          {validationError && (
            <div className="validation-error">
              <h4>Ошибка валидации</h4>
              <p className={`error-message ${validationError.severity}`}>
                {validationError.message}
              </p>
            </div>
          )}

          {validationResult && (
            <div className="validation-result">
              <h4>Сравнение времени</h4>
              <div className="duration-comparison">
                <div className="duration-item">
                  <span className="source">Toggl:</span>
                  <span className="duration">{validationResult.togglDurationMinutes} минут</span>
                </div>
                <div className="duration-item">
                  <span className="source">YouTrack:</span>
                  <span className="duration">{validationResult.youtrackDurationMinutes} минут</span>
                </div>
                <div className="duration-diff">
                  <span className="diff-label">Разница:</span>
                  <span className={`diff-value ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                    {Math.abs(validationResult.togglDurationMinutes - validationResult.youtrackDurationMinutes)} минут
                  </span>
                </div>
              </div>

              {validationResult.workItems.length > 0 && (
                <div className="work-items">
                  <h4>Work Items в YouTrack:</h4>
                  <div className="work-items-list">
                    {validationResult.workItems.map((item, index) => (
                      <div key={index} className="work-item">
                        <div className="work-item-header">
                          <span className="work-item-duration">{item.duration}м</span>
                          <span className="work-item-date">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="work-item-text">{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});
