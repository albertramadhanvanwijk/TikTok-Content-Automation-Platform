import { Response } from 'express';
import contentService from '../services/contentService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class ContentController {
  // ===== TEMPLATE ENDPOINTS =====

  async createTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { name, description, style_name, style_data, is_public } = req.body;

      if (!name || !style_name || !style_data) {
        res.status(400).json({
          error: {
            message: 'name, style_name, and style_data are required',
            status: 400,
          },
        });
        return;
      }

      const template = await contentService.createTemplate(req.userId, {
        name,
        description,
        style_name,
        style_data,
        is_public,
      });

      res.status(201).json({
        status: 'success',
        data: { template },
      });
    } catch (error: any) {
      logger.error('Create template error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to create template',
          status: 400,
        },
      });
    }
  }

  async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const templates = await contentService.getUserTemplates(req.userId);

      res.status(200).json({
        status: 'success',
        data: { templates },
      });
    } catch (error: any) {
      logger.error('Get templates error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get templates',
          status: 400,
        },
      });
    }
  }

  // ===== CAROUSEL ENDPOINTS =====

  async createCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { title, description, template_id, category, tags } = req.body;

      if (!title) {
        res.status(400).json({
          error: { message: 'title is required', status: 400 },
        });
        return;
      }

      const carousel = await contentService.createCarousel(req.userId, {
        title,
        description,
        template_id,
        category,
        tags,
      });

      res.status(201).json({
        status: 'success',
        data: { carousel },
      });
    } catch (error: any) {
      logger.error('Create carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to create carousel',
          status: 400,
        },
      });
    }
  }

  async getCarousels(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await contentService.getUserCarousels(
        req.userId,
        status,
        limit,
        offset
      );

      res.status(200).json({
        status: 'success',
        data: result,
        pagination: {
          limit,
          offset,
          total: result.total,
        },
      });
    } catch (error: any) {
      logger.error('Get carousels error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get carousels',
          status: 400,
        },
      });
    }
  }

  async getCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const carousel = await contentService.getCarouselById(id);
      if (!carousel) {
        res.status(404).json({
          error: { message: 'Carousel not found', status: 404 },
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { carousel },
      });
    } catch (error: any) {
      logger.error('Get carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get carousel',
          status: 400,
        },
      });
    }
  }

  async publishCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const carousel = await contentService.publishCarousel(id);

      res.status(200).json({
        status: 'success',
        data: { carousel },
      });
    } catch (error: any) {
      logger.error('Publish carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to publish carousel',
          status: 400,
        },
      });
    }
  }

  async scheduleCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduled_at } = req.body;

      if (!scheduled_at) {
        res.status(400).json({
          error: { message: 'scheduled_at is required', status: 400 },
        });
        return;
      }

      const carousel = await contentService.scheduleCarousel(
        id,
        new Date(scheduled_at)
      );

      res.status(200).json({
        status: 'success',
        data: { carousel },
      });
    } catch (error: any) {
      logger.error('Schedule carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to schedule carousel',
          status: 400,
        },
      });
    }
  }

  async archiveCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const carousel = await contentService.archiveCarousel(id);

      res.status(200).json({
        status: 'success',
        data: { carousel },
      });
    } catch (error: any) {
      logger.error('Archive carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to archive carousel',
          status: 400,
        },
      });
    }
  }

  // ===== SLIDE ENDPOINTS =====

  async createSlide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;
      const { slide_number, title, description, content_text, image_url, style_data } =
        req.body;

      if (!slide_number) {
        res.status(400).json({
          error: { message: 'slide_number is required', status: 400 },
        });
        return;
      }

      const slide = await contentService.createSlide(carouselId, {
        slide_number,
        title,
        description,
        content_text,
        image_url,
        style_data,
      });

      res.status(201).json({
        status: 'success',
        data: { slide },
      });
    } catch (error: any) {
      logger.error('Create slide error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to create slide',
          status: 400,
        },
      });
    }
  }

  async getSlides(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;

      const slides = await contentService.getCarouselSlides(carouselId);

      res.status(200).json({
        status: 'success',
        data: { slides },
      });
    } catch (error: any) {
      logger.error('Get slides error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get slides',
          status: 400,
        },
      });
    }
  }

  async updateSlide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { slideId } = req.params;
      const updates = req.body;

      const slide = await contentService.updateSlide(slideId, updates);

      res.status(200).json({
        status: 'success',
        data: { slide },
      });
    } catch (error: any) {
      logger.error('Update slide error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to update slide',
          status: 400,
        },
      });
    }
  }

  async deleteSlide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { slideId } = req.params;

      await contentService.deleteSlide(slideId);

      res.status(200).json({
        status: 'success',
        message: 'Slide deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete slide error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to delete slide',
          status: 400,
        },
      });
    }
  }

  // ===== METRICS ENDPOINTS =====

  async getMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;

      const metrics = await contentService.getMetrics(carouselId);

      res.status(200).json({
        status: 'success',
        data: { metrics },
      });
    } catch (error: any) {
      logger.error('Get metrics error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to get metrics',
          status: 400,
        },
      });
    }
  }
}

export default new ContentController();
