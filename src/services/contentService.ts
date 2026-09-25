import contentRepository from '../repositories/ContentRepository';
import {
  Template,
  Carousel,
  Slide,
  CreateTemplateInput,
  CreateCarouselInput,
  CreateSlideInput,
  CarouselResponse,
} from '../models/Content';
import logger from '../utils/logger';

class ContentService {
  // ===== TEMPLATE SERVICE =====

  async createTemplate(
    userId: string,
    input: CreateTemplateInput
  ): Promise<Template> {
    try {
      if (!input.name || !input.style_name || !input.style_data) {
        throw new Error('Template name, style_name, and style_data are required');
      }

      const template = await contentRepository.createTemplate(userId, input);
      logger.info(`Template created: ${template.id} for user ${userId}`);
      return template;
    } catch (error) {
      logger.error('Error creating template', error);
      throw error;
    }
  }

  async getTemplateById(id: string): Promise<Template | null> {
    try {
      return await contentRepository.getTemplateById(id);
    } catch (error) {
      logger.error('Error getting template', error);
      throw error;
    }
  }

  async getUserTemplates(userId: string): Promise<Template[]> {
    try {
      return await contentRepository.getUserTemplates(userId);
    } catch (error) {
      logger.error('Error getting user templates', error);
      throw error;
    }
  }

  // ===== CAROUSEL SERVICE =====

  async createCarousel(
    userId: string,
    input: CreateCarouselInput
  ): Promise<Carousel> {
    try {
      if (!input.title) {
        throw new Error('Carousel title is required');
      }

      // Validate template if provided
      if (input.template_id) {
        const template = await contentRepository.getTemplateById(
          input.template_id
        );
        if (!template) {
          throw new Error('Template not found');
        }
      }

      const carousel = await contentRepository.createCarousel(userId, input);
      logger.info(`Carousel created: ${carousel.id} for user ${userId}`);
      return carousel;
    } catch (error) {
      logger.error('Error creating carousel', error);
      throw error;
    }
  }

  async getCarouselById(id: string): Promise<Carousel | null> {
    try {
      return await contentRepository.getCarouselById(id);
    } catch (error) {
      logger.error('Error getting carousel', error);
      throw error;
    }
  }

  async getUserCarousels(
    userId: string,
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: CarouselResponse[]; total: number }> {
    try {
      const result = await contentRepository.getUserCarousels(
        userId,
        status,
        limit,
        offset
      );

      return {
        data: result.data.map((carousel) => this.toCarouselResponse(carousel)),
        total: result.total,
      };
    } catch (error) {
      logger.error('Error getting user carousels', error);
      throw error;
    }
  }

  async publishCarousel(carouselId: string): Promise<Carousel> {
    try {
      const carousel = await contentRepository.getCarouselById(carouselId);
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      // Validate that carousel has slides
      if (carousel.slides_count === 0) {
        throw new Error('Cannot publish carousel without slides');
      }

      const updated = await contentRepository.updateCarouselStatus(
        carouselId,
        'published'
      );

      logger.info(`Carousel published: ${carouselId}`);
      return updated;
    } catch (error) {
      logger.error('Error publishing carousel', error);
      throw error;
    }
  }

  async scheduleCarousel(
    carouselId: string,
    scheduledAt: Date
  ): Promise<Carousel> {
    try {
      const carousel = await contentRepository.getCarouselById(carouselId);
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      if (carousel.slides_count === 0) {
        throw new Error('Cannot schedule carousel without slides');
      }

      if (scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const updated = await contentRepository.scheduleCarousel(
        carouselId,
        scheduledAt
      );

      logger.info(`Carousel scheduled: ${carouselId} for ${scheduledAt}`);
      return updated;
    } catch (error) {
      logger.error('Error scheduling carousel', error);
      throw error;
    }
  }

  async archiveCarousel(carouselId: string): Promise<Carousel> {
    try {
      const updated = await contentRepository.updateCarouselStatus(
        carouselId,
        'archived'
      );

      logger.info(`Carousel archived: ${carouselId}`);
      return updated;
    } catch (error) {
      logger.error('Error archiving carousel', error);
      throw error;
    }
  }

  // ===== SLIDE SERVICE =====

  async createSlide(
    carouselId: string,
    input: CreateSlideInput
  ): Promise<Slide> {
    try {
      const carousel = await contentRepository.getCarouselById(carouselId);
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      const slide = await contentRepository.createSlide(carouselId, input);

      // Update carousel slides count
      await contentRepository.updateCarouselSlidesCount(carouselId);
      const slides = await contentRepository.getCarouselSlides(carouselId);
      logger.info(
        `Slide created: ${slide.id} for carousel ${carouselId}, total slides: ${slides.length}`
      );

      return slide;
    } catch (error) {
      logger.error('Error creating slide', error);
      throw error;
    }
  }

  async getCarouselSlides(carouselId: string): Promise<Slide[]> {
    try {
      return await contentRepository.getCarouselSlides(carouselId);
    } catch (error) {
      logger.error('Error getting carousel slides', error);
      throw error;
    }
  }

  async updateSlide(slideId: string, input: Partial<CreateSlideInput>): Promise<Slide> {
    try {
      return await contentRepository.updateSlide(slideId, input);
    } catch (error) {
      logger.error('Error updating slide', error);
      throw error;
    }
  }

  async deleteSlide(slideId: string): Promise<void> {
    try {
      await contentRepository.deleteSlide(slideId);
      logger.info(`Slide deleted: ${slideId}`);
    } catch (error) {
      logger.error('Error deleting slide', error);
      throw error;
    }
  }

  // ===== METRICS SERVICE =====

  async getMetrics(carouselId: string) {
    try {
      return await contentRepository.getOrCreateMetrics(carouselId);
    } catch (error) {
      logger.error('Error getting metrics', error);
      throw error;
    }
  }

  async updateMetrics(
    carouselId: string,
    metrics: any
  ) {
    try {
      return await contentRepository.updateMetrics(carouselId, metrics);
    } catch (error) {
      logger.error('Error updating metrics', error);
      throw error;
    }
  }

  // ===== HELPER METHODS =====

  private toCarouselResponse(carousel: Carousel): CarouselResponse {
    return {
      id: carousel.id,
      title: carousel.title,
      description: carousel.description,
      status: carousel.status,
      slides_count: carousel.slides_count,
      created_at: carousel.created_at,
      published_at: carousel.published_at,
      scheduled_at: carousel.scheduled_at,
    };
  }
}

export default new ContentService();
