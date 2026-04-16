const SETTINGS_STORAGE_KEY = 'time-tracker-settings';

type TimezoneSource = 'toggl_profile' | 'settings' | 'browser';

interface StoredSettingsTimezone {
  timezone?: string;
  togglProfileTimezone?: string;
}

const readStoredTimezoneSettings = (): StoredSettingsTimezone => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as StoredSettingsTimezone;
    }
  } catch {
    // Ignore storage access and JSON parse errors.
  }
  return {};
};

export const resolveUserTimezone = (): { timezone: string; source: TimezoneSource } => {
  const settings = readStoredTimezoneSettings();
  if (typeof settings.togglProfileTimezone === 'string' && settings.togglProfileTimezone.trim() !== '') {
    return { timezone: settings.togglProfileTimezone.trim(), source: 'toggl_profile' };
  }
  if (typeof settings.timezone === 'string' && settings.timezone.trim() !== '') {
    return { timezone: settings.timezone.trim(), source: 'settings' };
  }
  return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, source: 'browser' };
};
