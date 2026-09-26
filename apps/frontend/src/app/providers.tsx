'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useDarkModeInit } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  useDarkModeInit();
  
  return (
    <SessionProvider>
      <KeyboardShortcutsProvider>
        {children}
      </KeyboardShortcutsProvider>
    </SessionProvider>
  );
}