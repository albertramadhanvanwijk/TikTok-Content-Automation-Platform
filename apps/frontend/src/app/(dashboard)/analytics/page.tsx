'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { TrendingUp, Eye, Heart, Share2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  avg_engagement_rate: number;
  top_carousels: any[];
  engagement_trends: any[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?period=${period}`);
        if (response.data?.dashboard) {
          setData(response.data.dashboard);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const StatCard = ({ icon: Icon, label, value, trend }: any) => (
    <div className="bg-white rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <Icon size={18} className="text-primary" />
      </div>
      <div className="text-3xl font-bold text-text-primary">{value.toLocaleString()}</div>
      {trend && (
        <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp size={14} />
          {Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-secondary mt-1">Your content performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text-secondary hover:bg-tertiary'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="Total Views" value={data.total_views} trend={12.5} />
          <StatCard icon={Heart} label="Total Likes" value={data.total_likes} trend={8.2} />
          <StatCard icon={Share2} label="Total Shares" value={data.total_shares} trend={-3} />
          <StatCard
            icon={TrendingUp}
            label="Engagement Rate"
            value={data.avg_engagement_rate.toFixed(1)}
            trend={null}
          />
        </div>
      ) : null}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Top Performing</h2>
          {data?.top_carousels && data.top_carousels.length > 0 ? (
            <div className="space-y-3">
              {data.top_carousels.slice(0, 5).map((carousel, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {carousel.title || 'Carousel'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {carousel.total_engagement || 0} engagement
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {(carousel.engagement_rate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No data available</p>
          )}
        </div>

        {/* Engagement Trends */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Recent Trends</h2>
          {data?.engagement_trends && data.engagement_trends.length > 0 ? (
            <div className="space-y-3">
              {data.engagement_trends.slice(0, 5).map((trend, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-text-secondary">
                      {format(new Date(trend.timestamp), 'MMM dd, HH:mm')}
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (trend.views_count / data.total_views) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-text-primary w-12 text-right">
                    {trend.views_count}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No data available</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">Period Summary</h3>
        <p className="text-sm text-blue-800">
          Your content achieved an average engagement rate of <strong>{data?.avg_engagement_rate.toFixed(1)}%</strong> this {period}.
          Keep creating great content to improve these metrics!
        </p>
      </div>
    </div>
  );
}
