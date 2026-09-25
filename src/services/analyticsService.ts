import analyticsRepository from '../repositories/AnalyticsRepository';
import { UpdateDailyAnalyticsInput, AnalyticsDashboard } from '../models/Analytics';
import logger from '../utils/logger';

class AnalyticsService {
  /**
   * Update daily analytics for a carousel
   */
  async updateDailyAnalytics(userId: string, input: UpdateDailyAnalyticsInput) {
    try {
      const analytics = await analyticsRepository.updateDailyAnalytics(userId, input);
      logger.info(`Daily analytics updated for carousel ${input.carousel_id}`);
      return analytics;
    } catch (error) {
      logger.error('Error updating daily analytics', error);
      throw error;
    }
  }

  /**
   * Get daily analytics for carousel
   */
  async getDailyAnalytics(carouselId: string, days: number = 30) {
    try {
      return await analyticsRepository.getDailyAnalytics(carouselId, days);
    } catch (error) {
      logger.error('Error getting daily analytics', error);
      throw error;
    }
  }

  /**
   * Calculate and create performance summary (weekly/monthly)
   */
  async calculatePerformanceSummary(
    userId: string,
    period: 'weekly' | 'monthly'
  ) {
    try {
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      // Get user stats
      const stats = await analyticsRepository.getUserStats(userId);

      const summary = {
        total_carousels: stats.published_carousels || 0,
        total_views: stats.total_views || 0,
        total_likes: stats.total_likes || 0,
        total_shares: stats.total_shares || 0,
        total_comments: stats.total_comments || 0,
        total_saves: stats.total_saves || 0,
        avg_engagement_rate: stats.avg_engagement_rate || 0,
      };

      return await analyticsRepository.createPerformanceSummary(
        userId,
        period,
        startDate,
        endDate,
        summary
      );
    } catch (error) {
      logger.error('Error calculating performance summary', error);
      throw error;
    }
  }

  /**
   * Get performance summary for user
   */
  async getPerformanceSummary(userId: string, period: 'weekly' | 'monthly') {
    try {
      return await analyticsRepository.getUserPerformanceSummary(userId, period);
    } catch (error) {
      logger.error('Error getting performance summary', error);
      throw error;
    }
  }

  /**
   * Record engagement trend snapshot
   */
  async recordEngagementTrend(carouselId: string, metrics: any) {
    try {
      return await analyticsRepository.createEngagementTrend(carouselId, metrics);
    } catch (error) {
      logger.error('Error recording engagement trend', error);
      throw error;
    }
  }

  /**
   * Get engagement trends for carousel
   */
  async getEngagementTrends(carouselId: string, hours: number = 24) {
    try {
      return await analyticsRepository.getEngagementTrends(carouselId, hours);
    } catch (error) {
      logger.error('Error getting engagement trends', error);
      throw error;
    }
  }

  /**
   * Update audience demographics
   */
  async updateAudienceDemographics(carouselId: string, demographics: any) {
    try {
      return await analyticsRepository.upsertDemographics(carouselId, demographics);
    } catch (error) {
      logger.error('Error updating audience demographics', error);
      throw error;
    }
  }

  /**
   * Get audience demographics
   */
  async getAudienceDemographics(carouselId: string) {
    try {
      return await analyticsRepository.getAudienceDemographics(carouselId);
    } catch (error) {
      logger.error('Error getting audience demographics', error);
      throw error;
    }
  }

  /**
   * Update top performing content
   */
  async updateTopPerformingContent(userId: string) {
    try {
      return await analyticsRepository.updateTopPerformingContent(userId);
    } catch (error) {
      logger.error('Error updating top performing content', error);
      throw error;
    }
  }

  /**
   * Get top performing content
   */
  async getTopPerformingContent(userId: string, limit: number = 5) {
    try {
      return await analyticsRepository.getTopPerformingContent(userId, limit);
    } catch (error) {
      logger.error('Error getting top performing content', error);
      throw error;
    }
  }

  /**
   * Build analytics dashboard
   */
  async getAnalyticsDashboard(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<AnalyticsDashboard> {
    try {
      // Get performance summary
      const perfPeriod = period === 'daily' ? 'weekly' : (period as 'weekly' | 'monthly');
      const performanceSummary = await this.getPerformanceSummary(userId, perfPeriod);

      // Get top performing content
      const topCarousels = await this.getTopPerformingContent(userId, 5);

      // Get engagement trends (last 24 hours for daily, last 7 days for weekly, etc)
      const trendHours = period === 'daily' ? 24 : period === 'weekly' ? 168 : 720;
      let engagementTrends: any[] = [];

      if (topCarousels.length > 0) {
        engagementTrends = await this.getEngagementTrends(
          topCarousels[0].carousel_id,
          trendHours
        );
      }

      // Calculate growth rate
      const growthRate = this.calculateGrowthRate(performanceSummary);

      const dashboard: AnalyticsDashboard = {
        period,
        total_views: performanceSummary?.total_views || 0,
        total_likes: performanceSummary?.total_likes || 0,
        total_shares: performanceSummary?.total_shares || 0,
        total_comments: performanceSummary?.total_comments || 0,
        total_saves: performanceSummary?.total_saves || 0,
        avg_engagement_rate: performanceSummary?.avg_engagement_rate || 0,
        total_carousels: performanceSummary?.total_carousels || 0,
        top_carousels: topCarousels,
        engagement_trends: engagementTrends,
        growth_rate: growthRate,
      };

      logger.info(`Analytics dashboard generated for user ${userId}`);
      return dashboard;
    } catch (error) {
      logger.error('Error building analytics dashboard', error);
      throw error;
    }
  }

  /**
   * Get user overall statistics
   */
  async getUserStats(userId: string) {
    try {
      return await analyticsRepository.getUserStats(userId);
    } catch (error) {
      logger.error('Error getting user stats', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate start date based on period
   */
  private getStartDate(period: 'weekly' | 'monthly'): Date {
    const now = new Date();

    if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    } else {
      // monthly
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Helper: Calculate growth rate
   */
  private calculateGrowthRate(currentSummary: any): { views: number; engagement: number } {
    // Placeholder - in production, would compare with previous period
    return {
      views: currentSummary ? 12.5 : 0, // percentage
      engagement: currentSummary ? 8.2 : 0, // percentage
    };
  }
}

export default new AnalyticsService();
