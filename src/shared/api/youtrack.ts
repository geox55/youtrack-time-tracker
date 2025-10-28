import { WorkItem } from '../model/types';
import { axiosInstance } from './axiosInstance';

const BASE_URL = `/api/youtrack`;
const TIME_TRACKING_WORK_ITEMS_URL = 'timeTracking/workItems';
const USERS_ME_URL = '/users/me';

const request = async (endpoint: string, token: string, options: any = {}): Promise<any> => {
  const response = await axiosInstance({
    ...options,
    url: `${BASE_URL}${endpoint}`,
    method: options.method || 'GET',
    data: options.body,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...options.headers
    }
  });

  return response.data;
}

export const youtrackApi = {
  async getWorkItems(token: string, issueId: string, skip: number = 0, pageSize: number = 100): Promise<WorkItem[]> {
    const response = await request(
      `/issues/${issueId}/${TIME_TRACKING_WORK_ITEMS_URL}?fields=id,date,duration(minutes),text,author(id,login,name)&$skip=${skip}&$top=${pageSize}`,
      token
    );

    return Array.isArray(response) ? response : [];
  },

  async createWorkItem(token: string, issueId: string, workItem: WorkItem): Promise<string> {
    const response = await request(
      `/issues/${issueId}/${TIME_TRACKING_WORK_ITEMS_URL}`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(workItem),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.id;
  },

  async deleteWorkItem(token: string, issueId: string, workItemId: string): Promise<void> {
    await request(
      `/issues/${issueId}/${TIME_TRACKING_WORK_ITEMS_URL}/${workItemId}`,
      token,
      { method: 'DELETE' }
    );
  },

  async getMe(token: string): Promise<{ id: string; login: string; name: string }> {
    return request(`${USERS_ME_URL}?fields=id,login,name`, token);
  }
};
