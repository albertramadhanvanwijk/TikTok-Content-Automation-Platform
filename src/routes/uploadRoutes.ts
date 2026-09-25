import { Router } from 'express';
import uploadController from '../controllers/UploadController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All upload routes require authentication
router.use(authMiddleware);

/**
 * POST /upload/image
 * Upload image file
 * Body: multipart/form-data with 'file' field
 */
router.post('/image', (req, res) => uploadController.uploadImage(req as any, res));

export default router;