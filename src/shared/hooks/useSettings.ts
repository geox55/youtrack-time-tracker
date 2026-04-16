import { useState, useEffect } from 'react';

interface AppSettings {
  groupTogglTracks: boolean;
  togglWorkspaceId: string;
  /** IANA timezone (e.g. Europe/Moscow) — used for day keys / grouping */
  timezone: string;
  /** Timezone from Toggl profile, has priority over manual timezone setting */
  togglProfileTimezone: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  groupTogglTracks: true, // По умолчанию группировка включена
  togglWorkspaceId: '', // По умолчанию пустой Workspace ID
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  togglProfileTimezone: '',
};

const STORAGE_KEY = 'time-tracker-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем настройки из localStorage при инициализации
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
    onUpdate?: () => void
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (onUpdate) {
      onUpdate();
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded
  };
};
