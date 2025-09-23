import { TimeEntry } from '../model/types';

export const togglApi = {
  async request(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`https://api.track.toggl.com/api/v9${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${btoa(token + ':api_token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) throw new Error(`Toggl API error: ${response.statusText}`);
    return response.json();
  },

  async getTimeEntries(token: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    return this.request(
      `/me/time_entries?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  }
};
