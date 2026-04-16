import { youtrackApi } from '../youtrack';
import { axiosInstance } from '../axiosInstance';
import { type MockedFunction } from 'vitest';

vi.mock('../axiosInstance', () => ({
  axiosInstance: vi.fn(),
}));

const mockAxios = axiosInstance as MockedFunction<typeof axiosInstance>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('youtrackApi.getWorkItems', () => {
  it('returns array from response', async () => {
    const items = [{ date: 123, duration: { minutes: 30 }, text: 'task' }];
    mockAxios.mockResolvedValue({ data: items } as any);
    const result = await youtrackApi.getWorkItems('token', 'DEV-1');
    expect(result).toEqual(items);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/issues/DEV-1/timeTracking/workItems'),
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      }),
    );
  });

  it('returns empty array for non-array response', async () => {
    mockAxios.mockResolvedValue({ data: null } as any);
    const result = await youtrackApi.getWorkItems('token', 'DEV-1');
    expect(result).toEqual([]);
  });

  it('passes skip and pageSize params', async () => {
    mockAxios.mockResolvedValue({ data: [] } as any);
    await youtrackApi.getWorkItems('token', 'DEV-1', 100, 500);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('$skip=100'),
      }),
    );
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('$top=500'),
      }),
    );
  });
});

describe('youtrackApi.createWorkItem', () => {
  it('sends POST and returns work item id', async () => {
    mockAxios.mockResolvedValue({ data: { id: 'wi-123' } } as any);
    const workItem = { date: 123, duration: { minutes: 60 }, text: 'task' };
    const result = await youtrackApi.createWorkItem('token', 'DEV-1', workItem);
    expect(result).toBe('wi-123');
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: expect.stringContaining('/issues/DEV-1/timeTracking/workItems'),
      }),
    );
  });
});

describe('youtrackApi.deleteWorkItem', () => {
  it('sends DELETE request', async () => {
    mockAxios.mockResolvedValue({ data: {} } as any);
    await youtrackApi.deleteWorkItem('token', 'DEV-1', 'wi-123');
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: expect.stringContaining('/issues/DEV-1/timeTracking/workItems/wi-123'),
      }),
    );
  });
});

describe('youtrackApi.getMe', () => {
  it('returns user data', async () => {
    const user = { id: 'u1', login: 'test', name: 'Test' };
    mockAxios.mockResolvedValue({ data: user } as any);
    const result = await youtrackApi.getMe('token');
    expect(result).toEqual(user);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/users/me'),
      }),
    );
  });
});
