'use client';

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration ?? 5000);

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));

// Convenience functions
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'success', title, message, ...options }),

  error: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'error', title, message, duration: 7000, ...options }),

  warning: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, ...options }),

  info: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'info', title, message, ...options }),
};