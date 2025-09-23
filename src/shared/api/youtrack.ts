import { WorkItem } from '../model/types';

export const youtrackApi = {
  async request(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`/api/youtrack${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) throw new Error(`YouTrack API error: ${response.statusText}`);
    return response.json();
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
