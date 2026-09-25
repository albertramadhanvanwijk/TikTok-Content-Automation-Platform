import tiktokService from './tiktokService';
import tiktokRepository from '../repositories/TikTokRepository';
import contentRepository from '../repositories/ContentRepository';
import { CreateUploadJobInput } from '../models/TikTok';
import logger from '../utils/logger';
import fs from 'fs';

class TikTokIntegrationService {
  /**
   * Connect TikTok account (OAuth flow)
   */
  async connectAccount(userId: string, code: string, redirectUri: string) {
    try {
      // Get access token using authorization code
      const tokenResponse = await tiktokService.getAccessToken(code);

      // Get user info (would need to implement in TikTokService)
      // For now, we'll store the token and can fetch user info later
      const tiktokUserId = `user_${Date.now()}`; // Placeholder
      const username = `tiktok_user_${Date.now()}`; // Placeholder

      const expiresAt = new Date(
        Date.now() + (tokenResponse.expires_in * 1000)
      );

      const account = await tiktokRepository.createAccount(
        userId,
        tiktokUserId,
        username,
        username,
        tokenResponse.access_token,
        tokenResponse.refresh_token || null,
        expiresAt
      );

      logger.info(`TikTok account connected: ${account.id}`);
      return account;
    } catch (error) {
      logger.error('Error connecting TikTok account', error);
      throw error;
    }
  }

  /**
   * Disconnect TikTok account
   */
  async disconnectAccount(accountId: string) {
    try {
      await tiktokRepository.disconnectAccount(accountId);
      logger.info(`TikTok account disconnected: ${accountId}`);
    } catch (error) {
      logger.error('Error disconnecting TikTok account', error);
      throw error;
    }
  }

