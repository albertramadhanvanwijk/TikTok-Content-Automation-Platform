import database from '../database/connection';
import {
  DailyAnalytics,
  PerformanceSummary,
  EngagementTrend,
  AudienceDemographics,
  TopPerformingContent,
  UpdateDailyAnalyticsInput,
} from '../models/Analytics';
import logger from '../utils/logger';

class AnalyticsRepository {
  // ===== DAILY ANALYTICS =====

  async updateDailyAnalytics(
    userId: string,
    input: UpdateDailyAnalyticsInput
  ): Promise<DailyAnalytics> {
    const query = `
      INSERT INTO daily_analytics 
      (user_id, carousel_id, date, views_count, likes_count, shares_count, comments_count, saves_count, engagement_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CAST(((($5 + $6 + $7 + $8)::DECIMAL / NULLIF($4, 0)) * 100) AS DECIMAL(5,2)))
      ON CONFLICT (carousel_id, date) 
      DO UPDATE SET 
        views_count = $4,
        likes_count = $5,
        shares_count = $6,
        comments_count = $7,
        saves_count = $8,
        engagement_rate = CAST(((($5 + $6 + $7 + $8)::DECIMAL / NULLIF($4, 0)) * 100) AS DECIMAL(5,2)),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, carousel_id, date, views_count, likes_count, shares_count, 
                comments_count, saves_count, engagement_rate, click_through_rate, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        input.carousel_id,
        input.date,
        input.views_count,
        input.likes_count,
        input.shares_count,
        input.comments_count,
        input.saves_count,
      ]);

      return result.rows[0] as DailyAnalytics;
    } catch (error) {
      logger.error('Error updating daily analytics', error);
      throw error;
    }
  }

  async getDailyAnalytics(carouselId: string, days: number = 30): Promise<DailyAnalytics[]> {
    const query = `
      SELECT id, user_id, carousel_id, date, views_count, likes_count, shares_count, 
             comments_count, saves_count, engagement_rate, click_through_rate, created_at, updated_at
      FROM daily_analytics
      WHERE carousel_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `;

    try {
      const result = await database.query(query, [carouselId]);
      return result.rows as DailyAnalytics[];
    } catch (error) {
      logger.error('Error getting daily analytics', error);
      throw error;
    }
  }

  // ===== PERFORMANCE SUMMARY =====

  async createPerformanceSummary(
    userId: string,
    period: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    summary: any
  ): Promise<PerformanceSummary> {
    const query = `
      INSERT INTO performance_summary 
      (user_id, period, start_date, end_date, total_carousels, total_views, total_likes, 
       total_shares, total_comments, total_saves, avg_engagement_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, period, start_date, end_date) 
      DO UPDATE SET 
        total_carousels = $5,
        total_views = $6,
        total_likes = $7,
        total_shares = $8,
        total_comments = $9,
        total_saves = $10,
        avg_engagement_rate = $11,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, period, start_date, end_date, total_carousels, total_views, 
                total_likes, total_shares, total_comments, total_saves, avg_engagement_rate, 
                top_carousel_id, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        period,
        startDate,
        endDate,
        summary.total_carousels,
        summary.total_views,
        summary.total_likes,
        summary.total_shares,
        summary.total_comments,
        summary.total_saves,
        summary.avg_engagement_rate,
      ]);

      return result.rows[0] as PerformanceSummary;
    } catch (error) {
      logger.error('Error creating performance summary', error);
      throw error;
    }
  }

  async getUserPerformanceSummary(
    userId: string,
    period: 'weekly' | 'monthly'
  ): Promise<PerformanceSummary | null> {
    const query = `
      SELECT id, user_id, period, start_date, end_date, total_carousels, total_views, 
             total_likes, total_shares, total_comments, total_saves, avg_engagement_rate, 
             top_carousel_id, created_at, updated_at
      FROM performance_summary
      WHERE user_id = $1 AND period = $2 AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const result = await database.query(query, [userId, period]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting performance summary', error);
      throw error;
    }
  }

  // ===== ENGAGEMENT TRENDS =====

  async createEngagementTrend(
    carouselId: string,
    metrics: any
  ): Promise<EngagementTrend> {
    const query = `
      INSERT INTO engagement_trends 
      (carousel_id, timestamp, views_count, likes_count, shares_count, comments_count, engagement_rate)
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6)
      RETURNING id, carousel_id, timestamp, views_count, likes_count, shares_count, 
                comments_count, engagement_rate, created_at
    `;

    try {
      const result = await database.query(query, [
        carouselId,
        metrics.views_count,
        metrics.likes_count,
        metrics.shares_count,
        metrics.comments_count,
        metrics.engagement_rate,
      ]);

      return result.rows[0] as EngagementTrend;
    } catch (error) {
      logger.error('Error creating engagement trend', error);
      throw error;
    }
  }

  async getEngagementTrends(
    carouselId: string,
    hours: number = 24
  ): Promise<EngagementTrend[]> {
    const query = `
      SELECT id, carousel_id, timestamp, views_count, likes_count, shares_count, 
             comments_count, engagement_rate, created_at
      FROM engagement_trends
      WHERE carousel_id = $1 AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
      ORDER BY timestamp ASC
    `;

    try {
      const result = await database.query(query, [carouselId]);
      return result.rows as EngagementTrend[];
    } catch (error) {
      logger.error('Error getting engagement trends', error);
      throw error;
    }
  }

  // ===== AUDIENCE DEMOGRAPHICS =====

  async upsertDemographics(
    carouselId: string,
    demographics: AudienceDemographics
  ): Promise<AudienceDemographics> {
    const query = `
      INSERT INTO audience_demographics 
      (carousel_id, age_group, gender, country, device_type, view_count, engagement_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (carousel_id, age_group, gender, country, device_type) 
      DO UPDATE SET 
        view_count = $6,
        engagement_count = $7,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, carousel_id, age_group, gender, country, device_type, view_count, engagement_count, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        carouselId,
        demographics.age_group,
        demographics.gender,
        demographics.country,
        demographics.device_type,
        demographics.view_count,
        demographics.engagement_count,
      ]);

      return result.rows[0] as AudienceDemographics;
    } catch (error) {
      logger.error('Error upserting demographics', error);
      throw error;
    }
  }

  async getAudienceDemographics(carouselId: string): Promise<AudienceDemographics[]> {
    const query = `
      SELECT id, carousel_id, age_group, gender, country, device_type, view_count, engagement_count, created_at, updated_at
      FROM audience_demographics
      WHERE carousel_id = $1
      ORDER BY view_count DESC
    `;

    try {
      const result = await database.query(query, [carouselId]);
      return result.rows as AudienceDemographics[];
    } catch (error) {
      logger.error('Error getting audience demographics', error);
      throw error;
    }
  }

  // ===== TOP PERFORMING CONTENT =====

  async updateTopPerformingContent(userId: string): Promise<TopPerformingContent[]> {
    const query = `
      WITH ranked_content AS (
        SELECT 
          c.id,
          c.user_id,
          cm.likes_count + cm.shares_count + cm.comments_count + cm.saves_count as total_engagement,
          cm.views_count,
          CAST(((cm.likes_count + cm.shares_count + cm.comments_count + cm.saves_count)::DECIMAL / NULLIF(cm.views_count, 0)) * 100 AS DECIMAL(5,2)) as engagement_rate,
          ROW_NUMBER() OVER (ORDER BY (cm.likes_count + cm.shares_count + cm.comments_count + cm.saves_count) DESC) as rank
        FROM carousels c
        JOIN carousel_metrics cm ON c.id = cm.carousel_id
        WHERE c.user_id = $1 AND c.status IN ('published', 'archived')
        LIMIT 10
      )
      INSERT INTO top_performing_content (user_id, carousel_id, rank, total_views, total_engagement, engagement_rate)
      SELECT $1, id, rank, views_count, total_engagement, engagement_rate FROM ranked_content
      ON CONFLICT (user_id, rank) 
      DO UPDATE SET 
        carousel_id = EXCLUDED.carousel_id,
        total_views = EXCLUDED.total_views,
        total_engagement = EXCLUDED.total_engagement,
        engagement_rate = EXCLUDED.engagement_rate,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, carousel_id, rank, total_views, total_engagement, engagement_rate, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [userId]);
      return result.rows as TopPerformingContent[];
    } catch (error) {
      logger.error('Error updating top performing content', error);
      throw error;
    }
  }

  async getTopPerformingContent(userId: string, limit: number = 5): Promise<TopPerformingContent[]> {
    const query = `
      SELECT id, user_id, carousel_id, rank, total_views, total_engagement, engagement_rate, created_at, updated_at
      FROM top_performing_content
      WHERE user_id = $1
      ORDER BY rank ASC
      LIMIT $2
    `;

    try {
      const result = await database.query(query, [userId, limit]);
      return result.rows as TopPerformingContent[];
    } catch (error) {
      logger.error('Error getting top performing content', error);
      throw error;
    }
  }

  // ===== GENERAL STATS =====

  async getUserStats(userId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT c.id) as total_carousels,
        COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_carousels,
        COALESCE(SUM(cm.views_count), 0) as total_views,
        COALESCE(SUM(cm.likes_count), 0) as total_likes,
        COALESCE(SUM(cm.shares_count), 0) as total_shares,
        COALESCE(AVG(cm.engagement_rate), 0) as avg_engagement_rate
      FROM carousels c
      LEFT JOIN carousel_metrics cm ON c.id = cm.carousel_id
      WHERE c.user_id = $1
    `;

    try {
      const result = await database.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user stats', error);
      throw error;
    }
  }
}

export default new AnalyticsRepository();
