'use client';

import { create } from 'zustand';
import { useEffect } from 'react';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  initializeDarkMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  darkMode: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    set({ darkMode: newDarkMode });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  initializeDarkMode: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const darkMode = saved ? JSON.parse(saved) : prefersDark;
      
      set({ darkMode });
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  },
}));

// Hook to initialize dark mode on app load
export function useDarkModeInit() {
  const initializeDarkMode = useUIStore((state) => state.initializeDarkMode);
  
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);
}