  /**
   * Create upload job for carousel
   */
  async createUploadJob(userId: string, input: CreateUploadJobInput) {
    try {
      // Validate carousel exists
      const carousel = await contentRepository.getCarouselById(input.carousel_id);
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Validate TikTok account exists and belongs to user
      const account = await tiktokRepository.getAccountById(input.tiktok_account_id);
      if (!account || account.user_id !== userId) {
        throw new Error('TikTok account not found or unauthorized');
      }

      // Validate video file exists
      if (!fs.existsSync(input.video_file_path)) {
        throw new Error('Video file not found');
      }

      // Create upload job
      const job = await tiktokRepository.createUploadJob(userId, input);

      await tiktokRepository.logUploadEvent(
        job.id,
        'created',
        'Upload job created'
      );

      logger.info(`Upload job created: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Error creating upload job', error);
      throw error;
    }
  }

  /**
   * Process upload job (execute immediate or at scheduled time)
   */
  async processUploadJob(jobId: string) {
    try {
      const job = await tiktokRepository.getUploadJobById(jobId);
      if (!job) {
        throw new Error('Upload job not found');
      }

      // Update status to uploading
      await tiktokRepository.updateUploadJobStatus(jobId, 'uploading');
      await tiktokRepository.logUploadEvent(
        jobId,
        'uploading',
        'Starting upload to TikTok'
      );

      // Get TikTok account and validate token
      const account = await tiktokRepository.getAccountById(job.tiktok_account_id);
      if (!account) {
        throw new Error('TikTok account not found');
      }

      // Check token expiration and refresh if needed
      const now = new Date();
      if (account.token_expires_at <= now) {
        await this.refreshAccountToken(account.id);
      }

      // Read video file
      const videoBuffer = fs.readFileSync(job.video_file_path);

      // Upload to TikTok
      const uploadResponse = await tiktokService.uploadVideo(
        account.access_token,
        {
          video_file: videoBuffer,
          title: job.title,
          description: job.description || '',
        }
      );

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      // Update job with TikTok video ID and mark as published
      const videoId = uploadResponse.data.video_id;
      await tiktokRepository.updateUploadJobStatus(
        jobId,
        'published',
        videoId
      );

      await tiktokRepository.logUploadEvent(
        jobId,
        'published',
        `Video published to TikTok: ${videoId}`,
        { video_id: videoId }
      );

      // Update carousel status to published
      await contentRepository.updateCarouselStatus(job.carousel_id, 'published');

      logger.info(`Upload job completed: ${jobId} -> TikTok video: ${videoId}`);
      return { success: true, videoId };
    } catch (error: any) {
      logger.error('Error processing upload job', error);

      // Update job status to failed
      await tiktokRepository.updateUploadJobStatus(
        jobId,
        'failed',
        undefined,
        error.message
      );

      await tiktokRepository.logUploadEvent(
        jobId,
        'failed',
        error.message,
        { error: error.toString() }
      );

      // Increment retry count
      await tiktokRepository.incrementRetryCount(jobId);

      throw error;
    }
  }

  /**
   * Refresh TikTok account token
   */
  async refreshAccountToken(accountId: string) {
    try {
      const account = await tiktokRepository.getAccountById(accountId);
      if (!account || !account.refresh_token) {
        throw new Error('Cannot refresh token: refresh_token not found');
      }

      const tokenResponse = await tiktokService.refreshAccessToken(
        account.refresh_token
      );

      const expiresAt = new Date(
        Date.now() + (tokenResponse.expires_in * 1000)
      );

      await tiktokRepository.updateAccessToken(
        accountId,
        tokenResponse.access_token,
        tokenResponse.refresh_token || account.refresh_token,
        expiresAt
      );

      logger.info(`TikTok token refreshed: ${accountId}`);
    } catch (error) {
      logger.error('Error refreshing TikTok token', error);
      throw error;
    }
  }

  /**
   * Get upload job status and metrics
   */
  async getUploadJobStatus(jobId: string) {
    try {
      const job = await tiktokRepository.getUploadJobById(jobId);
      if (!job) {
        throw new Error('Upload job not found');
      }

      const logs = await tiktokRepository.getUploadLogs(jobId);

      // If published, try to get metrics
      let metrics = null;
      if (job.status === 'published' && job.tiktok_video_id) {
        const account = await tiktokRepository.getAccountById(
          job.tiktok_account_id
        );
        if (account) {
          try {
            metrics = await tiktokService.getVideoMetrics(
              account.access_token,
              job.tiktok_video_id
            );
          } catch (error) {
            logger.warn('Could not fetch metrics for video', error);
          }
        }
      }

      return {
        job,
        logs,
        metrics,
      };
    } catch (error) {
      logger.error('Error getting upload job status', error);
      throw error;
    }
  }

  /**
   * Process all pending upload jobs (scheduler job)
   */
  async processPendingJobs() {
    try {
      const pendingJobs = await tiktokRepository.getPendingUploadJobs();

      if (pendingJobs.length === 0) {
        logger.debug('No pending upload jobs');
        return;
      }

      logger.info(`Processing ${pendingJobs.length} pending upload jobs`);

      for (const job of pendingJobs) {
        try {
          await this.processUploadJob(job.id);
        } catch (error) {
          logger.error(`Failed to process job ${job.id}`, error);
          // Continue to next job
        }
      }
    } catch (error) {
      logger.error('Error processing pending jobs', error);
    }
  }

  /**
   * Get all TikTok accounts for user
   */
  async getUserAccounts(userId: string) {
    try {
      return await tiktokRepository.getUserAccounts(userId);
    } catch (error) {
      logger.error('Error getting user TikTok accounts', error);
      throw error;
    }
  }

  /**
   * Get carousel upload jobs
   */
  async getCarouselUploadJobs(carouselId: string) {
    try {
      return await tiktokRepository.getCarouselUploadJobs(carouselId);
    } catch (error) {
      logger.error('Error getting carousel upload jobs', error);
      throw error;
    }
  }
}

export default new TikTokIntegrationService();
