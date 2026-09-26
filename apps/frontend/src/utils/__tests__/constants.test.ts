import { API_ENDPOINTS } from '../constants';

describe('API_ENDPOINTS', () => {
  it('exposes AI endpoints', () => {
    expect(API_ENDPOINTS.AI.GENERATE_CAROUSEL).toBe('/ai/generate-carousel');
    expect(API_ENDPOINTS.AI.NOTION_SETUP).toBe('/ai/notion/setup');
    expect(API_ENDPOINTS.AI.NOTION_SYNC).toBe('/ai/notion/sync');
    expect(API_ENDPOINTS.AI.ENHANCE('abc')).toBe('/ai/carousels/abc/enhance');
    expect(API_ENDPOINTS.AI.DESIGN_SUGGESTION).toBe('/ai/design-suggestion');
    expect(API_ENDPOINTS.AI.GENERATE_HASHTAGS).toBe('/ai/generate-hashtags');
  });

  it('exposes TikTok endpoints complete', () => {
    expect(API_ENDPOINTS.TIKTOK.AUTH_URL).toBe('/tiktok/auth-url');
    expect(API_ENDPOINTS.TIKTOK.DISCONNECT('x')).toBe('/tiktok/accounts/x/disconnect');
    expect(API_ENDPOINTS.TIKTOK.CAROUSEL_JOBS('c1')).toBe('/tiktok/carousels/c1/upload-jobs');
    expect(API_ENDPOINTS.TIKTOK.JOB_STATUS('j1')).toBe('/tiktok/upload-jobs/j1');
    expect(API_ENDPOINTS.TIKTOK.PROCESS_JOB('j1')).toBe('/tiktok/upload-jobs/j1/process');
  });
});
