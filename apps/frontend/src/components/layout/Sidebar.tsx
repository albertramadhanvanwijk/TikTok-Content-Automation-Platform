'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import {
  BarChart3,
  FileText,
  Calendar,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } fixed left-0 h-full bg-white border-r border-border transition-all duration-200 flex flex-col`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className={`font-bold text-primary ${sidebarOpen ? 'text-lg' : 'text-center'}`}>
          {sidebarOpen ? '🎬 TikTok Carousel' : '🎬'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-secondary'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Account Section */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {user?.full_name}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 transition ${
                    showAccountMenu ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>

          {showAccountMenu && sidebarOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-border rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
