import notionService from './notionService';
import openaiService from './openaiService';
import contentRepository from '../repositories/ContentRepository';
import logger from '../utils/logger';

class AIIntegrationService {
  private buildMockDesign(topic: string, style: string = 'professional') {
    return {
      color_scheme: ['#030712', '#D4AF37', '#F8F9FA'],
      fonts: ['Inter', 'Segoe UI'],
      layout: style === 'minimal' ? 'minimal' : 'centered',
      visual_elements: ['charts', 'icons', 'gradients'],
      recommended_dimensions: '1080x1920',
      topic,
      style,
      mock: true as const,
    };
  }

  private buildMockHashtags(title: string, topic: string): string[] {
    const base = (title || topic || 'Trading').replace(/[^a-zA-Z0-9]/g, '');
    return [
      `#${base || 'TikTokCarousel'}`,
      '#EdukasiTrading',
      '#TradingPsikologi',
      '#PsikologiTrading',
      '#BelajarTrading',
      '#TipsTrading',
      '#Investasi',
      '#Finansial',
    ];
  }

  private buildMockGeneratedContent(topic: string, slidesCount: number, style: string) {
    const safeTopic = topic || 'Trading Psychology';
    return {
      title: `${safeTopic} — Carousel (mock)`,
      description: `Mock carousel generated for "${safeTopic}" in style "${style}". Set OPENAI_API_KEY for real AI content.`,
      tags: ['mock', safeTopic.toLowerCase().split(' ')[0] || 'trading'],
      slides: Array.from({ length: slidesCount }, (_, i) => ({
        slide_number: i + 1,
        title: `${safeTopic} — Slide ${i + 1}`,
        content: `Mock content for ${safeTopic}, slide ${i + 1}. This is a dummy slide so the demo can run end-to-end without external API keys.`,
        key_points: [`Key point ${i + 1}a`, `Key point ${i + 1}b`],
      })),
    };
  }

  private isMockKey(value: string | undefined): boolean {
    if (!value) return true;
    const v = value.trim();
    if (v === '') return true;
    if (v.startsWith('your_')) return true;
    if (v === 'your_openai_api_key' || v === 'your_notion_api_key' || v === 'your_tiktok_api_key') return true;
    return false;
  }

  private isOpenAIMock(): boolean {
    return this.isMockKey(process.env.OPENAI_API_KEY);
  }

  private isNotionMock(): boolean {
    return this.isMockKey(process.env.NOTION_API_KEY);
  }

