import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: {
          message: 'Missing authorization token',
          status: 401,
        },
      });
      return;
    }

    const payload = authService.verifyToken(token);

    req.userId = payload.userId;
    req.email = payload.email;

    logger.debug(`Auth middleware: User ${payload.userId} authenticated`);
    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        status: 401,
      },
    });
  }
};

export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const payload = authService.verifyToken(token);
      req.userId = payload.userId;
      req.email = payload.email;
      logger.debug(`Optional auth middleware: User ${payload.userId} authenticated`);
    }

    next();
  } catch (error) {
    logger.debug('Optional auth middleware: No valid token, continuing as guest');
    next();
  }
};
