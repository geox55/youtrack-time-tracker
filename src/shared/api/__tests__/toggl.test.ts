import { togglApi } from '../toggl';
import { axiosInstance } from '../axiosInstance';
import { type MockedFunction } from 'vitest';

vi.mock('../axiosInstance', () => ({
  axiosInstance: vi.fn(),
}));

const mockAxios = axiosInstance as MockedFunction<typeof axiosInstance>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('togglApi.getProfile', () => {
  it('calls correct endpoint with auth header', async () => {
    mockAxios.mockResolvedValue({ data: { timezone: 'UTC' } } as any);
    const result = await togglApi.getProfile('my-token');
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/toggl/me',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic '),
        }),
      }),
    );
    expect(result).toEqual({ timezone: 'UTC' });
  });
});

describe('togglApi.getTimeEntries', () => {
  it('passes start_date and end_date query params', async () => {
    mockAxios.mockResolvedValue({ data: [{ id: 1 }] } as any);
    const result = await togglApi.getTimeEntries('token', '2025-01-06', '2025-01-13');
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('start_date=2025-01-06'),
      }),
    );
    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('togglApi.updateTimeEntry', () => {
  it('sends PUT with tags', async () => {
    mockAxios.mockResolvedValue({ data: {} } as any);
    await togglApi.updateTimeEntry('token', 'ws-1', 42, ['youtrack']);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/toggl/workspaces/ws-1/time_entries/42',
        method: 'PUT',
        data: { tags: ['youtrack'] },
      }),
    );
  });
});
