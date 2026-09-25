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
 * GET /auth/profile
 * Get current user profile (requires auth)
 * Headers: { Authorization: "Bearer <token>" }
 */
router.get('/profile', authMiddleware, (req, res) => 
  authController.getProfile(req as any, res)
);

export default router;
