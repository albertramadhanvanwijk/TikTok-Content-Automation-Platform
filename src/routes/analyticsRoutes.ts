import { Router } from 'express';
import analyticsController from '../controllers/AnalyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

/**
 * GET /analytics/dashboard
 * Get analytics dashboard with performance summary and trends
 * Query: period (daily|weekly|monthly)
 */
router.get('/dashboard', (req, res) => analyticsController.getDashboard(req as any, res));

/**
 * GET /analytics/carousels/:carouselId
 * Get daily analytics for a carousel
 * Query: days (default 30)
 */
router.get('/carousels/:carouselId', (req, res) =>
  analyticsController.getCarouselAnalytics(req as any, res)
);

/**
 * GET /analytics/performance-summary
 * Get performance summary (weekly or monthly)
 * Query: period (weekly|monthly)
 */
router.get('/performance-summary', (req, res) =>
  analyticsController.getPerformanceSummary(req as any, res)
);

/**
 * GET /analytics/carousels/:carouselId/trends
 * Get engagement trends for carousel
 * Query: hours (default 24)
 */
router.get('/carousels/:carouselId/trends', (req, res) =>
  analyticsController.getEngagementTrends(req as any, res)
);

/**
 * GET /analytics/carousels/:carouselId/demographics
 * Get audience demographics for carousel
 */
router.get('/carousels/:carouselId/demographics', (req, res) =>
  analyticsController.getAudienceDemographics(req as any, res)
);

/**
 * GET /analytics/top-content
 * Get top performing content
 * Query: limit (default 5)
 */
router.get('/top-content', (req, res) =>
  analyticsController.getTopPerformingContent(req as any, res)
);

/**
 * GET /analytics/stats
 * Get overall user statistics
 */
router.get('/stats', (req, res) => analyticsController.getUserStats(req as any, res));

/**
 * POST /analytics/top-content/refresh
 * Refresh top performing content ranking
 */
router.post('/top-content/refresh', (req, res) =>
  analyticsController.refreshTopContent(req as any, res)
);

export default router;
