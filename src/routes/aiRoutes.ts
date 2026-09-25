import { Router } from 'express';
import aiController from '../controllers/AIController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All AI routes require authentication
router.use(authMiddleware);

/**
 * POST /ai/generate-carousel
 * Generate carousel from topic using AI
 * Body: { topic, style?, slides_count?, template_id? }
 */
router.post('/generate-carousel', (req, res) =>
  aiController.generateCarousel(req as any, res)
);

/**
 * POST /ai/notion/setup
 * Setup Notion database integration
 * Body: { notion_database_id }
 */
router.post('/notion/setup', (req, res) =>
  aiController.setupNotionIntegration(req as any, res)
);

/**
 * POST /ai/notion/sync
 * Sync Notion pages and generate carousels
 * Body: { notion_database_id, template_id? }
 */
router.post('/notion/sync', (req, res) =>
  aiController.syncNotionAndGenerate(req as any, res)
);

/**
 * POST /ai/carousels/:carouselId/enhance
 * Enhance carousel slides with AI
 * Body: { instruction }
 */
router.post('/carousels/:carouselId/enhance', (req, res) =>
  aiController.enhanceSlides(req as any, res)
);

/**
 * GET /ai/design-suggestion
 * Get design recommendations for topic
 * Query: topic, style?
 */
router.get('/design-suggestion', (req, res) =>
  aiController.suggestDesign(req as any, res)
);

/**
 * GET /ai/generate-hashtags
 * Generate hashtags for content
 * Query: title, topic
 */
router.get('/generate-hashtags', (req, res) =>
  aiController.generateHashtags(req as any, res)
);

export default router;
