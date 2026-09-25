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
  TIKTOK: {
    CONNECT: '/tiktok/connect',
    ACCOUNTS: '/tiktok/accounts',
    UPLOAD_JOBS: '/tiktok/upload-jobs',
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