  /**
   * Sync content from Notion and generate carousels
   */
  async syncNotionAndGenerate(
    userId: string,
    notionDatabaseId: string,
    templateId?: string
  ) {
    if (this.isNotionMock() || this.isOpenAIMock()) {
      logger.info('Notion sync mock fallback — keys missing, returning dummy carousels');
      const topics = ['Trading Psychology', 'Risk Management'];
      const carousels: any[] = [];
      for (const topic of topics) {
        const mockContent = this.buildMockGeneratedContent(topic, 3, 'professional');
        const design = this.buildMockDesign(topic, 'professional');
        const carousel = await contentRepository.createCarousel(userId, {
          title: mockContent.title,
          description: mockContent.description,
          template_id: templateId,
          tags: mockContent.tags,
          category: 'ai_generated',
        });
        for (const slide of mockContent.slides) {
          await contentRepository.createSlide(carousel.id, {
            slide_number: slide.slide_number,
            title: slide.title,
            content_text: slide.content,
            style_data: design as any,
          });
        }
        (carousel as any).mock = true;
        carousels.push(carousel);
      }
      return carousels;
    }
    try {
      const pages = await notionService.queryDatabase({
        database_id: notionDatabaseId,
        page_size: 10,
      });

      logger.info(`Found ${pages.length} pages in Notion database`);

      const generatedCarousels = [];

      for (const page of pages) {
        try {
          const pageText = await notionService.extractPageText(page.id);

          if (!pageText) {
            logger.warn(`No content found in Notion page ${page.id}`);
            continue;
          }

          const generatedContent = await openaiService.generateCarouselContent({
            topic: page.title,
            style: 'professional',
            slides_count: 3,
            context: pageText.substring(0, 500),
          });

          const carousel = await contentRepository.createCarousel(userId, {
            title: generatedContent.title,
            description: generatedContent.description,
            template_id: templateId,
            tags: generatedContent.tags,
            category: 'generated',
          });

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
    if (this.isOpenAIMock()) {
      logger.info('OpenAI mock fallback — generating dummy carousel from topic');
      const count = options?.slides_count || 3;
      const style = options?.style || 'professional';
      const mockContent = this.buildMockGeneratedContent(topic, count, style);
      const hashtags = this.buildMockHashtags(mockContent.title, topic);
      const design = this.buildMockDesign(topic, style);
      const carousel = await contentRepository.createCarousel(userId, {
        title: mockContent.title,
        description: mockContent.description,
        template_id: options?.templateId,
        tags: [...(mockContent.tags || []), ...hashtags],
        category: 'ai_generated',
      });
      for (const slide of mockContent.slides) {
        await contentRepository.createSlide(carousel.id, {
          slide_number: slide.slide_number,
          title: slide.title,
          content_text: slide.content,
          style_data: design as any,
        });
      }
      logger.info(`Generated mock carousel from topic: ${carousel.id}`);
      return {
        carousel,
        slides: mockContent.slides,
        design,
        hashtags,
        mock: true as const,
        mock_reason: 'OPENAI_API_KEY missing',
      };
    }
    try {
      const generatedContent = await openaiService.generateCarouselContent({
        topic,
        style: options?.style || 'professional',
        slides_count: options?.slides_count || 3,
      });

      const hashtags = await openaiService.generateHashtags(
        generatedContent.title,
        topic
      );

      const design = await openaiService.generateDesignRecommendations(
        topic,
        options?.style || 'professional'
      );

      const carousel = await contentRepository.createCarousel(userId, {
        title: generatedContent.title,
        description: generatedContent.description,
        template_id: options?.templateId,
        tags: [...(generatedContent.tags || []), ...hashtags],
        category: 'ai_generated',
      });

      for (const slide of generatedContent.slides) {
        await contentRepository.createSlide(carousel.id, {
          slide_number: slide.slide_number,
          title: slide.title,
          content_text: slide.content,
          style_data: design,
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
    if (this.isOpenAIMock()) {
      logger.info('OpenAI mock fallback — enhancing slides with dummy content');
      const slides = await contentRepository.getCarouselSlides(carouselId);
      if (!slides || slides.length === 0) {
        return [{ id: 'mock-slide-enhanced-1', content_text: `[mock enhanced] ${instruction}`, mock: true } as any];
      }
      const enhancedSlides = [];
      for (const slide of slides) {
        const refinedContent = `${slide.content_text || ''} [enhanced: ${instruction}] (mock)`;
        const updatedSlide = await contentRepository.updateSlide(slide.id, {
          content_text: refinedContent,
        });
        enhancedSlides.push(updatedSlide);
      }
      logger.info(`Enhanced ${enhancedSlides.length} slides (mock)`);
      return enhancedSlides;
    }
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
    if (this.isOpenAIMock()) {
      return this.buildMockDesign(topic, style);
    }
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
    if (this.isOpenAIMock()) {
      return this.buildMockHashtags(title, topic);
    }
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
    if (this.isNotionMock()) {
      logger.info('Notion mock fallback — setup without API key');
      return {
        userId,
        notionDatabaseId,
        databaseTitle: 'Mock Notion Database',
        properties: ['Name', 'Status', 'Tags'],
        connected_at: new Date(),
        mock: true as const,
        mock_reason: 'NOTION_API_KEY missing',
      };
    }
    try {
      const database = await notionService.getDatabase(notionDatabaseId);

      logger.info(`Notion database connected: ${database.title}`);

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
    if (this.isNotionMock()) {
      return [{ id: 'mock-db-1', title: 'Mock Database', properties: {}, mock: true } as any];
    }
    try {
      logger.info('Notion databases query');
      return [];
    } catch (error) {
      logger.error('Error listing Notion databases', error);
      throw error;
    }
  }
}

export default new AIIntegrationService();
