import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './utils/logger';
import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
