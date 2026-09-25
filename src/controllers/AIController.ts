import { Response } from 'express';
import aiIntegrationService from '../services/aiIntegrationService';
import { AuthRequest } from '../middleware/authMiddleware';
import logger from '../utils/logger';

class AIController {
  /**
   * Generate carousel from topic
   */
  async generateCarousel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { topic, style, slides_count, template_id } = req.body;

      if (!topic) {
        res.status(400).json({
          error: { message: 'topic is required', status: 400 },
        });
        return;
      }

      const result = await aiIntegrationService.generateCarouselFromTopic(
        req.userId,
        topic,
        {
          style: style || 'professional',
          slides_count: slides_count || 3,
          templateId: template_id,
        }
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      logger.error('Generate carousel error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to generate carousel',
          status: 400,
        },
      });
    }
  }

  /**
   * Setup Notion integration
   */
  async setupNotionIntegration(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { notion_database_id } = req.body;

      if (!notion_database_id) {
        res.status(400).json({
          error: { message: 'notion_database_id is required', status: 400 },
        });
        return;
      }

      const result = await aiIntegrationService.setupNotionIntegration(
        req.userId,
        notion_database_id
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      logger.error('Setup Notion integration error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to setup Notion integration',
          status: 400,
        },
      });
    }
  }

  /**
   * Sync Notion and generate carousels
   */
  async syncNotionAndGenerate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { notion_database_id, template_id } = req.body;

      if (!notion_database_id) {
        res.status(400).json({
          error: { message: 'notion_database_id is required', status: 400 },
        });
        return;
      }

      const carousels = await aiIntegrationService.syncNotionAndGenerate(
        req.userId,
        notion_database_id,
        template_id
      );

      res.status(201).json({
        status: 'success',
        data: {
          carousels_generated: carousels.length,
          carousels,
        },
      });
    } catch (error: any) {
      logger.error('Sync Notion and generate error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to sync Notion and generate carousels',
          status: 400,
        },
      });
    }
  }

  /**
   * Enhance carousel slides with AI
   */
  async enhanceSlides(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { carouselId } = req.params;
      const { instruction } = req.body;

      if (!instruction) {
        res.status(400).json({
          error: { message: 'instruction is required', status: 400 },
        });
        return;
      }

      const enhancedSlides = await aiIntegrationService.enhanceCarouselSlides(
        carouselId,
        instruction
      );

      res.status(200).json({
        status: 'success',
        data: {
          slides_enhanced: enhancedSlides.length,
          slides: enhancedSlides,
        },
      });
    } catch (error: any) {
      logger.error('Enhance slides error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to enhance slides',
          status: 400,
        },
      });
    }
  }

  /**
   * Suggest design for carousel
   */
  async suggestDesign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { topic, style } = req.query;

      if (!topic) {
        res.status(400).json({
          error: { message: 'topic query parameter is required', status: 400 },
        });
        return;
      }

      const design = await aiIntegrationService.suggestDesign(
        topic as string,
        (style as string) || 'professional'
      );

      res.status(200).json({
        status: 'success',
        data: { design },
      });
    } catch (error: any) {
      logger.error('Suggest design error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to suggest design',
          status: 400,
        },
      });
    }
  }

  /**
   * Generate hashtags
   */
  async generateHashtags(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, topic } = req.query;

      if (!title || !topic) {
        res.status(400).json({
          error: {
            message: 'title and topic query parameters are required',
            status: 400,
          },
        });
        return;
      }

      const hashtags = await aiIntegrationService.generateHashtags(
        title as string,
        topic as string
      );

      res.status(200).json({
        status: 'success',
        data: { hashtags },
      });
    } catch (error: any) {
      logger.error('Generate hashtags error', error);
      res.status(400).json({
        error: {
          message: error.message || 'Failed to generate hashtags',
          status: 400,
        },
      });
    }
  }
}

export default new AIController();
