'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Save, LogOut, User, Mail, Lock, Bell, Shield } from 'lucide-react';
import { toast } from '@/store/toastStore';

export default function SettingsPage() {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated', 'Your changes have been saved');
      setIsEditing(false);
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (isSaving) return;
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match', 'Please make sure both passwords are identical');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Password too short', 'Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(passwordData.current_password, passwordData.new_password);
      toast.success('Password changed', 'Your password has been updated');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error('Change failed', err.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-4 sticky top-24">
            {/* User Avatar */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                {user?.full_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary truncate">{user?.full_name || user?.username}</p>
                <p className="text-sm text-text-secondary truncate">{user?.email}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-border">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Profile Information</h2>
                {isEditing ? (
                  <button
                    onClick={() => { setFormData({ full_name: user?.full_name || '', email: user?.email || '' }); setIsEditing(false); }}
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Save size={16} />
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={handleProfileSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                      >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { setFormData({ full_name: user?.full_name || '', email: user?.email || '' }); setIsEditing(false); }}
                        className="px-6 py-2 rounded-lg border border-border text-text-secondary hover:bg-secondary transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-tertiary mb-1">Full Name</label>
                        <p className="text-text-primary">{user?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-tertiary mb-1">Email</label>
                        <p className="text-text-primary">{user?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-tertiary mb-1">Username</label>
                        <p className="text-text-primary">@{user?.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-tertiary mb-1">Role</label>
                        <p className="text-text-primary capitalize">{user?.role}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-text-secondary">
                        Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-xl border border-border p-6 space-y-6">
              <h2 className="text-lg font-bold text-text-primary">Preferences</h2>

              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">Dark Mode</p>
                  <p className="text-sm text-text-secondary">Switch between light and dark theme</p>
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

              {/* Notifications */}
              <div>
                <p className="font-medium text-text-primary mb-3">Notifications</p>
                <label className="flex items-center gap-3 mb-3 p-3 bg-secondary/50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Email notifications</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Upload completion notifications</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Weekly analytics digest</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-text-secondary">Marketing emails</span>
                </label>
              </div>

              {/* Content Defaults */}
              <div className="pt-4 border-t border-border">
                <p className="font-medium text-text-primary mb-3">Content Defaults</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Default Category</label>
                    <select className="w-full md:w-64 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">General</option>
                      <option value="education">Education</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="business">Business</option>
                      <option value="lifestyle">Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Default Privacy</label>
                    <select className="w-full md:w-64 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-border p-6 space-y-6">
              <h2 className="text-lg font-bold text-text-primary">Security</h2>

              {/* Change Password */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={24} className="text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Change Password</p>
                    <p className="text-sm text-text-secondary">Update your password regularly for security</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter new password (min 8 chars)"
                    />
                    <p className="text-xs text-text-tertiary mt-1">Min 8 chars, uppercase, lowercase, number, special char</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                  >
                    <Lock size={18} />
                    {isSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* Sessions */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={24} className="text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Active Sessions</p>
                    <p className="text-sm text-text-secondary">Manage your logged-in devices</p>
                  </div>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="p-4 bg-white flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Current Session</p>
                        <p className="text-sm text-text-secondary">This device · Active now</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                  </div>
                  <div className="p-4 bg-white">
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Sign out of all other sessions
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <LogOut size={24} className="text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Danger Zone</p>
                    <p className="text-sm text-red-700">Irreversible actions</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}