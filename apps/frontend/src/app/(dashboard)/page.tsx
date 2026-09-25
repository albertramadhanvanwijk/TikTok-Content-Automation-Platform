'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';

interface DashboardData {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_carousels: number;
  avg_engagement_rate: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>(API_ENDPOINTS.ANALYTICS.DASHBOARD);
        if (response.data) {
          setData(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Welcome back, {user?.full_name}! Here's your content overview.
        </p>
      </div>

      {/* Stats Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Total Views
            </p>
            <p className="text-2xl font-bold text-text-primary mt-2">
              {data.total_views.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Total Likes
            </p>
            <p className="text-2xl font-bold text-text-primary mt-2">
              {data.total_likes.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Total Shares
            </p>
            <p className="text-2xl font-bold text-text-primary mt-2">
              {data.total_shares.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Engagement Rate
            </p>
            <p className="text-2xl font-bold text-text-primary mt-2">
              {data.avg_engagement_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      ) : null}

      {/* Placeholder for more content */}
      <div className="bg-white rounded-lg p-6 border border-border">
        <h2 className="text-lg font-bold text-text-primary mb-4">Recent Carousels</h2>
        <p className="text-text-secondary">More content coming soon...</p>
      </div>
    </div>
  );
}
