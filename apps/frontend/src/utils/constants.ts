export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  CONTENT: {
    CAROUSELS: '/content/carousels',
    TEMPLATES: '/content/templates',
    SLIDES: '/content/slides',
  },
  AI: {
    GENERATE_CAROUSEL: '/ai/generate-carousel',
    NOTION_SETUP: '/ai/notion/setup',
    NOTION_SYNC: '/ai/notion/sync',
    ENHANCE: (id: string) => `/ai/carousels/${id}/enhance`,
    DESIGN_SUGGESTION: '/ai/design-suggestion',
    GENERATE_HASHTAGS: '/ai/generate-hashtags',
  },
  TIKTOK: {
    AUTH_URL: '/tiktok/auth-url',
    CONNECT: '/tiktok/connect',
    ACCOUNTS: '/tiktok/accounts',
    DISCONNECT: (id: string) => `/tiktok/accounts/${id}/disconnect`,
    UPLOAD_JOBS: '/tiktok/upload-jobs',
    CAROUSEL_JOBS: (id: string) => `/tiktok/carousels/${id}/upload-jobs`,
    JOB_STATUS: (id: string) => `/tiktok/upload-jobs/${id}`,
    PROCESS_JOB: (id: string) => `/tiktok/upload-jobs/${id}/process`,
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    CAROUSEL: '/analytics/carousels',
    TRENDS: '/analytics/carousels/:id/trends',
    TOP_CONTENT: '/analytics/top-content',
  },
};

export const JWT_COOKIE_NAME = process.env.NEXT_PUBLIC_JWT_COOKIE_NAME || 'accessToken';
export const JWT_COOKIE_MAX_AGE = parseInt(process.env.NEXT_PUBLIC_JWT_COOKIE_MAX_AGE || '604800');
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds
