import { useState } from 'react';
import { TokensFormInline, useTokens } from '@/features/auth';
import { useSettings } from '@/shared/hooks';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'api' | 'grouping'>('api');
  const { tokens, setTokens } = useTokens();
  const { settings, updateSetting } = useSettings();

  // Проверяем, заполнены ли токены
  const isApiConfigured = tokens.togglToken && tokens.youtrackToken;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Настройки</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-tabs">
            <button
              className={`tab-button ${activeTab === 'api' ? 'active' : ''} ${!isApiConfigured ? 'error' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              API Токены
              {!isApiConfigured && <span className="tab-error-indicator">⚠️</span>}
            </button>
            <button
              className={`tab-button ${activeTab === 'grouping' ? 'active' : ''}`}
              onClick={() => setActiveTab('grouping')}
            >
              Группировка
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'api' && (
              <div className="api-settings">
                <h3>Настройки API</h3>
                {!isApiConfigured && (
                  <div className="api-error-warning">
                    ⚠️ Необходимо заполнить токены для работы приложения
                  </div>
                )}
                <p className="settings-description">
                  Введите токены для подключения к Toggl и YouTrack
                </p>
                <TokensFormInline tokens={tokens} setTokens={setTokens} />
              </div>
            )}

            {activeTab === 'grouping' && (
              <div className="grouping-settings">
                <h3>Настройки группировки</h3>
                <p className="settings-description">
                  Управление отображением трекингов времени
                </p>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.groupTogglTracks}
                      onChange={(e) => updateSetting('groupTogglTracks', e.target.checked)}
                    />
                    <span className="setting-text">
                      Объединять треки из Toggl по задаче и описанию
                    </span>
                  </label>
                  <div className="setting-description">
                    {settings.groupTogglTracks
                      ? 'Трекинги с одинаковыми задачей и описанием в один день будут объединены'
                      : 'Каждый трекинг будет показан отдельно'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
