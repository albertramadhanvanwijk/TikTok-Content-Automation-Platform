'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useContentStore } from '@/store/contentStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { toast } from '@/store/toastStore';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

function getShortcuts(
  toggleSidebar: () => void,
  logout: () => Promise<void>,
  toggleDarkMode: () => void
): Shortcut[] {
  return [
    {
      key: 'n',
      ctrlKey: true,
      action: () => window.location.href = '/content/new',
      description: 'Create new carousel',
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(f => f.requestSubmit());
      },
      description: 'Save current form',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'b',
      ctrlKey: true,
      action: toggleSidebar,
      description: 'Toggle sidebar',
    },
    {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      action: toggleDarkMode,
      description: 'Toggle dark mode',
    },
    {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      action: () => logout(),
      description: 'Logout',
    },
    {
      key: '/',
      action: () => {
        if (document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
        }
      },
      description: 'Focus search (when not in input)',
    },
    {
      key: 'Escape',
      action: () => {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(m => m.remove());
      },
      description: 'Close modals',
    },
  ];
}

export function useKeyboardShortcuts() {
  const { toggleSidebar } = useUIStore();
  const { logout } = useAuthStore();
  const { toggleDarkMode } = useUIStore();

  const shortcuts = useMemo(
    () => getShortcuts(toggleSidebar, logout, toggleDarkMode),
    [toggleSidebar, logout, toggleDarkMode]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isInput && e.key !== 'Escape') return;

    const matching = shortcuts.find(s => 
      s.key.toLowerCase() === e.key.toLowerCase() &&
      !!s.ctrlKey === e.ctrlKey &&
      !!s.shiftKey === e.shiftKey &&
      !!s.altKey === e.altKey &&
      !!s.metaKey === e.metaKey
    );

    if (matching) {
      e.preventDefault();
      matching.action();
      toast.info(matching.description, '', { duration: 1500 });
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}