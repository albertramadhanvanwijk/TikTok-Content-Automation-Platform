import { Response } from 'express';
import analyticsService from '../services/analyticsService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class AnalyticsController {
  /**
   * Get analytics dashboard
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const period = (req.query.period || 'weekly') as 'daily' | 'weekly' | 'monthly';

      const dashboard = await analyticsService.getAnalyticsDashboard(req.userId, period);

      res.status(200).json({
        status: 'success',
        data: { dashboard },
      });
    } catch (error: any) {
      logger.error('Get dashboard error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get analytics dashboard',
          status: 400,
        },
      });
    }
  }

  /**
   * Get carousel daily analytics
   */
  async getCarouselAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await analyticsService.getDailyAnalytics(carouselId, days);

      res.status(200).json({
        status: 'success',
        data: { analytics },
      });
    } catch (error: any) {
      logger.error('Get carousel analytics error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get carousel analytics',
          status: 400,
        },
      });
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const period = (req.query.period || 'weekly') as 'weekly' | 'monthly';

      const summary = await analyticsService.getPerformanceSummary(req.userId, period);

      res.status(200).json({
        status: 'success',
        data: { summary },
      });
    } catch (error: any) {
      logger.error('Get performance summary error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get performance summary',
          status: 400,
        },
      });
    }
  }

  /**
   * Get engagement trends for carousel
   */
  async getEngagementTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const trends = await analyticsService.getEngagementTrends(carouselId, hours);

      res.status(200).json({
        status: 'success',
        data: { trends },
      });
    } catch (error: any) {
      logger.error('Get engagement trends error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get engagement trends',
          status: 400,
        },
      });
    }
  }

  /**
   * Get audience demographics
   */
  async getAudienceDemographics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;

      const demographics = await analyticsService.getAudienceDemographics(carouselId);

      res.status(200).json({
        status: 'success',
        data: { demographics },
      });
    } catch (error: any) {
      logger.error('Get audience demographics error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get audience demographics',
          status: 400,
        },
      });
    }
  }

  /**
   * Get top performing content
   */
  async getTopPerformingContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 5;

      const topContent = await analyticsService.getTopPerformingContent(req.userId, limit);

      res.status(200).json({
        status: 'success',
        data: { top_content: topContent },
      });
    } catch (error: any) {
      logger.error('Get top content error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get top performing content',
          status: 400,
        },
      });
    }
  }

  /**
   * Get user overall statistics
   */
  async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const stats = await analyticsService.getUserStats(req.userId);

      res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error: any) {
      logger.error('Get user stats error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get user statistics',
          status: 400,
        },
      });
    }
  }

  /**
   * Update top performing content (admin/scheduled task)
   */
  async refreshTopContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const topContent = await analyticsService.updateTopPerformingContent(req.userId);

      res.status(200).json({
        status: 'success',
        data: { top_content: topContent },
      });
    } catch (error: any) {
      logger.error('Refresh top content error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to refresh top content',
          status: 400,
        },
      });
    }
  }
}

export default new AnalyticsController();
