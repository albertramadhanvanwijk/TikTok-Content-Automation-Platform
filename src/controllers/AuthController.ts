import { Request, Response } from 'express';
import userService from '../services/userService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class AuthController {
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

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

      // Generate tokens
      const tokens = await userService.login(email, password);

      logger.info(`User registered: ${user.id}`);

      // Set auth cookies
      this.setAuthCookies(res, tokens.tokens.accessToken, tokens.tokens.refreshToken);

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

      // Set auth cookies
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        status: 'success',
        data: {
          user,
          tokens,
        },
      });
    } catch (error: any) {
      logger.error('Login error', error);
      const status = error.message.includes('not found') ? 404 : 401;
      res.status(status).json({
        error: {
          message: error.message || 'Login failed',
          status,
        },
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({
          error: { message: 'Refresh token required', status: 401 },
        });
        return;
      }

      const tokens = await userService.refreshToken(refreshToken);
      
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        status: 'success',
        data: { tokens },
      });
    } catch (error: any) {
      logger.error('Token refresh error', error);
      this.clearAuthCookies(res);
      res.status(401).json({
        error: { message: 'Invalid refresh token', status: 401 },
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    this.clearAuthCookies(res);
    res.status(200).json({ status: 'success', message: 'Logged out' });
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

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: { message: 'Unauthorized', status: 401 },
        });
        return;
      }

      const { full_name, email } = req.body;

      if (!full_name && !email) {
        res.status(400).json({
          error: { message: 'At least one field (full_name or email) is required', status: 400 },
        });
        return;
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await userService.findByEmail(email);
        if (existingUser && existingUser.id !== req.userId) {
          res.status(400).json({
            error: { message: 'Email already in use', status: 400 },
          });
          return;
        }
      }

      const user = await userService.updateProfile(req.userId, { full_name, email });

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error: any) {
      logger.error('Update profile error', error);
      res.status(400).json({
        error: { message: error.message || 'Failed to update profile', status: 400 },
      });
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: { message: 'Unauthorized', status: 401 },
        });
        return;
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        res.status(400).json({
          error: { message: 'Current password and new password are required', status: 400 },
        });
        return;
      }

      if (new_password.length < 8) {
        res.status(400).json({
          error: { message: 'New password must be at least 8 characters', status: 400 },
        });
        return;
      }

      await userService.changePassword(req.userId, current_password, new_password);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error', error);
      const status = error.message.includes('incorrect') ? 401 : 400;
      res.status(status).json({
        error: { message: error.message || 'Failed to change password', status },
      });
    }
  }
}

export default new AuthController();
