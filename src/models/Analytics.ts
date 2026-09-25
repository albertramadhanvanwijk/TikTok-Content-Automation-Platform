export interface DailyAnalytics {
  id: string;
  user_id: string;
  carousel_id: string;
  date: Date;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  saves_count: number;
  engagement_rate: number;
  click_through_rate: number;
  created_at: Date;
  updated_at: Date;
}

export interface PerformanceSummary {
  id: string;
  user_id: string;
  period: 'weekly' | 'monthly';
  start_date: Date;
  end_date: Date;
  total_carousels: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_saves: number;
  avg_engagement_rate: number;
  top_carousel_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EngagementTrend {
  id: string;
  carousel_id: string;
  timestamp: Date;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  engagement_rate: number;
  created_at: Date;
}

export interface AudienceDemographics {
  id: string;
  carousel_id: string;
  age_group?: string;
  gender?: string;
  country?: string;
  device_type?: string;
  view_count: number;
  engagement_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TopPerformingContent {
  id: string;
  user_id: string;
  carousel_id: string;
  rank: number;
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  created_at: Date;
  updated_at: Date;
}

export interface AnalyticsDashboard {
  period: 'daily' | 'weekly' | 'monthly';
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_saves: number;
  avg_engagement_rate: number;
  total_carousels: number;
  top_carousels: TopPerformingContent[];
  engagement_trends: EngagementTrend[];
  growth_rate: {
    views: number;
    engagement: number;
  };
}

export interface UpdateDailyAnalyticsInput {
  carousel_id: string;
  date: Date;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  saves_count: number;
}
