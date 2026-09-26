import { Response } from 'express';
import tiktokIntegrationService from '../services/tiktokIntegrationService';
import tiktokService from '../services/tiktokService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class TikTokController {
  /**
   * Get TikTok OAuth authorization URL
   */
  async getAuthUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { redirect_uri } = req.query;

      if (!redirect_uri) {
        res.status(400).json({
          error: {
            message: 'redirect_uri is required',
            status: 400,
          },
        });
        return;
      }

      const state = `${req.userId}_${Date.now()}`;
      const authUrl = tiktokService.buildAuthorizationUrl(
        state,
        redirect_uri as string
      );
      const isMock = authUrl.includes('mock=1') || !process.env.TIKTOK_CLIENT_KEY;

      res.status(200).json({
        status: 'success',
        data: {
          auth_url: authUrl,
          state,
          ...(isMock ? { mock: true, mock_reason: 'TIKTOK_CLIENT_KEY missing' } : {}),
        },
      });
    } catch (error: any) {
      logger.error('Get auth URL error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get auth URL',
          status: 400,
        },
      });
    }
  }

  /**
   * Connect TikTok account (OAuth callback)
   */
  async connectAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { code, redirect_uri } = req.body;

      if (!code || !redirect_uri) {
        res.status(400).json({
          error: {
            message: 'code and redirect_uri are required',
            status: 400,
          },
        });
        return;
      }

      const account = await tiktokIntegrationService.connectAccount(
        req.userId,
        code,
        redirect_uri
      );

      res.status(201).json({
        status: 'success',
        data: { account },
      });
    } catch (error: any) {
      logger.error('Connect account error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to connect TikTok account',
          status: 400,
        },
      });
    }
  }

  /**
   * Get user's TikTok accounts
   */
  async getAccounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const accounts = await tiktokIntegrationService.getUserAccounts(req.userId);

      res.status(200).json({
        status: 'success',
        data: { accounts },
      });
    } catch (error: any) {
      logger.error('Get accounts error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get TikTok accounts',
          status: 400,
        },
      });
    }
  }

  /**
   * Disconnect TikTok account
   */
  async disconnectAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      await tiktokIntegrationService.disconnectAccount(accountId);

      res.status(200).json({
        status: 'success',
        message: 'TikTok account disconnected',
      });
    } catch (error: any) {
      logger.error('Disconnect account error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to disconnect TikTok account',
          status: 400,
        },
      });
    }
  }

  /**
   * Create upload job
   */
  async createUploadJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const {
        carousel_id,
        tiktok_account_id,
        video_file_path,
        title,
        description,
        scheduled_at,
      } = req.body;

      if (!carousel_id || !tiktok_account_id || !video_file_path || !title) {
        res.status(400).json({
          error: {
            message:
              'carousel_id, tiktok_account_id, video_file_path, and title are required',
            status: 400,
          },
        });
        return;
      }

      const job = await tiktokIntegrationService.createUploadJob(req.userId, {
        carousel_id,
        tiktok_account_id,
        video_file_path,
        title,
        description,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
      });

      res.status(201).json({
        status: 'success',
        data: { job },
      });
    } catch (error: any) {
      logger.error('Create upload job error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to create upload job',
          status: 400,
        },
      });
    }
  }

  /**
   * Get carousel upload jobs
   */
  async getCarouselUploadJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;

      const jobs = await tiktokIntegrationService.getCarouselUploadJobs(carouselId);

      res.status(200).json({
        status: 'success',
        data: { jobs },
      });
    } catch (error: any) {
      logger.error('Get carousel upload jobs error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get upload jobs',
          status: 400,
        },
      });
    }
  }

  /**
   * Get upload job status and metrics
   */
  async getUploadJobStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const result = await tiktokIntegrationService.getUploadJobStatus(jobId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      logger.error('Get upload job status error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get upload job status',
          status: 400,
        },
      });
    }
  }

  /**
   * Process upload job immediately (manual trigger)
   */
  async processUploadJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const result = await tiktokIntegrationService.processUploadJob(jobId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      logger.error('Process upload job error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to process upload job',
          status: 400,
        },
      });
    }
  }
}

export default new TikTokController();
