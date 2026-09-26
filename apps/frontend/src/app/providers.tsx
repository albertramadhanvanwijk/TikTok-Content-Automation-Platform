'use client';

import { ReactNode } from 'react';
import { useDarkModeInit } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  useDarkModeInit();

  return (
    <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
  );
}