'use client';

import { useUIStore } from '@/store/uiStore';
import { Menu, Moon, Sun } from 'lucide-react';

export default function Header() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useUIStore();

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-secondary rounded-lg transition"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <Menu size={20} className="text-text-secondary" />
      </button>

      <button
        onClick={toggleDarkMode}
        className="p-2 hover:bg-secondary rounded-lg transition"
        title={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? (
          <Sun size={20} className="text-text-secondary" />
        ) : (
          <Moon size={20} className="text-text-secondary" />
        )}
      </button>
    </header>
  );
}
