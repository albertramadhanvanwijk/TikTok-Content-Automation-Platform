'use client';

import { create } from 'zustand';
import { Carousel, Slide, Template, UploadJob } from '@/types';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

interface ContentState {
  // State
  carousels: Carousel[];
  currentCarousel: Carousel | null;
  slides: Slide[];
  templates: Template[];
  uploadJobs: UploadJob[];
  
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };

  // Carousel actions
  fetchCarousels: (status?: string, limit?: number, offset?: number) => Promise<void>;
  fetchCarouselById: (id: string) => Promise<void>;
  createCarousel: (data: Partial<Carousel>) => Promise<Carousel>;
  updateCarousel: (id: string, data: Partial<Carousel>) => Promise<void>;
  publishCarousel: (id: string) => Promise<void>;
  scheduleCarousel: (id: string, scheduledAt: string) => Promise<void>;
  archiveCarousel: (id: string) => Promise<void>;
  deleteCarousel: (id: string) => Promise<void>;

  // Slide actions
  fetchSlides: (carouselId: string) => Promise<void>;
  createSlide: (carouselId: string, data: Partial<Slide>) => Promise<Slide>;
  updateSlide: (slideId: string, data: Partial<Slide>) => Promise<void>;
  deleteSlide: (slideId: string) => Promise<void>;
  reorderSlides: (carouselId: string, orderedIds: string[]) => Promise<void>;

  // Template actions
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;

  // Upload actions
  createUploadJob: (carouselId: string, accountId: string) => Promise<UploadJob>;
  fetchUploadJobs: (carouselId: string) => Promise<void>;

  // Utils
  setCurrentCarousel: (carousel: Carousel | null) => void;
  clearError: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  carousels: [],
  currentCarousel: null,
  slides: [],
  templates: [],
  uploadJobs: [],
  isLoading: false,
  error: null,
  pagination: { total: 0, limit: 20, offset: 0 },

  // Carousel actions
  fetchCarousels: async (status, limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const url = `${API_ENDPOINTS.CONTENT.CAROUSELS}?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ''}`;
      const response = await apiClient.get<any>(url);
      if (response.data) {
        set({
          carousels: response.data.items || response.data,
          pagination: response.data.pagination || { total: 0, limit, offset },
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch carousels' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCarouselById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ carousel: Carousel }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}`);
      if (response.data?.carousel) {
        set({ currentCarousel: response.data.carousel });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createCarousel: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ carousel: Carousel }>(API_ENDPOINTS.CONTENT.CAROUSELS, data);
      const newCarousel = response.data?.carousel;
      if (newCarousel) {
        set((state) => ({
          carousels: [newCarousel, ...state.carousels],
          currentCarousel: newCarousel,
        }));
        return newCarousel;
      }
      throw new Error('No carousel in response');
    } catch (error: any) {
      set({ error: error.message || 'Failed to create carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCarousel: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<{ carousel: Carousel }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}`, data);
      const updated = response.data?.carousel;
      if (updated) {
        set((state) => ({
          carousels: state.carousels.map((c) => (c.id === id ? updated : c)),
          currentCarousel: state.currentCarousel?.id === id ? updated : state.currentCarousel,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  publishCarousel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ carousel: Carousel }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}/publish`);
      const published = response.data?.carousel;
      if (published) {
        set((state) => ({
          carousels: state.carousels.map((c) => (c.id === id ? published : c)),
          currentCarousel: state.currentCarousel?.id === id ? published : state.currentCarousel,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to publish carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  scheduleCarousel: async (id, scheduledAt) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ carousel: Carousel }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}/schedule`, {
        scheduled_at: scheduledAt,
      });
      const scheduled = response.data?.carousel;
      if (scheduled) {
        set((state) => ({
          carousels: state.carousels.map((c) => (c.id === id ? scheduled : c)),
          currentCarousel: state.currentCarousel?.id === id ? scheduled : state.currentCarousel,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to schedule carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  archiveCarousel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ carousel: Carousel }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}/archive`);
      const archived = response.data?.carousel;
      if (archived) {
        set((state) => ({
          carousels: state.carousels.filter((c) => c.id !== id),
          currentCarousel: state.currentCarousel?.id === id ? null : state.currentCarousel,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to archive carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCarousel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${id}`);
      set((state) => ({
        carousels: state.carousels.filter((c) => c.id !== id),
        currentCarousel: state.currentCarousel?.id === id ? null : state.currentCarousel,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete carousel' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Slide actions
  fetchSlides: async (carouselId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ slides: Slide[] }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${carouselId}/slides`);
      if (response.data?.slides) {
        set({ slides: response.data.slides });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch slides' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createSlide: async (carouselId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ slide: Slide }>(`${API_ENDPOINTS.CONTENT.CAROUSELS}/${carouselId}/slides`, data);
      const newSlide = response.data?.slide;
      if (newSlide) {
        set((state) => ({
          slides: [...state.slides, newSlide],
        }));
        return newSlide;
      }
      throw new Error('No slide in response');
    } catch (error: any) {
      set({ error: error.message || 'Failed to create slide' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSlide: async (slideId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<{ slide: Slide }>(`${API_ENDPOINTS.CONTENT.SLIDES}/${slideId}`, data);
      const updatedSlide = response.data?.slide;
      if (updatedSlide) {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === slideId ? updatedSlide : s)),
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update slide' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSlide: async (slideId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`${API_ENDPOINTS.CONTENT.SLIDES}/${slideId}`);
      set((state) => ({
        slides: state.slides.filter((s) => s.id !== slideId),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete slide' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reorderSlides: async (carouselId, orderedIds) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<{ slides: Slide[] }>(
        `${API_ENDPOINTS.CONTENT.CAROUSELS}/${carouselId}/slides/reorder`,
        { orderedIds }
      );
      const slides = response.data?.slides;
      if (slides) set({ slides });
    } catch (error: any) {
      set({ error: error.message || 'Failed to reorder slides' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Template actions
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ templates: Template[] }>(API_ENDPOINTS.CONTENT.TEMPLATES);
      if (response.data?.templates) {
        set({ templates: response.data.templates });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch templates' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createTemplate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ template: Template }>(API_ENDPOINTS.CONTENT.TEMPLATES, data);
      const newTemplate = response.data?.template;
      if (newTemplate) {
        set((state) => ({
          templates: [newTemplate, ...state.templates],
        }));
        return newTemplate;
      }
      throw new Error('No template in response');
    } catch (error: any) {
      set({ error: error.message || 'Failed to create template' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`${API_ENDPOINTS.CONTENT.TEMPLATES}/${id}`);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete template' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Upload actions (legacy — delegate to TikTok flow; keep for backward compat, include required fields)
  createUploadJob: async (carouselId, accountId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ job: UploadJob }>(API_ENDPOINTS.TIKTOK.UPLOAD_JOBS, {
        carousel_id: carouselId,
        tiktok_account_id: accountId,
        video_file_path: 'placeholder.mp4',
        title: 'Carousel upload',
      });
      const newJob = response.data?.job;
      if (newJob) {
        set((state) => ({
          uploadJobs: [newJob, ...state.uploadJobs],
        }));
        return newJob;
      }
      throw new Error('No upload job in response');
    } catch (error: any) {
      set({ error: error.message || 'Failed to create upload job' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUploadJobs: async (carouselId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ jobs: UploadJob[] }>(`${API_ENDPOINTS.TIKTOK.UPLOAD_JOBS}?carousel_id=${carouselId}`);
      if (response.data?.jobs) {
        set({ uploadJobs: response.data.jobs });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch upload jobs' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Utils
  setCurrentCarousel: (carousel) => set({ currentCarousel: carousel }),
  clearError: () => set({ error: null }),
}));
