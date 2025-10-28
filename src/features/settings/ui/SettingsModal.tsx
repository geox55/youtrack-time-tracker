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

  // Проверяем, заполнены ли токены и workspace ID
  const isApiConfigured = tokens.togglToken && tokens.youtrackToken && settings.togglWorkspaceId;

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

                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>Дополнительные настройки</h4>
                <div className="setting-item">
                  <label className="setting-label">
                    <span className="setting-text">Toggl Workspace ID: <span style={{ color: '#dc3545' }}>*</span></span>
                    <input
                      type="text"
                      value={settings.togglWorkspaceId}
                      onChange={(e) => updateSetting('togglWorkspaceId', e.target.value)}
                      placeholder="1234567"
                      className="setting-input"
                      required
                    />
                  </label>
                  <div className="setting-description">
                    <strong>Обязательное поле.</strong> ID рабочего пространства Toggl для обновления тегов.
                    <br />
                    <strong>Где найти:</strong> Toggl → Settings → Profile → Workspace ID (в URL или в настройках)
                  </div>
                </div>
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
