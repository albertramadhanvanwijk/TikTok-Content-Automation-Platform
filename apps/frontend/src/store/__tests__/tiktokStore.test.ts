jest.mock('@/services/api', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));
import { apiClient } from '@/services/api';
import { useTikTokStore } from '../tiktokStore';
const m = apiClient as jest.Mocked<typeof apiClient>;

describe('tiktokStore', () => {
  beforeEach(() => {
    m.get.mockReset();
    m.post.mockReset();
    useTikTokStore.setState({ accounts: [], jobs: [], isLoading: false, isConnecting: false, error: null } as any);
  });
  it('fetchAccounts populates accounts', async () => {
    m.get.mockResolvedValueOnce({ data: { accounts: [{ id: 'a1', username: 'u' }] } } as any);
    await useTikTokStore.getState().fetchAccounts();
    expect(useTikTokStore.getState().accounts.length).toBe(1);
  });
  it('createUploadJob validates', async () => {
    await expect(useTikTokStore.getState().createUploadJob('', 'a1')).rejects.toBeDefined();
    await expect(useTikTokStore.getState().createUploadJob('c1', '')).rejects.toBeDefined();
  });
  it('createUploadJob rejects scheduled_at in the past', async () => {
    const past = new Date(Date.now() - 60000).toISOString();
    await expect(useTikTokStore.getState().createUploadJob('c1', 'a1', past)).rejects.toThrow(/future/i);
  });
  it('getAuthUrl returns url', async () => {
    m.get.mockResolvedValueOnce({ data: { auth_url: 'http://localhost:3001/tiktok/callback?mock=1', state: 's1' } } as any);
    const url = await useTikTokStore.getState().getAuthUrl('http://localhost:3001/tiktok/callback');
    expect(url).toContain('tiktok/callback');
  });
});
