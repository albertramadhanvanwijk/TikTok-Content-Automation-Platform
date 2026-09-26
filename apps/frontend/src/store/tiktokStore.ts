'use client';

import { create } from 'zustand';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { UploadJob } from '@/types';

interface TikTokAccount {
  id: string;
  username: string;
  display_name?: string;
  connected_at: string;
  status: string;
}

interface TikTokState {
  accounts: TikTokAccount[];
  jobs: UploadJob[];
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  fetchAccounts(): Promise<void>;
  getAuthUrl(redirectUri: string): Promise<string>;
  connectAccount(code: string, redirectUri: string): Promise<void>;
  disconnectAccount(id: string): Promise<void>;
  createUploadJob(carouselId: string, accountId: string, scheduledAt?: string): Promise<UploadJob>;
  fetchJobs(carouselId?: string): Promise<void>;
  fetchJobStatus(id: string): Promise<UploadJob>;
  processJob(id: string): Promise<void>;
  clearError(): void;
}

export const useTikTokStore = create<TikTokState>((set, get) => ({
  accounts: [],
  jobs: [],
  isLoading: false,
  isConnecting: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.TIKTOK.ACCOUNTS);
      const accounts = res.data?.accounts || res.data || [];
      set({ accounts: Array.isArray(accounts) ? accounts : [], isLoading: false });
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to fetch TikTok accounts';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  getAuthUrl: async (redirectUri) => {
    const res: any = await apiClient.get(`${API_ENDPOINTS.TIKTOK.AUTH_URL}?redirect_uri=${encodeURIComponent(redirectUri)}`);
    const url = res.data?.auth_url || res.data?.url || res.data?.authUrl || '';
    return url as string;
  },

  connectAccount: async (code, redirectUri) => {
    set({ isConnecting: true, error: null });
    try {
      await apiClient.post(API_ENDPOINTS.TIKTOK.CONNECT, { code, redirect_uri: redirectUri });
      set({ isConnecting: false });
      await get().fetchAccounts();
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to connect';
      set({ isConnecting: false, error: msg });
      throw e;
    }
  },

  disconnectAccount: async (id) => {
    await apiClient.post(API_ENDPOINTS.TIKTOK.DISCONNECT(id));
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
  },

  createUploadJob: async (carouselId, accountId, scheduledAt) => {
    if (!carouselId || !accountId) throw new Error('carousel_id and tiktok_account_id required');
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (d <= new Date()) throw new Error('scheduled_at must be in the future');
    }
    const res: any = await apiClient.post(API_ENDPOINTS.TIKTOK.UPLOAD_JOBS, {
      carousel_id: carouselId,
      tiktok_account_id: accountId,
      video_file_path: 'placeholder.mp4',
      title: 'Carousel upload',
      scheduled_at: scheduledAt,
    });
    const job: UploadJob = res.data?.job || res.data;
    set((s) => ({ jobs: [job, ...s.jobs] }));
    return job;
  },

  fetchJobs: async (carouselId) => {
    const url = carouselId ? API_ENDPOINTS.TIKTOK.CAROUSEL_JOBS(carouselId) : API_ENDPOINTS.TIKTOK.UPLOAD_JOBS;
    const res: any = await apiClient.get(url);
    const jobs = res.data?.jobs || res.data?.upload_jobs || res.data || [];
    set({ jobs: Array.isArray(jobs) ? jobs : [] });
  },

  fetchJobStatus: async (id) => {
    const res: any = await apiClient.get(API_ENDPOINTS.TIKTOK.JOB_STATUS(id));
    const job: UploadJob = res.data?.job || res.data;
    return job;
  },

  processJob: async (id) => {
    const res: any = await apiClient.post(API_ENDPOINTS.TIKTOK.PROCESS_JOB(id));
    const job: UploadJob = res.data?.job || res.data;
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? job : j)) }));
    return job as any;
  },

  clearError: () => set({ error: null }),
}));
