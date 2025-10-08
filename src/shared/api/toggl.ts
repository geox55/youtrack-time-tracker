import { TimeEntry } from '../model/types';
import { axiosInstance } from './axiosInstance';

// const BASE_URL = `https://api.track.toggl.com/api/v9`;
const BASE_URL = `/api/toggl`;

const request = async (endpoint: string, token: string, options: any = {}): Promise<any> => {
  const response = await axiosInstance({
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Basic ${btoa(token + ':api_token')}`,
      ...options.headers
    },
    ...options
  });
  return response.data;
}

export const togglApi = {
  async getTimeEntries(token: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    return request(
      `/me/time_entries?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  },
};
