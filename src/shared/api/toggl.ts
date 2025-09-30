import { TimeEntry } from '../model/types';
import { axiosInstance } from './axiosInstance';

export const togglApi = {
  async request(endpoint: string, token: string, options: any = {}): Promise<any> {
    const response = await axiosInstance({
      url: `/api/toggl${endpoint}`,
      method: options.method || 'GET',
      data: options.body,
      headers: {
        'Authorization': `Basic ${btoa(token + ':api_token')}`,
        ...options.headers
      },
      ...options
    });

    return response.data;
  },

  async getTimeEntries(token: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    return this.request(
      `/me/time_entries?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  }
};
