'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { Plus, BarChart2, Calendar, Clock, TrendingUp, Heart, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_carousels: number;
  avg_engagement_rate: number;
  recent_carousels?: any[];
}

const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
  <div className="bg-white rounded-xl border border-border p-6">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon size={22} className={`text-${color}-600`} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
    <p className="text-3xl font-bold text-text-primary">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>(API_ENDPOINTS.ANALYTICS.DASHBOARD);
        if (response.data?.dashboard) {
          setData(response.data.dashboard);
        }
      } catch (err: any) {
        toast.error('Failed to load dashboard', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { label: 'Create Carousel', href: '/content/new', icon: Plus, color: 'blue' },
    { label: 'View Analytics', href: '/analytics', icon: BarChart2, color: 'purple' },
    { label: 'Schedule Post', href: '/schedule', icon: Calendar, color: 'green' },
    { label: 'Settings', href: '/settings', icon: Clock, color: 'gray' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Welcome back, {user?.full_name || user?.username}! Here's your content overview.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Views" value={data.total_views} color="blue" trend={data.total_views > 0 ? 12 : 0} />
          <StatCard icon={Heart} label="Total Likes" value={data.total_likes} color="red" trend={data.total_likes > 0 ? 8 : 0} />
          <StatCard icon={Share2} label="Total Shares" value={data.total_shares} color="green" trend={data.total_shares > 0 ? -3 : 0} />
          <StatCard icon={MessageCircle} label="Engagement Rate" value={`${data.avg_engagement_rate.toFixed(1)}%`} color="purple" trend={5} />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <button className="w-full flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary transition text-left">
                <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                  <action.icon size={22} className={`text-${action.color}-600`} />
                </div>
                <span className="text-sm font-medium text-text-primary">{action.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Carousels */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Carousels</h2>
          <Link href="/content">
            <span className="text-sm text-primary hover:underline">View all →</span>
          </Link>
        </div>
        {data?.recent_carousels && data.recent_carousels.length > 0 ? (
          <div className="space-y-3">
            {data.recent_carousels.slice(0, 5).map((carousel: any) => (
              <Link key={carousel.id} href={`/content/${carousel.id}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart2 size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{carousel.title}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${carousel.status === 'published' ? 'bg-green-100 text-green-700' : carousel.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {carousel.status}
                      </span>
                      <span>{carousel.slides_count} slides</span>
                    </p>
                  </div>
                  <Clock size={18} className="text-text-tertiary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart2 size={48} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary mb-4">No carousels yet</p>
            <Link href="/content/new">
              <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
                <Plus size={18} />
                Create Your First Carousel
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}