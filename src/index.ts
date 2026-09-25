import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import logger from './utils/logger';
import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';
import tiktokRoutes from './routes/tiktokRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import aiRoutes from './routes/aiRoutes';
import uploadRoutes from './routes/uploadRoutes';
import tiktokScheduler from './scheduler/tiktokScheduler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Configure multer for file uploads
multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((_req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${_req.method} ${_req.path}`);
  next();
});

// Serve static files (uploaded images)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/tiktok', tiktokRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/ai', aiRoutes);
app.use('/upload', uploadRoutes);

// Multer error handling
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: { message: 'File too large. Maximum size is 10MB', status: 400 },
      });
    }
    return res.status(400).json({
      error: { message: err.message, status: 400 },
    });
  }
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: { message: err.message, status: 400 },
    });
  }
  return next(err);
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start TikTok scheduler
  try {
    tiktokScheduler.start();
  } catch (error) {
    logger.error('Failed to start TikTok scheduler', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  tiktokScheduler.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  tiktokScheduler.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;