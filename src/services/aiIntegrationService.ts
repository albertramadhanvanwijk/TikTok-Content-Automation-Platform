import notionService from './notionService';
import openaiService from './openaiService';
import contentRepository from '../repositories/ContentRepository';
import logger from '../utils/logger';

class AIIntegrationService {
  /**
   * Sync content from Notion and generate carousels
   */
  async syncNotionAndGenerate(
    userId: string,
    notionDatabaseId: string,
    templateId?: string
  ) {
    try {
      // Query Notion database for new pages
      const pages = await notionService.queryDatabase({
        database_id: notionDatabaseId,
        page_size: 10,
      });

      logger.info(`Found ${pages.length} pages in Notion database`);

      const generatedCarousels = [];

      for (const page of pages) {
        try {
          // Extract full text content from page
          const pageText = await notionService.extractPageText(page.id);

          if (!pageText) {
            logger.warn(`No content found in Notion page ${page.id}`);
            continue;
          }

          // Generate carousel content using OpenAI
          const generatedContent = await openaiService.generateCarouselContent({
            topic: page.title,
            style: 'professional',
            slides_count: 3,
            context: pageText.substring(0, 500),
          });

          // Create carousel in database
          const carousel = await contentRepository.createCarousel(userId, {
            title: generatedContent.title,
            description: generatedContent.description,
            template_id: templateId,
            tags: generatedContent.tags,
            category: 'generated',
          });

          // Create slides
          for (const slide of generatedContent.slides) {
            await contentRepository.createSlide(carousel.id, {
              slide_number: slide.slide_number,
              title: slide.title,
              content_text: slide.content,
            });
          }

          logger.info(`Generated carousel from Notion page: ${carousel.id}`);
          generatedCarousels.push(carousel);
        } catch (error) {
          logger.error(`Failed to generate carousel from page ${page.id}`, error);
          // Continue to next page
        }
      }

      return generatedCarousels;
    } catch (error) {
      logger.error('Error syncing Notion and generating carousels', error);
      throw error;
    }
  }

  /**
   * Generate carousel from topic
   */
  async generateCarouselFromTopic(
    userId: string,
    topic: string,
    options?: {
      style?: 'professional' | 'casual' | 'educational' | 'promotional';
      slides_count?: number;
      templateId?: string;
    }
  ) {
    try {
      // Generate content using OpenAI
      const generatedContent = await openaiService.generateCarouselContent({
        topic,
        style: options?.style || 'professional',
        slides_count: options?.slides_count || 3,
      });

      // Generate hashtags
      const hashtags = await openaiService.generateHashtags(
        generatedContent.title,
        topic
      );

      // Generate design recommendations
      const design = await openaiService.generateDesignRecommendations(
        topic,
        options?.style || 'professional'
      );

      // Create carousel
      const carousel = await contentRepository.createCarousel(userId, {
        title: generatedContent.title,
        description: generatedContent.description,
        template_id: options?.templateId,
        tags: [...(generatedContent.tags || []), ...hashtags],
        category: 'ai_generated',
      });

      // Create slides
      for (const slide of generatedContent.slides) {
        await contentRepository.createSlide(carousel.id, {
          slide_number: slide.slide_number,
          title: slide.title,
          content_text: slide.content,
          style_data: design, // Apply design recommendations
        });
      }

      logger.info(`Generated carousel from topic: ${carousel.id}`);

      return {
        carousel,
        slides: generatedContent.slides,
        design,
        hashtags,
      };
    } catch (error) {
      logger.error('Error generating carousel from topic', error);
      throw error;
    }
  }

  /**
   * Enhance carousel slides with AI
   */
  async enhanceCarouselSlides(carouselId: string, instruction: string) {
    try {
      const slides = await contentRepository.getCarouselSlides(carouselId);

      const enhancedSlides = [];

      for (const slide of slides) {
        try {
          const refinedContent = await openaiService.refineContent(
            slide.content_text || '',
            instruction
          );

          const updatedSlide = await contentRepository.updateSlide(slide.id, {
            content_text: refinedContent,
          });

          enhancedSlides.push(updatedSlide);
        } catch (error) {
          logger.warn(`Failed to enhance slide ${slide.id}`, error);
        }
      }

      logger.info(`Enhanced ${enhancedSlides.length} slides`);
      return enhancedSlides;
    } catch (error) {
      logger.error('Error enhancing carousel slides', error);
      throw error;
    }
  }

  /**
   * Suggest design for carousel
   */
  async suggestDesign(topic: string, style: string = 'professional') {
    try {
      return await openaiService.generateDesignRecommendations(topic, style);
    } catch (error) {
      logger.error('Error suggesting design', error);
      throw error;
    }
  }

  /**
   * Generate optimal hashtags
   */
  async generateHashtags(title: string, topic: string) {
    try {
      return await openaiService.generateHashtags(title, topic);
    } catch (error) {
      logger.error('Error generating hashtags', error);
      throw error;
    }
  }

  /**
   * Setup Notion integration
   */
  async setupNotionIntegration(userId: string, notionDatabaseId: string) {
    try {
      // Verify database exists and is accessible
      const database = await notionService.getDatabase(notionDatabaseId);

      logger.info(`Notion database connected: ${database.title}`);

      // Store integration config (would be in database in production)
      return {
        userId,
        notionDatabaseId,
        databaseTitle: database.title,
        properties: Object.keys(database.properties),
        connected_at: new Date(),
      };
    } catch (error) {
      logger.error('Error setting up Notion integration', error);
      throw error;
    }
  }

  /**
   * List Notion databases (requires Notion integration)
   */
  async listNotionDatabases() {
    try {
      // This would require Notion to return user's databases
      // For now, return empty - requires additional Notion API setup
      logger.info('Notion databases query');
      return [];
    } catch (error) {
      logger.error('Error listing Notion databases', error);
      throw error;
    }
  }
}

export default new AIIntegrationService();
