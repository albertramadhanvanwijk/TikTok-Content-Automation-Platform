import { Router } from 'express';
import multer from 'multer';
import uploadController from '../controllers/UploadController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Configure multer for upload route
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// All upload routes require authentication
router.use(authMiddleware);

/**
 * POST /upload/image
 * Upload image file
 * Body: multipart/form-data with 'file' field
 */
router.post('/image', upload.single('file'), (req, res) => uploadController.uploadImage(req as any, res));

export default router;