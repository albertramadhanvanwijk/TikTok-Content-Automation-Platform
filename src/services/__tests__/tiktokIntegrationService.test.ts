import tiktokIntegrationService from '../../services/tiktokIntegrationService';
import tiktokService from '../../services/tiktokService';
import tiktokRepository from '../../repositories/TikTokRepository';
import contentRepository from '../../repositories/ContentRepository';
import fs from 'fs';

jest.mock('../../services/tiktokService');
jest.mock('../../repositories/TikTokRepository');
jest.mock('../../repositories/ContentRepository');
jest.mock('fs');

describe('TikTokIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Management', () => {
    it('should connect TikTok account successfully', async () => {
      const mockTokenResponse = {
        access_token: 'access_token_123',
        expires_in: 86400,
        refresh_token: 'refresh_token_123',
      };

      const mockAccount = {
        id: 'account-123',
        user_id: 'user-123',
        tiktok_user_id: 'tiktok-user-123',
        username: 'tiktok_user',
        access_token: mockTokenResponse.access_token,
        token_expires_at: new Date(Date.now() + 86400000),
      };

      (tiktokService.getAccessToken as jest.Mock).mockResolvedValue(
        mockTokenResponse
      );
      (tiktokRepository.createAccount as jest.Mock).mockResolvedValue(mockAccount);

      const result = await tiktokIntegrationService.connectAccount(
        'user-123',
        'auth_code_123',
        'https://callback.url'
      );

      expect(result.id).toBe('account-123');
      expect(tiktokService.getAccessToken).toHaveBeenCalledWith('auth_code_123');
    });

    it('should disconnect TikTok account', async () => {
      (tiktokRepository.disconnectAccount as jest.Mock).mockResolvedValue(
        undefined
      );

      await expect(
        tiktokIntegrationService.disconnectAccount('account-123')
      ).resolves.not.toThrow();

      expect(tiktokRepository.disconnectAccount).toHaveBeenCalledWith('account-123');
    });

    it('should get user TikTok accounts', async () => {
      const mockAccounts = [
        { id: 'account-1', username: 'user1' },
        { id: 'account-2', username: 'user2' },
      ];

      (tiktokRepository.getUserAccounts as jest.Mock).mockResolvedValue(
        mockAccounts
      );

      const result = await tiktokIntegrationService.getUserAccounts('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('user1');
    });

    it('should refresh account token', async () => {
      const mockAccount = {
        id: 'account-123',
        refresh_token: 'refresh_token_123',
      };

      const mockTokenResponse = {
        access_token: 'new_access_token',
        expires_in: 86400,
        refresh_token: 'new_refresh_token',
      };

      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (tiktokService.refreshAccessToken as jest.Mock).mockResolvedValue(
        mockTokenResponse
      );
      (tiktokRepository.updateAccessToken as jest.Mock).mockResolvedValue(
        undefined
      );

      await expect(
        tiktokIntegrationService.refreshAccountToken('account-123')
      ).resolves.not.toThrow();

      expect(tiktokService.refreshAccessToken).toHaveBeenCalledWith(
        'refresh_token_123'
      );
    });
  });

  describe('Upload Job Management', () => {
    it('should create upload job successfully', async () => {
      const mockCarousel = { id: 'carousel-123', user_id: 'user-123' };
      const mockAccount = { id: 'account-123', user_id: 'user-123' };
      const mockJob = {
        id: 'job-123',
        user_id: 'user-123',
        carousel_id: 'carousel-123',
        status: 'pending',
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(
        mockCarousel
      );
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (tiktokRepository.createUploadJob as jest.Mock).mockResolvedValue(mockJob);
      (tiktokRepository.logUploadEvent as jest.Mock).mockResolvedValue(undefined);

      const result = await tiktokIntegrationService.createUploadJob('user-123', {
        carousel_id: 'carousel-123',
        tiktok_account_id: 'account-123',
        video_file_path: '/path/to/video.mp4',
        title: 'My Video',
        description: 'Test video',
      });

      expect(result.id).toBe('job-123');
      expect(result.status).toBe('pending');
    });

    it('should reject job creation if carousel not found', async () => {
      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(null);

      await expect(
        tiktokIntegrationService.createUploadJob('user-123', {
          carousel_id: 'invalid-carousel',
          tiktok_account_id: 'account-123',
          video_file_path: '/path/to/video.mp4',
          title: 'My Video',
        })
      ).rejects.toThrow('Carousel not found');
    });

    it('should reject job creation if account not found or unauthorized', async () => {
      const mockCarousel = { id: 'carousel-123', user_id: 'user-123' };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(
        mockCarousel
      );
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(null);

      await expect(
        tiktokIntegrationService.createUploadJob('user-123', {
          carousel_id: 'carousel-123',
          tiktok_account_id: 'invalid-account',
          video_file_path: '/path/to/video.mp4',
          title: 'My Video',
        })
      ).rejects.toThrow('TikTok account not found');
    });

    it('should reject job creation if video file not found', async () => {
      const mockCarousel = { id: 'carousel-123', user_id: 'user-123' };
      const mockAccount = { id: 'account-123', user_id: 'user-123' };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(
        mockCarousel
      );
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        tiktokIntegrationService.createUploadJob('user-123', {
          carousel_id: 'carousel-123',
          tiktok_account_id: 'account-123',
          video_file_path: '/path/to/nonexistent.mp4',
          title: 'My Video',
        })
      ).rejects.toThrow('Video file not found');
    });

    it('should get carousel upload jobs', async () => {
      const mockJobs = [
        { id: 'job-1', status: 'published' },
        { id: 'job-2', status: 'pending' },
      ];

      (tiktokRepository.getCarouselUploadJobs as jest.Mock).mockResolvedValue(
        mockJobs
      );

      const result = await tiktokIntegrationService.getCarouselUploadJobs(
        'carousel-123'
      );

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('published');
    });
  });

  describe('Upload Processing', () => {
    it('should process upload job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        carousel_id: 'carousel-123',
        tiktok_account_id: 'account-123',
        video_file_path: '/path/to/video.mp4',
        title: 'My Video',
        description: 'Test',
      };

      const mockAccount = {
        id: 'account-123',
        access_token: 'access_token_123',
        token_expires_at: new Date(Date.now() + 86400000),
      };

      const mockUploadResponse = {
        data: { video_id: 'video-123' },
      };

      (tiktokRepository.getUploadJobById as jest.Mock)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce(mockJob);
      (tiktokRepository.updateUploadJobStatus as jest.Mock).mockResolvedValue(
        undefined
      );
      (tiktokRepository.logUploadEvent as jest.Mock).mockResolvedValue(undefined);
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('video data'));
      (tiktokService.uploadVideo as jest.Mock).mockResolvedValue(mockUploadResponse);
      (contentRepository.updateCarouselStatus as jest.Mock).mockResolvedValue(
        undefined
      );

      const result = await tiktokIntegrationService.processUploadJob('job-123');

      expect(result.success).toBe(true);
      expect(result.videoId).toBe('video-123');
      expect(tiktokService.uploadVideo).toHaveBeenCalled();
    });

    it('should handle upload job failure and retry', async () => {
      const mockJob = {
        id: 'job-123',
        carousel_id: 'carousel-123',
        tiktok_account_id: 'account-123',
        video_file_path: '/path/to/video.mp4',
        title: 'My Video',
      };

      const mockAccount = {
        id: 'account-123',
        access_token: 'access_token_123',
        token_expires_at: new Date(Date.now() + 86400000),
      };

      (tiktokRepository.getUploadJobById as jest.Mock)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce(mockJob);
      (tiktokRepository.updateUploadJobStatus as jest.Mock).mockResolvedValue(
        undefined
      );
      (tiktokRepository.logUploadEvent as jest.Mock).mockResolvedValue(undefined);
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('video data'));
      (tiktokService.uploadVideo as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );
      (tiktokRepository.incrementRetryCount as jest.Mock).mockResolvedValue(
        undefined
      );

      await expect(
        tiktokIntegrationService.processUploadJob('job-123')
      ).rejects.toThrow('Upload failed');

      expect(tiktokRepository.incrementRetryCount).toHaveBeenCalledWith('job-123');
    });

    it('should process pending jobs', async () => {
      const mockJobs = [
        { id: 'job-1', carousel_id: 'carousel-1', tiktok_account_id: 'account-1' },
        { id: 'job-2', carousel_id: 'carousel-2', tiktok_account_id: 'account-2' },
      ];

      (tiktokRepository.getPendingUploadJobs as jest.Mock).mockResolvedValue(
        mockJobs
      );

      // Mock successful processing
      jest
        .spyOn(tiktokIntegrationService, 'processUploadJob')
        .mockResolvedValue({ success: true, videoId: 'video-123' });

      await expect(
        tiktokIntegrationService.processPendingJobs()
      ).resolves.not.toThrow();

      expect(tiktokRepository.getPendingUploadJobs).toHaveBeenCalled();
    });
  });

  describe('Job Status & Metrics', () => {
    it('should get upload job status with metrics', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'published',
        tiktok_video_id: 'video-123',
        tiktok_account_id: 'account-123',
      };

      const mockLogs = [
        { status: 'created', message: 'Job created' },
        { status: 'published', message: 'Video published' },
      ];

      const mockMetrics = {
        video_id: 'video-123',
        like_count: 1000,
        share_count: 100,
      };

      const mockAccount = { access_token: 'access_token_123' };

      (tiktokRepository.getUploadJobById as jest.Mock).mockResolvedValue(mockJob);
      (tiktokRepository.getUploadLogs as jest.Mock).mockResolvedValue(mockLogs);
      (tiktokRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (tiktokService.getVideoMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await tiktokIntegrationService.getUploadJobStatus('job-123');

      expect(result.job.status).toBe('published');
      expect(result.logs).toHaveLength(2);
      expect(result.metrics.like_count).toBe(1000);
    });
  });
});
