import request from 'supertest';
import app from '../../index';
import tiktokIntegrationService from '../../services/tiktokIntegrationService';
import tiktokService from '../../services/tiktokService';

jest.mock('../../services/tiktokIntegrationService');
jest.mock('../../services/tiktokService');

describe('TikTokController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Management Endpoints', () => {
    it('should get auth URL', async () => {
      const mockAuthUrl = 'https://tiktok.com/oauth/authorize?...';
      (tiktokService.buildAuthorizationUrl as jest.Mock).mockReturnValue(
        mockAuthUrl
      );

      const response = await request(app)
        .get('/tiktok/auth-url?redirect_uri=https://callback.url')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.auth_url).toBeDefined();
    });

    it('should connect TikTok account', async () => {
      const mockAccount = {
        id: 'account-123',
        username: 'tiktok_user',
        is_connected: true,
      };

      (tiktokIntegrationService.connectAccount as jest.Mock).mockResolvedValue(
        mockAccount
      );

      const response = await request(app)
        .post('/tiktok/connect')
        .set('Authorization', 'Bearer valid_token')
        .send({
          code: 'auth_code_123',
          redirect_uri: 'https://callback.url',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.account.id).toBe('account-123');
    });

    it('should get user TikTok accounts', async () => {
      const mockAccounts = [
        { id: 'account-1', username: 'user1' },
        { id: 'account-2', username: 'user2' },
      ];

      (tiktokIntegrationService.getUserAccounts as jest.Mock).mockResolvedValue(
        mockAccounts
      );

      const response = await request(app)
        .get('/tiktok/accounts')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.accounts).toHaveLength(2);
    });

    it('should disconnect TikTok account', async () => {
      (tiktokIntegrationService.disconnectAccount as jest.Mock).mockResolvedValue(
        undefined
      );

      const response = await request(app)
        .post('/tiktok/accounts/account-123/disconnect')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('disconnected');
    });
  });

  describe('Upload Job Endpoints', () => {
    it('should create upload job', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'pending',
        carousel_id: 'carousel-123',
      };

      (tiktokIntegrationService.createUploadJob as jest.Mock).mockResolvedValue(
        mockJob
      );

      const response = await request(app)
        .post('/tiktok/upload-jobs')
        .set('Authorization', 'Bearer valid_token')
        .send({
          carousel_id: 'carousel-123',
          tiktok_account_id: 'account-123',
          video_file_path: '/path/to/video.mp4',
          title: 'My Video',
          description: 'Test',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.job.status).toBe('pending');
    });

    it('should get carousel upload jobs', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'published' },
        { id: 'job-2', status: 'pending' },
      ];

      (tiktokIntegrationService.getCarouselUploadJobs as jest.Mock).mockResolvedValue(
        mockJobs
      );

      const response = await request(app)
        .get('/tiktok/carousels/carousel-123/upload-jobs')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.jobs).toHaveLength(2);
    });

    it('should get upload job status', async () => {
      const mockResult = {
        job: { id: 'job-123', status: 'published' },
        logs: [{ status: 'created', message: 'Created' }],
        metrics: { like_count: 1000 },
      };

      (tiktokIntegrationService.getUploadJobStatus as jest.Mock).mockResolvedValue(
        mockResult
      );

      const response = await request(app)
        .get('/tiktok/upload-jobs/job-123')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.job.status).toBe('published');
      expect(response.body.data.metrics.like_count).toBe(1000);
    });

    it('should process upload job', async () => {
      const mockResult = { success: true, videoId: 'video-123' };

      (tiktokIntegrationService.processUploadJob as jest.Mock).mockResolvedValue(
        mockResult
      );

      const response = await request(app)
        .post('/tiktok/upload-jobs/job-123/process')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.videoId).toBe('video-123');
    });
  });

  describe('Authorization', () => {
    it('should require auth for all TikTok endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/tiktok/accounts' },
        { method: 'post', path: '/tiktok/connect' },
        { method: 'post', path: '/tiktok/upload-jobs' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle upload job creation errors', async () => {
      (tiktokIntegrationService.createUploadJob as jest.Mock).mockRejectedValue(
        new Error('Carousel not found')
      );

      const response = await request(app)
        .post('/tiktok/upload-jobs')
        .set('Authorization', 'Bearer valid_token')
        .send({
          carousel_id: 'invalid-carousel',
          tiktok_account_id: 'account-123',
          video_file_path: '/path/to/video.mp4',
          title: 'My Video',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Carousel not found');
    });
  });
});
