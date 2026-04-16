import { useState } from 'react';
import TimezoneSelect, { ITimezoneOption } from 'react-timezone-select';
import { TokensFormInline, useTokens } from '@/features/auth';
import { togglApi } from '@/shared/api';
import { useSettings, useQueryInvalidation } from '@/shared/hooks';

type SettingsTab = 'api' | 'grouping' | 'timezone';

type TimezoneSyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [timezoneSyncStatus, setTimezoneSyncStatus] = useState<TimezoneSyncStatus>('idle');
  const [timezoneSyncError, setTimezoneSyncError] = useState<string>('');
  const { tokens, setTokens } = useTokens();
  const { settings, updateSetting } = useSettings();
  const { invalidateAll } = useQueryInvalidation();

  const handleSyncTimezoneFromToggl = async (): Promise<void> => {
    if (!tokens.togglToken) {
      setTimezoneSyncStatus('error');
      setTimezoneSyncError('Сначала укажите токен Toggl на вкладке «API Токены»');
      return;
    }
    setTimezoneSyncStatus('loading');
    setTimezoneSyncError('');
    try {
      const profile = await togglApi.getProfile(tokens.togglToken);
      if (!profile?.timezone || typeof profile.timezone !== 'string' || !profile.timezone.trim()) {
        throw new Error('В ответе Toggl нет поля timezone');
      }
      const togglTimezone = profile.timezone.trim();
      updateSetting('togglProfileTimezone', togglTimezone);
      updateSetting('timezone', togglTimezone);
      invalidateAll();
      setTimezoneSyncStatus('success');
      window.setTimeout(() => {
        setTimezoneSyncStatus('idle');
      }, 2000);
    } catch (error) {
      setTimezoneSyncStatus('error');
      setTimezoneSyncError(error instanceof Error ? error.message : 'Не удалось загрузить профиль Toggl');
    }
  };

  const handleTimezoneChange = (timezone: ITimezoneOption): void => {
    // Manual timezone selection becomes active only when Toggl profile timezone is cleared.
    updateSetting('togglProfileTimezone', '');
    updateSetting('timezone', timezone.value);
    invalidateAll();
  };

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
            <button
              className={`tab-button ${activeTab === 'timezone' ? 'active' : ''}`}
              onClick={() => setActiveTab('timezone')}
            >
              Часовой пояс
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
                      onBlur={(e) => {
                        if (e.target.value.trim() !== '') {
                          invalidateAll();
                        }
                      }}
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
                      onChange={(e) => {
                        updateSetting('groupTogglTracks', e.target.checked);
                        invalidateAll();
                      }}
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

            {activeTab === 'timezone' && (
              <div className="timezone-settings">
                <h3>Часовой пояс</h3>
                <p className="settings-description">
                  По этому поясу определяется календарный день треков (группировка, валидация, перенос в YouTrack).
                </p>

                <div className="setting-item">
                  <div className="setting-label timezone-setting-label">
                    <span className="setting-text">IANA timezone (например, Europe/Moscow)</span>
                  </div>
                  <div className="timezone-select-wrapper">
                    <TimezoneSelect
                      value={settings.timezone}
                      onChange={handleTimezoneChange}
                      classNamePrefix="timezone-select"
                      menuPlacement="auto"
                      menuShouldScrollIntoView
                    />
                  </div>
                  <div className="setting-description">
                    Активный источник TZ: {settings.togglProfileTimezone ? 'Toggl profile' : 'ручная настройка/браузер'}.
                    Нажмите «Синхронизировать с Toggl», чтобы использовать timezone из профиля Toggl Track.
                  </div>
                </div>

                <div className="setting-item" style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="sync-timezone-button"
                    onClick={() => void handleSyncTimezoneFromToggl()}
                    disabled={timezoneSyncStatus === 'loading'}
                  >
                    {timezoneSyncStatus === 'loading' ? 'Загрузка…' : '↻ Синхронизировать с Toggl'}
                  </button>
                  {timezoneSyncStatus === 'success' && (
                    <span style={{ marginLeft: '0.75rem', color: '#28a745' }}>Сохранено</span>
                  )}
                  {timezoneSyncStatus === 'error' && timezoneSyncError && (
                    <div className="api-error-warning" style={{ marginTop: '0.75rem' }}>
                      {timezoneSyncError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
