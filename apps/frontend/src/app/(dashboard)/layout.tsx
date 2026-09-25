'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, fetchProfile } = useAuthStore();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  useEffect(() => {
    // Fetch user profile on mount
    if (!user) {
      fetchProfile().catch(() => {
        router.push('/login');
      });
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
