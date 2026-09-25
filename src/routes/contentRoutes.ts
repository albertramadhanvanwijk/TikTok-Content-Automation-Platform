import { Router } from 'express';
import contentController from '../controllers/ContentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All content routes require authentication
router.use(authMiddleware);

// ===== TEMPLATE ROUTES =====

/**
 * POST /content/templates
 * Create a new template
 */
router.post('/templates', (req, res) => contentController.createTemplate(req as any, res));

/**
 * GET /content/templates
 * Get all user templates
 */
router.get('/templates', (req, res) => contentController.getTemplates(req as any, res));

// ===== CAROUSEL ROUTES =====

/**
 * POST /content/carousels
 * Create a new carousel
 */
router.post('/carousels', (req, res) => contentController.createCarousel(req as any, res));

/**
 * GET /content/carousels
 * Get all user carousels with optional filters
 * Query params: status, limit, offset
 */
router.get('/carousels', (req, res) => contentController.getCarousels(req as any, res));

/**
 * GET /content/carousels/:id
 * Get specific carousel
 */
router.get('/carousels/:id', (req, res) => contentController.getCarousel(req as any, res));

/**
 * POST /content/carousels/:id/publish
 * Publish carousel
 */
router.post('/carousels/:id/publish', (req, res) =>
  contentController.publishCarousel(req as any, res)
);

/**
 * POST /content/carousels/:id/schedule
 * Schedule carousel for future publishing
 * Body: { scheduled_at: "2026-09-26T10:00:00Z" }
 */
router.post('/carousels/:id/schedule', (req, res) =>
  contentController.scheduleCarousel(req as any, res)
);

/**
 * POST /content/carousels/:id/archive
 * Archive carousel
 */
router.post('/carousels/:id/archive', (req, res) =>
  contentController.archiveCarousel(req as any, res)
);

// ===== SLIDE ROUTES =====

/**
 * POST /content/carousels/:carouselId/slides
 * Create a new slide for carousel
 */
router.post('/carousels/:carouselId/slides', (req, res) =>
  contentController.createSlide(req as any, res)
);

/**
 * GET /content/carousels/:carouselId/slides
 * Get all slides for carousel
 */
router.get('/carousels/:carouselId/slides', (req, res) =>
  contentController.getSlides(req as any, res)
);

/**
 * PUT /content/slides/:slideId
 * Update slide
 */
router.put('/slides/:slideId', (req, res) =>
  contentController.updateSlide(req as any, res)
);

/**
 * DELETE /content/slides/:slideId
 * Delete slide
 */
router.delete('/slides/:slideId', (req, res) =>
  contentController.deleteSlide(req as any, res)
);

// ===== METRICS ROUTES =====

/**
 * GET /content/carousels/:carouselId/metrics
 * Get carousel metrics
 */
router.get('/carousels/:carouselId/metrics', (req, res) =>
  contentController.getMetrics(req as any, res)
);

export default router;
