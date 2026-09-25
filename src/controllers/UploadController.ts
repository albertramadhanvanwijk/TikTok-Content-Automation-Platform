import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'images');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

class UploadController {
  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: { message: 'Unauthorized', status: 401 },
        });
        return;
      }

      // Check if file exists in request
      if (!req.file) {
        res.status(400).json({
          error: { message: 'No file uploaded', status: 400 },
        });
        return;
      }

      const file = req.file;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        res.status(400).json({
          error: { message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF', status: 400 },
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        res.status(400).json({
          error: { message: 'File too large. Maximum 10MB', status: 400 },
        });
        return;
      }

      // Generate unique filename
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Save file
      fs.writeFileSync(filepath, file.buffer);

      // Generate public URL
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const url = `${baseUrl}/uploads/images/${filename}`;

      logger.info(`Image uploaded: ${filename} by user ${req.userId}`);

      res.status(200).json({
        status: 'success',
        data: { url, filename },
      });
    } catch (error: any) {
      logger.error('Upload image error', error);
      res.status(500).json({
        error: { message: error.message || 'Failed to upload image', status: 500 },
      });
    }
  }
}

export default new UploadController();