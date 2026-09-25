import { Router } from 'express';
import authController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 * Body: { username, email, password, full_name? }
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * POST /auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * POST /auth/refresh
 * Refresh access token using refresh token cookie
 */
router.post('/refresh', (req, res) => authController.refresh(req, res));

/**
 * POST /auth/logout
 * Logout user - clears auth cookies
 */
router.post('/logout', (req, res) => authController.logout(req, res));

/**
 * PUT /auth/profile
 * Update user profile
 * Body: { full_name, email }
 */
router.put('/profile', authMiddleware, (req, res) =>
  authController.updateProfile(req as any, res)
);

/**
 * POST /auth/change-password
 * Change user password
 * Body: { current_password, new_password }
 */
router.post('/change-password', authMiddleware, (req, res) =>
  authController.changePassword(req as any, res)
);

/**
 * GET /auth/profile
 * Get current user profile (requires auth)
 * Headers: { Authorization: "Bearer <token>" }
 */
router.get('/profile', authMiddleware, (req, res) =>
  authController.getProfile(req as any, res)
);

export default router;
