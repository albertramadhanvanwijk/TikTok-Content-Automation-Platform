import analyticsService from '../../services/analyticsService';
import analyticsRepository from '../../repositories/AnalyticsRepository';

jest.mock('../../repositories/AnalyticsRepository');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Daily Analytics', () => {
    it('should update daily analytics', async () => {
      const mockAnalytics = {
        id: 'analytics-123',
        carousel_id: 'carousel-123',
        date: new Date(),
        views_count: 1000,
        likes_count: 100,
        engagement_rate: 10,
      };

      (analyticsRepository.updateDailyAnalytics as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const result = await analyticsService.updateDailyAnalytics('user-123', {
        carousel_id: 'carousel-123',
        date: new Date(),
        views_count: 1000,
        likes_count: 100,
        shares_count: 20,
        comments_count: 15,
        saves_count: 30,
      });

      expect(result.id).toBe('analytics-123');
      expect(result.views_count).toBe(1000);
    });

    it('should get daily analytics', async () => {
      const mockAnalytics = [
        { id: 'analytics-1', date: new Date(), views_count: 1000 },
        { id: 'analytics-2', date: new Date(), views_count: 1200 },
      ];

      (analyticsRepository.getDailyAnalytics as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const result = await analyticsService.getDailyAnalytics('carousel-123', 30);

      expect(result).toHaveLength(2);
      expect(result[0].views_count).toBe(1000);
    });
  });

  describe('Performance Summary', () => {
    it('should calculate weekly performance summary', async () => {
      const mockStats = {
        total_carousels: 5,
        published_carousels: 4,
        total_views: 5000,
        total_likes: 500,
        avg_engagement_rate: 10,
      };

      const mockSummary = {
        id: 'summary-123',
        user_id: 'user-123',
        period: 'weekly',
        total_carousels: 4,
        total_views: 5000,
      };

      (analyticsRepository.getUserStats as jest.Mock).mockResolvedValue(mockStats);
      (analyticsRepository.createPerformanceSummary as jest.Mock).mockResolvedValue(
        mockSummary
      );

      const result = await analyticsService.calculatePerformanceSummary(
        'user-123',
        'weekly'
      );

      expect(result.period).toBe('weekly');
    });

    it('should get performance summary', async () => {
      const mockSummary = {
        id: 'summary-123',
        period: 'weekly',
        total_views: 5000,
      };

      (analyticsRepository.getUserPerformanceSummary as jest.Mock).mockResolvedValue(
        mockSummary
      );

      const result = await analyticsService.getPerformanceSummary('user-123', 'weekly');

      expect(result.total_views).toBe(5000);
    });
  });

  describe('Engagement Trends', () => {
    it('should record engagement trend', async () => {
      const mockTrend = {
        id: 'trend-123',
        carousel_id: 'carousel-123',
        views_count: 1000,
        engagement_rate: 10,
      };

      (analyticsRepository.createEngagementTrend as jest.Mock).mockResolvedValue(
        mockTrend
      );

      const result = await analyticsService.recordEngagementTrend('carousel-123', {
        views_count: 1000,
        likes_count: 100,
      });

      expect(result.carousel_id).toBe('carousel-123');
    });

    it('should get engagement trends', async () => {
      const mockTrends = [
        { id: 'trend-1', views_count: 1000 },
        { id: 'trend-2', views_count: 1100 },
      ];

      (analyticsRepository.getEngagementTrends as jest.Mock).mockResolvedValue(
        mockTrends
      );

      const result = await analyticsService.getEngagementTrends('carousel-123', 24);

      expect(result).toHaveLength(2);
    });
  });

  describe('Audience Demographics', () => {
    it('should update audience demographics', async () => {
      const mockDemographics = {
        id: 'demo-123',
        carousel_id: 'carousel-123',
        age_group: '18-24',
        view_count: 500,
      };

      (analyticsRepository.upsertDemographics as jest.Mock).mockResolvedValue(
        mockDemographics
      );

      const result = await analyticsService.updateAudienceDemographics(
        'carousel-123',
        mockDemographics
      );

      expect(result.age_group).toBe('18-24');
    });

    it('should get audience demographics', async () => {
      const mockDemographics = [
        { id: 'demo-1', age_group: '18-24', view_count: 500 },
      ];

      (analyticsRepository.getAudienceDemographics as jest.Mock).mockResolvedValue(
        mockDemographics
      );

      const result = await analyticsService.getAudienceDemographics('carousel-123');

      expect(result).toHaveLength(1);
    });
  });

  describe('Top Performing Content', () => {
    it('should update top performing content', async () => {
      const mockTopContent = [
        { id: 'content-1', rank: 1, total_views: 5000 },
        { id: 'content-2', rank: 2, total_views: 4000 },
      ];

      (analyticsRepository.updateTopPerformingContent as jest.Mock).mockResolvedValue(
        mockTopContent
      );

      const result = await analyticsService.updateTopPerformingContent('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
    });

    it('should get top performing content', async () => {
      const mockTopContent = [
        { id: 'content-1', rank: 1, total_views: 5000 },
      ];

      (analyticsRepository.getTopPerformingContent as jest.Mock).mockResolvedValue(
        mockTopContent
      );

      const result = await analyticsService.getTopPerformingContent('user-123', 5);

      expect(result[0].rank).toBe(1);
    });
  });

  describe('Analytics Dashboard', () => {
    it('should generate analytics dashboard', async () => {
      const mockSummary = {
        total_views: 5000,
        total_likes: 500,
        total_carousels: 4,
        avg_engagement_rate: 10,
      };

      const mockTopContent = [
        { id: 'content-1', carousel_id: 'carousel-123', rank: 1 },
      ];

      (analyticsRepository.getUserPerformanceSummary as jest.Mock).mockResolvedValue(
        mockSummary
      );
      (analyticsRepository.getTopPerformingContent as jest.Mock).mockResolvedValue(
        mockTopContent
      );
      (analyticsRepository.getEngagementTrends as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getAnalyticsDashboard('user-123', 'weekly');

      expect(result.period).toBe('weekly');
      expect(result.total_views).toBe(5000);
      expect(result.top_carousels).toHaveLength(1);
    });
  });

  describe('User Statistics', () => {
    it('should get user stats', async () => {
      const mockStats = {
        total_carousels: 10,
        published_carousels: 8,
        total_views: 50000,
        avg_engagement_rate: 12,
      };

      (analyticsRepository.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await analyticsService.getUserStats('user-123');

      expect(result.total_carousels).toBe(10);
      expect(result.total_views).toBe(50000);
    });
  });
});
