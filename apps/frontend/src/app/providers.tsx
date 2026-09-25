'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useDarkModeInit } from '@/store/uiStore';

export function Providers({ children }: { children: ReactNode }) {
  useDarkModeInit();
  
  return <SessionProvider>{children}</SessionProvider>;
}