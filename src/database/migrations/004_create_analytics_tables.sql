-- Migration: 004_create_analytics_tables.sql
-- Description: Create tables for analytics and performance tracking
-- Created: 2026-09-25

-- Daily Analytics Snapshot table
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(carousel_id, date)
);

CREATE INDEX idx_daily_analytics_user_id ON daily_analytics(user_id);
CREATE INDEX idx_daily_analytics_carousel_id ON daily_analytics(carousel_id);
CREATE INDEX idx_daily_analytics_date ON daily_analytics(date DESC);
CREATE TRIGGER update_daily_analytics_updated_at BEFORE UPDATE ON daily_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance Summary table
CREATE TABLE IF NOT EXISTS performance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_carousels INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  top_carousel_id UUID REFERENCES carousels(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period, start_date, end_date)
);

CREATE INDEX idx_perf_summary_user_id ON performance_summary(user_id);
CREATE INDEX idx_perf_summary_period ON performance_summary(period);
CREATE INDEX idx_perf_summary_dates ON performance_summary(start_date, end_date);
CREATE TRIGGER update_perf_summary_updated_at BEFORE UPDATE ON performance_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Engagement Trend table (hourly snapshots)
CREATE TABLE IF NOT EXISTS engagement_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(carousel_id, timestamp)
);

CREATE INDEX idx_engagement_trends_carousel_id ON engagement_trends(carousel_id);
CREATE INDEX idx_engagement_trends_timestamp ON engagement_trends(timestamp DESC);

-- Audience Demographics table
CREATE TABLE IF NOT EXISTS audience_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  age_group VARCHAR(20),
  gender VARCHAR(20),
  country VARCHAR(100),
  device_type VARCHAR(50),
  view_count INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(carousel_id, age_group, gender, country, device_type)
);

CREATE INDEX idx_demographics_carousel_id ON audience_demographics(carousel_id);
CREATE TRIGGER update_demographics_updated_at BEFORE UPDATE ON audience_demographics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Top Performing Content table
CREATE TABLE IF NOT EXISTS top_performing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, rank)
);

CREATE INDEX idx_top_content_user_id ON top_performing_content(user_id);
CREATE INDEX idx_top_content_carousel_id ON top_performing_content(carousel_id);
CREATE TRIGGER update_top_content_updated_at BEFORE UPDATE ON top_performing_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
