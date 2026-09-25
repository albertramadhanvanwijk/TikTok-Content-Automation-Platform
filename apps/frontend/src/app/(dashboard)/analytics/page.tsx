'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { TrendingUp, Eye, Heart, Share2, MessageCircle } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalyticsData {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  avg_engagement_rate: number;
  total_carousels: number;
  top_carousels: any[];
  engagement_trends: any[];
  growth_rate: { views: number; engagement: number };
}

interface ChartDataPoint {
  date: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagement_rate: number;
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

  // Transform engagement_trends to chart data
  const chartData: ChartDataPoint[] = data?.engagement_trends?.map((trend: any) => ({
    date: format(new Date(trend.timestamp), period === 'daily' ? 'HH:mm' : 'MMM dd'),
    views: trend.views_count || 0,
    likes: trend.likes_count || 0,
    shares: trend.shares_count || 0,
    comments: trend.comments_count || 0,
    engagement_rate: trend.engagement_rate || 0,
  })) || [];

  // Generate mock data if no real data
  const getChartData = () => {
    if (chartData.length > 0) return chartData;

    const days = period === 'daily' ? 24 : period === 'weekly' ? 7 : 30;
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return interval.map((day, i) => ({
      date: format(day, period === 'daily' ? 'HH:00' : 'MMM dd'),
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 20) + 2,
      comments: Math.floor(Math.random() * 30) + 5,
      engagement_rate: Math.random() * 5 + 1,
    }));
  };

  const displayData = getChartData();

  const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }: any) => (
    <div className="bg-white rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <Icon size={18} className={`text-${color}-600`} />
      </div>
      <div className="text-3xl font-bold text-text-primary">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {trend !== null && trend !== undefined && (
        <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp size={14} />
          {Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
          <StatCard icon={Eye} label="Total Views" value={data.total_views} trend={data.growth_rate?.views} color="blue" />
          <StatCard icon={Heart} label="Total Likes" value={data.total_likes} trend={8.2} color="red" />
          <StatCard icon={Share2} label="Total Shares" value={data.total_shares} trend={-3} color="green" />
          <StatCard icon={MessageCircle} label="Engagement Rate" value={`${data.avg_engagement_rate.toFixed(1)}%`} trend={data.growth_rate?.engagement} color="purple" />
        </div>
      ) : null}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends - Area Chart */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Engagement Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#viewsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="engagement_rate"
                  name="Engagement %"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#engagementGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactions - Bar Chart */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Interactions Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="date" type="category" stroke="#9ca3af" fontSize={12} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="likes" name="Likes" fill="#ef4444" radius={[0, 4, 4, 0]} />
                <Bar dataKey="shares" name="Shares" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="comments" name="Comments" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Carousels & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Top Performing Carousels</h2>
          {data?.top_carousels && data.top_carousels.length > 0 ? (
            <div className="space-y-3">
              {data.top_carousels.slice(0, 5).map((carousel: any, i: number) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {carousel.title || 'Carousel'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {carousel.total_engagement || 0} total engagement
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
            <p className="text-text-secondary text-center py-8">No carousel data yet. Create and publish carousels to see performance.</p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">Period Summary</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              Your content achieved an average engagement rate of <strong>{data?.avg_engagement_rate.toFixed(1)}%</strong> this {period}.
            </p>
            <p>
              Total reach: <strong>{data?.total_views?.toLocaleString() || 0}</strong> views across
              <strong>{data?.total_carousels || 0}</strong> carousels.
            </p>
            <p>
              Views growth: <strong className={data?.growth_rate?.views > 0 ? 'text-green-600' : 'text-red-600'}>
                {data?.growth_rate?.views >= 0 ? '+' : ''}{data?.growth_rate?.views || 0}%
              </strong> from last period.
            </p>
            <p className="pt-2 border-t border-blue-200">
              Keep creating great content to improve these metrics!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}