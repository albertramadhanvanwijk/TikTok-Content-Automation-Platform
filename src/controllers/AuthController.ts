import { Request, Response } from 'express';
import userService from '../services/userService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, full_name } = req.body;

      // Validate input
      if (!username || !email || !password) {
        res.status(400).json({
          error: {
            message: 'Username, email, and password are required',
            status: 400,
          },
        });
        return;
      }

      // Validate email format
      const isValidEmail = await userService.validateEmail(email);
      if (!isValidEmail) {
        res.status(400).json({
          error: {
            message: 'Invalid email format',
            status: 400,
          },
        });
        return;
      }

      // Validate username
      const usernameValidation = await userService.validateUsername(username);
      if (!usernameValidation.isValid) {
        res.status(400).json({
          error: {
            message: usernameValidation.errors.join(', '),
            status: 400,
          },
        });
        return;
      }

      const user = await userService.register({
        username,
        email,
        password,
        full_name,
      });

      logger.info(`User registered: ${user.id}`);

      res.status(201).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error: any) {
      logger.error('Register error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Registration failed',
          status: 400,
        },
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          error: {
            message: 'Email and password are required',
            status: 400,
          },
        });
        return;
      }

      const { user, tokens } = await userService.login(email, password);

      logger.info(`User logged in: ${user.id}`);

      res.status(200).json({
        status: 'success',
        data: {
          user,
          tokens,
        },
      });
    } catch (error: any) {
      logger.error('Login error', error);
      res.status(401).json({
        error: {
          message: error.message || 'Login failed',
          status: 401,
        },
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: {
            message: 'Unauthorized',
            status: 401,
          },
        });
        return;
      }

      const user = await userService.getProfile(req.userId);

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error: any) {
      logger.error('Get profile error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get profile',
          status: 400,
        },
      });
    }
  }
}

export default new AuthController();
