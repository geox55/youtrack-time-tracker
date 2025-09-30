import { WorkItem } from '../model/types';
import { axiosInstance } from './axiosInstance';

export const youtrackApi = {
  async request(endpoint: string, token: string, options: any = {}): Promise<any> {
    const response = await axiosInstance({
      url: `/api/youtrack${endpoint}`,
      method: options.method || 'GET',
      data: options.body,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    return response.data;
  },

  async getWorkItems(token: string, issueId: string, skip: number = 0, pageSize: number = 100): Promise<WorkItem[]> {
    return this.request(
      `/issues/${issueId}/timeTracking/workItems?fields=id,date,duration(minutes),text,author(id,login,name)&$skip=${skip}&$top=${pageSize}`,
      token
    );
  },

  async createWorkItem(token: string, issueId: string, workItem: WorkItem): Promise<void> {
    await this.request(
      `/issues/${issueId}/timeTracking/workItems`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(workItem)
      }
    );
  },

  async getMe(token: string): Promise<{ id: string; login: string; name: string }> {
    return this.request('/users/me?fields=id,login,name', token);
  }
};
