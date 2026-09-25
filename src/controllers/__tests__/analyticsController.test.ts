import request from 'supertest';
import app from '../../index';
import analyticsService from '../../services/analyticsService';

jest.mock('../../services/analyticsService');

describe('AnalyticsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard', () => {
    it('should get analytics dashboard', async () => {
      const mockDashboard = {
        period: 'weekly',
        total_views: 5000,
        total_likes: 500,
        avg_engagement_rate: 10,
        top_carousels: [],
      };

      (analyticsService.getAnalyticsDashboard as jest.Mock).mockResolvedValue(
        mockDashboard
      );

      const response = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.dashboard.total_views).toBe(5000);
    });
  });

  describe('Carousel Analytics', () => {
    it('should get carousel daily analytics', async () => {
      const mockAnalytics = [
        { id: 'analytics-1', views_count: 1000, likes_count: 100 },
      ];

      (analyticsService.getDailyAnalytics as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const response = await request(app)
        .get('/analytics/carousels/carousel-123?days=30')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.analytics).toHaveLength(1);
    });
  });

  describe('Performance Summary', () => {
    it('should get performance summary', async () => {
      const mockSummary = {
        id: 'summary-123',
        period: 'weekly',
        total_views: 5000,
      };

      (analyticsService.getPerformanceSummary as jest.Mock).mockResolvedValue(
        mockSummary
      );

      const response = await request(app)
        .get('/analytics/performance-summary?period=weekly')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.period).toBe('weekly');
    });
  });

  describe('Engagement Trends', () => {
    it('should get engagement trends', async () => {
      const mockTrends = [
        { id: 'trend-1', views_count: 1000 },
      ];

      (analyticsService.getEngagementTrends as jest.Mock).mockResolvedValue(
        mockTrends
      );

      const response = await request(app)
        .get('/analytics/carousels/carousel-123/trends?hours=24')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.trends).toHaveLength(1);
    });
  });

  describe('Audience Demographics', () => {
    it('should get audience demographics', async () => {
      const mockDemographics = [
        { id: 'demo-1', age_group: '18-24', view_count: 500 },
      ];

      (analyticsService.getAudienceDemographics as jest.Mock).mockResolvedValue(
        mockDemographics
      );

      const response = await request(app)
        .get('/analytics/carousels/carousel-123/demographics')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.demographics).toHaveLength(1);
    });
  });

  describe('Top Content', () => {
    it('should get top performing content', async () => {
      const mockTopContent = [
        { id: 'content-1', rank: 1, total_views: 5000 },
      ];

      (analyticsService.getTopPerformingContent as jest.Mock).mockResolvedValue(
        mockTopContent
      );

      const response = await request(app)
        .get('/analytics/top-content?limit=5')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.top_content).toHaveLength(1);
    });

    it('should refresh top content', async () => {
      const mockTopContent = [
        { id: 'content-1', rank: 1 },
      ];

      (analyticsService.updateTopPerformingContent as jest.Mock).mockResolvedValue(
        mockTopContent
      );

      const response = await request(app)
        .post('/analytics/top-content/refresh')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.top_content).toHaveLength(1);
    });
  });

  describe('User Stats', () => {
    it('should get user stats', async () => {
      const mockStats = {
        total_carousels: 10,
        total_views: 50000,
      };

      (analyticsService.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/analytics/stats')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.stats.total_carousels).toBe(10);
    });
  });

  describe('Authorization', () => {
    it('should require auth for all analytics endpoints', async () => {
      const response = await request(app).get('/analytics/stats');
      expect(response.status).toBe(401);
    });
  });
});
