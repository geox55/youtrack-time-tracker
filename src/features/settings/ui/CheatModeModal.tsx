import { useAverageTimePerDay } from '@/shared/hooks';
import { formatDuration, formatDate } from '@/shared/lib';
import { useTokens } from '@/features/auth';

interface CheatModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatModeModal = ({ isOpen, onClose }: CheatModeModalProps) => {
  const { tokens } = useTokens();
  const { dailyData, loading, error } = useAverageTimePerDay(tokens.youtrackToken);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Сводка за последний месяц</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Загрузка данных...</div>}

          {error && (
            <div className="error-message">
              Ошибка загрузки данных: {error}
            </div>
          )}

          {!loading && !error && dailyData && (
            <div>              
              <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                {dailyData.dailyEntries.map((dayEntry) => (
                  <div key={dayEntry.date} style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>
                        {formatDate(dayEntry.date)}
                      </h3>
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#666' }}>
                        Всего: {formatDuration(Math.round(dayEntry.totalMinutes * 60))}
                      </span>
                    </div>
                    
                    <div style={{ paddingLeft: '12px' }}>
                      {dayEntry.items.map((item, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            padding: '8px 0',
                            borderBottom: index < dayEntry.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                          }}
                        >
                          <div style={{ flex: 1, marginRight: '16px', wordBreak: 'break-word' }}>
                            <span style={{ color: '#555', fontSize: '0.9rem' }}>
                              {item.text || '(без описания)'}
                            </span>
                          </div>
                          <div style={{ flexShrink: 0, fontWeight: 500, color: '#333' }}>
                            {formatDuration(Math.round(item.duration.minutes * 60))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="duration-comparison" style={{ marginTop: '20px' }}>
                <div className="duration-item">
                  <span className="source">Среднее время за день:</span>
                  <span className="duration">
                    {formatDuration(Math.round(dailyData.averageMinutes * 60))}
                  </span>
                </div>
                <div className="duration-item">
                  <span className="source">Всего дней с данными:</span>
                  <span className="duration">{dailyData.totalDays}</span>
                </div>
                <div className="duration-item">
                  <span className="source">Всего времени:</span>
                  <span className="duration">
                    {formatDuration(Math.round(dailyData.totalMinutes * 60))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !dailyData && (
            <div className="no-entries">
              <p>Нет данных за последний месяц</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

