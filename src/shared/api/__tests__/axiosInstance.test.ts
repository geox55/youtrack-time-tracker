import { axiosInstance } from '../axiosInstance';

describe('axiosInstance', () => {
  it('has Content-Type application/json header', () => {
    expect(axiosInstance.defaults.headers['Content-Type']).toBe('application/json');
  });
});
