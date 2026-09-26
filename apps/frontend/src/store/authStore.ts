'use client';

import { create } from 'zustand';
import { User, AuthResponse } from '@/types';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  register: (email: string, username: string, password: string, fullName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { full_name: string; email: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  register: async (email, username, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        username,
        password,
        full_name: fullName,
      });

      // response.data is { user: ... } directly (ApiResponse wraps it); cast via any to handle both shapes
      const regUser = (response.data as any)?.user ?? (response as any).data?.user;
      if (regUser) {
        set({ user: regUser, isAuthenticated: true });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const loginUser = (response.data as any)?.user ?? (response as any).data?.user;
      if (loginUser) {
        set({ user: loginUser, isAuthenticated: true });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      set({ error: errorMessage, isAuthenticated: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiClient.get<{ user: User }>(API_ENDPOINTS.AUTH.PROFILE);
      const profileUser = (response.data as any)?.user ?? (response as any).data?.user ?? response.user;
      if (profileUser) {
        set({ user: profileUser, isAuthenticated: true });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to fetch profile';
      set({ error: errorMessage, isAuthenticated: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiClient.put<{ user: User }>(API_ENDPOINTS.AUTH.PROFILE, data);
      const updatedUser = (response.data as any)?.user ?? (response as any).data?.user ?? response.user;
      if (updatedUser) {
        set({ user: updatedUser });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update profile';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to change password';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));