'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Save, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [saved, setSaved] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Settings saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user?.full_name || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-text-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-text-secondary"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Dark Mode</p>
                  <p className="text-sm text-text-secondary">
                    {darkMode ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition ${
                    darkMode ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="font-medium text-text-primary mb-3">Notifications</p>
                <label className="flex items-center gap-3 mb-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Email notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Upload notifications</span>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="bg-white rounded-lg border border-border p-6">
            <h3 className="font-bold text-text-primary mb-3">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-text-tertiary">Member Since</p>
                <p className="font-medium text-text-primary">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary">Role</p>
                <p className="font-medium text-text-primary capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-text-tertiary">Status</p>
                <p className="font-medium text-green-600 capitalize">{user?.status}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-900 mb-3">Danger Zone</h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
