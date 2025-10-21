import { useState, useEffect } from 'react';

interface AppSettings {
  groupTogglTracks: boolean;
  youtrackBaseUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  groupTogglTracks: true, // По умолчанию группировка включена
  youtrackBaseUrl: '', // По умолчанию пустой URL
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
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
