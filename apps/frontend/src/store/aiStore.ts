'use client';

import { create } from 'zustand';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { GenerateResult, NotionSetup, Design, Slide } from '@/types';

interface AIState {
  isGenerating: boolean;
  isSyncing: boolean;
  error: string | null;
  lastResult: GenerateResult | null;
  lastNotionSetup: NotionSetup | null;
  mock: boolean;
  lastDesign: Design | null;
  lastHashtags: string[];
  generateCarousel(
    topic: string,
    opts: { style?: string; slides_count?: number; templateId?: string }
  ): Promise<GenerateResult>;
  setupNotion(dbId: string): Promise<NotionSetup>;
  syncNotion(dbId: string, templateId?: string): Promise<any[]>;
  enhance(carouselId: string, instruction: string): Promise<Slide[]>;
  suggestDesign(topic: string, style?: string): Promise<Design>;
  generateHashtags(title: string, topic: string): Promise<string[]>;
  clearError(): void;
}

export const useAIStore = create<AIState>((set) => ({
  isGenerating: false,
  isSyncing: false,
  error: null,
  lastResult: null,
  lastNotionSetup: null,
  mock: false,
  lastDesign: null,
  lastHashtags: [],

  generateCarousel: async (topic, opts) => {
    set({ isGenerating: true, error: null });
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.AI.GENERATE_CAROUSEL, {
        topic,
        style: opts.style,
        slides_count: opts.slides_count,
        template_id: opts.templateId,
      });
      // ApiResponse wrapper: ApiResponse.data is the payload {carousel, slides, design, hashtags, mock}
      const data: GenerateResult = res.data as GenerateResult;
      // Also support direct unwrapped mock shape in tests where apiClient mocked to return {data: {...}}
      set({ lastResult: data, mock: !!(data as any).mock, isGenerating: false });
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to generate carousel';
      set({ error: msg, isGenerating: false });
      throw e;
    }
  },

  setupNotion: async (dbId) => {
    set({ isSyncing: true, error: null });
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.AI.NOTION_SETUP, {
        notion_database_id: dbId,
      });
      const data: NotionSetup = res.data as NotionSetup;
      set({ lastNotionSetup: data, isSyncing: false });
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to setup Notion';
      set({ error: msg, isSyncing: false });
      throw e;
    }
  },

  syncNotion: async (dbId, templateId) => {
    set({ isSyncing: true, error: null });
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.AI.NOTION_SYNC, {
        notion_database_id: dbId,
        template_id: templateId,
      });
      const payload: any = res.data;
      const carousels: any[] = payload?.carousels || payload?.carousels_generated !== undefined ? payload.carousels || [] : Array.isArray(payload) ? payload : payload?.data?.carousels || [];
      // Fallback: if payload has carousels key, return it; if payload is array, return directly
      const result = Array.isArray(carousels) && carousels.length > 0 ? carousels : payload?.carousels || (Array.isArray(payload) ? payload : []);
      set({ isSyncing: false });
      return result as any[];
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to sync Notion';
      set({ error: msg, isSyncing: false });
      throw e;
    }
  },

  enhance: async (carouselId, instruction) => {
    if (!instruction || instruction.trim().length === 0) {
      throw new Error('instruction is required');
    }
    set({ isGenerating: true, error: null });
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.AI.ENHANCE(carouselId), {
        instruction,
      });
      const payload: any = res.data;
      const slides: Slide[] = payload?.slides || payload || [];
      set({ isGenerating: false });
      return slides;
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to enhance slides';
      set({ error: msg, isGenerating: false });
      throw e;
    }
  },

  suggestDesign: async (topic, style) => {
    const res: any = await apiClient.get(
      `${API_ENDPOINTS.AI.DESIGN_SUGGESTION}?topic=${encodeURIComponent(topic)}&style=${encodeURIComponent(style || 'professional')}`
    );
    const payload: any = res.data;
    const design: Design = payload?.design || payload;
    set({ lastDesign: design });
    return design;
  },

  generateHashtags: async (title, topic) => {
    const res: any = await apiClient.get(
      `${API_ENDPOINTS.AI.GENERATE_HASHTAGS}?title=${encodeURIComponent(title)}&topic=${encodeURIComponent(topic)}`
    );
    const payload: any = res.data;
    const hashtags: string[] = payload?.hashtags || (Array.isArray(payload) ? payload : []);
    set({ lastHashtags: hashtags });
    return hashtags;
  },

  clearError: () => set({ error: null }),
}));
