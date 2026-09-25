import { Router } from 'express';
import tiktokController from '../controllers/TikTokController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All TikTok routes require authentication
router.use(authMiddleware);

/**
 * GET /tiktok/auth-url
 * Get TikTok OAuth authorization URL
 * Query: redirect_uri
 */
router.get('/auth-url', (req, res) => tiktokController.getAuthUrl(req as any, res));

/**
 * POST /tiktok/connect
 * Connect TikTok account (OAuth callback)
 * Body: { code, redirect_uri }
 */
router.post('/connect', (req, res) => tiktokController.connectAccount(req as any, res));

/**
 * GET /tiktok/accounts
 * Get all user's connected TikTok accounts
 */
router.get('/accounts', (req, res) => tiktokController.getAccounts(req as any, res));

/**
 * POST /tiktok/accounts/:accountId/disconnect
 * Disconnect TikTok account
 */
router.post('/accounts/:accountId/disconnect', (req, res) =>
  tiktokController.disconnectAccount(req as any, res)
);

/**
 * POST /tiktok/upload-jobs
 * Create upload job for carousel
 * Body: { carousel_id, tiktok_account_id, video_file_path, title, description?, scheduled_at? }
 */
router.post('/upload-jobs', (req, res) =>
  tiktokController.createUploadJob(req as any, res)
);

/**
 * GET /tiktok/carousels/:carouselId/upload-jobs
 * Get all upload jobs for carousel
 */
router.get('/carousels/:carouselId/upload-jobs', (req, res) =>
  tiktokController.getCarouselUploadJobs(req as any, res)
);

/**
 * GET /tiktok/upload-jobs/:jobId
 * Get upload job status and metrics
 */
router.get('/upload-jobs/:jobId', (req, res) =>
  tiktokController.getUploadJobStatus(req as any, res)
);

/**
 * POST /tiktok/upload-jobs/:jobId/process
 * Process upload job immediately (manual trigger)
 */
router.post('/upload-jobs/:jobId/process', (req, res) =>
  tiktokController.processUploadJob(req as any, res)
);

export default router;
