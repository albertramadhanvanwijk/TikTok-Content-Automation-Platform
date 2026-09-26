jest.mock('@/services/api', () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
import { apiClient } from '@/services/api';
import { useAIStore } from '../aiStore';
const mocked = apiClient as jest.Mocked<typeof apiClient>;

describe('aiStore', () => {
  beforeEach(() => {
    mocked.post.mockReset();
    mocked.get.mockReset();
    useAIStore.setState({ lastResult: null, error: null, isGenerating: false, mock: false, lastNotionSetup: null, lastDesign: null, lastHashtags: [] } as any);
  });
  it('generateCarousel sets mock flag when backend returns mock:true', async () => {
    mocked.post.mockResolvedValueOnce({ data: { carousel: { id: 'c1', title: 'T' }, slides: [{ id: 's1' }], design: { color_scheme: ['#000'], fonts: ['Inter'], layout: 'centered' }, hashtags: ['#a'], mock: true } } as any);
    await useAIStore.getState().generateCarousel('Trading Psychology', {});
    expect(useAIStore.getState().mock).toBe(true);
    expect(useAIStore.getState().lastResult?.carousel.id).toBe('c1');
  });
  it('enhance requires instruction', async () => {
    mocked.post.mockRejectedValueOnce({ response: { data: { error: { message: 'instruction is required' } } } } as any);
    await expect(useAIStore.getState().enhance('c1', '')).rejects.toBeDefined();
  });
  it('suggestDesign stores design from GET', async () => {
    mocked.get.mockResolvedValueOnce({ data: { design: { color_scheme: ['#030712'], fonts: ['Inter'], layout: 'centered' } } } as any);
    const design = await useAIStore.getState().suggestDesign('Trading', 'professional');
    expect(design.color_scheme).toContain('#030712');
  });
});
