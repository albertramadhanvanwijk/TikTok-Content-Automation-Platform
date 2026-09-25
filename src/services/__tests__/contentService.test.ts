import contentService from '../../services/contentService';
import contentRepository from '../../repositories/ContentRepository';

jest.mock('../../repositories/ContentRepository');

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Service', () => {
    it('should create template successfully', async () => {
      const input = {
        name: 'Style A',
        style_name: 'professional',
        style_data: { colors: ['navy', 'gold'] },
        description: 'Professional style',
      };

      const mockTemplate = {
        id: 'template-123',
        user_id: 'user-123',
        ...input,
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (contentRepository.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await contentService.createTemplate('user-123', input);

      expect(result.id).toBe('template-123');
      expect(result.name).toBe('Style A');
    });

    it('should reject template without required fields', async () => {
      const input = {
        name: 'Style A',
        style_name: 'professional',
        // missing style_data
      };

      await expect(
        contentService.createTemplate('user-123', input as any)
      ).rejects.toThrow('required');
    });

    it('should get user templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Style A',
          user_id: 'user-123',
        },
        {
          id: 'template-2',
          name: 'Style B',
          user_id: 'user-123',
        },
      ];

      (contentRepository.getUserTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const result = await contentService.getUserTemplates('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Style A');
    });
  });

  describe('Carousel Service', () => {
    it('should create carousel successfully', async () => {
      const input = {
        title: 'My Carousel',
        description: 'Test carousel',
        category: 'education',
      };

      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        ...input,
        slides_count: 0,
        status: 'draft',
        content_type: 'carousel',
        tags: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (contentRepository.createCarousel as jest.Mock).mockResolvedValue(mockCarousel);

      const result = await contentService.createCarousel('user-123', input);

      expect(result.id).toBe('carousel-123');
      expect(result.status).toBe('draft');
    });

    it('should reject carousel without title', async () => {
      const input = {
        description: 'No title',
      };

      await expect(
        contentService.createCarousel('user-123', input as any)
      ).rejects.toThrow('title is required');
    });

    it('should validate template exists before creating carousel', async () => {
      const input = {
        title: 'My Carousel',
        template_id: 'invalid-template',
      };

      (contentRepository.getTemplateById as jest.Mock).mockResolvedValue(null);

      await expect(
        contentService.createCarousel('user-123', input)
      ).rejects.toThrow('Template not found');
    });

    it('should publish carousel successfully', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        title: 'My Carousel',
        slides_count: 3,
        status: 'draft',
      };

      const publishedCarousel = {
        ...mockCarousel,
        status: 'published',
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);
      (contentRepository.updateCarouselStatus as jest.Mock).mockResolvedValue(
        publishedCarousel
      );

      const result = await contentService.publishCarousel('carousel-123');

      expect(result.status).toBe('published');
    });

    it('should reject publishing carousel without slides', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        title: 'My Carousel',
        slides_count: 0,
        status: 'draft',
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);

      await expect(contentService.publishCarousel('carousel-123')).rejects.toThrow(
        'Cannot publish carousel without slides'
      );
    });

    it('should schedule carousel successfully', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        title: 'My Carousel',
        slides_count: 2,
        status: 'draft',
      };

      const scheduledCarousel = {
        ...mockCarousel,
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 86400000),
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);
      (contentRepository.scheduleCarousel as jest.Mock).mockResolvedValue(scheduledCarousel);

      const futureDate = new Date(Date.now() + 86400000);
      const result = await contentService.scheduleCarousel('carousel-123', futureDate);

      expect(result.status).toBe('scheduled');
    });

    it('should reject scheduling with past date', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        slides_count: 2,
        status: 'draft',
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);

      const pastDate = new Date(Date.now() - 1000);
      await expect(
        contentService.scheduleCarousel('carousel-123', pastDate)
      ).rejects.toThrow('Scheduled time must be in the future');
    });

    it('should archive carousel successfully', async () => {
      const archivedCarousel = {
        id: 'carousel-123',
        status: 'archived',
      };

      (contentRepository.updateCarouselStatus as jest.Mock).mockResolvedValue(
        archivedCarousel
      );

      const result = await contentService.archiveCarousel('carousel-123');

      expect(result.status).toBe('archived');
    });

    it('should get user carousels with pagination', async () => {
      const mockCarousels = [
        { id: 'carousel-1', title: 'First', status: 'draft' },
        { id: 'carousel-2', title: 'Second', status: 'published' },
      ];

      (contentRepository.getUserCarousels as jest.Mock).mockResolvedValue({
        data: mockCarousels,
        total: 2,
      });

      const result = await contentService.getUserCarousels('user-123', undefined, 20, 0);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter carousels by status', async () => {
      const mockCarousels = [
        { id: 'carousel-1', title: 'Published 1', status: 'published' },
      ];

      (contentRepository.getUserCarousels as jest.Mock).mockResolvedValue({
        data: mockCarousels,
        total: 1,
      });

      const result = await contentService.getUserCarousels(
        'user-123',
        'published',
        20,
        0
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('published');
    });
  });

  describe('Slide Service', () => {
    it('should create slide successfully', async () => {
      const input = {
        slide_number: 1,
        title: 'Slide 1',
        content_text: 'Content',
      };

      const mockSlide = {
        id: 'slide-123',
        carousel_id: 'carousel-123',
        ...input,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        title: 'My Carousel',
      };

      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);
      (contentRepository.createSlide as jest.Mock).mockResolvedValue(mockSlide);
      (contentRepository.getCarouselSlides as jest.Mock).mockResolvedValue([mockSlide]);

      const result = await contentService.createSlide('carousel-123', input);

      expect(result.id).toBe('slide-123');
      expect(result.slide_number).toBe(1);
    });

    it('should reject slide if carousel not found', async () => {
      (contentRepository.getCarouselById as jest.Mock).mockResolvedValue(null);

      await expect(
        contentService.createSlide('invalid-carousel', {
          slide_number: 1,
          title: 'Slide 1',
        })
      ).rejects.toThrow('Carousel not found');
    });

    it('should update slide successfully', async () => {
      const updates = {
        title: 'Updated Title',
        content_text: 'Updated Content',
      };

      const updatedSlide = {
        id: 'slide-123',
        carousel_id: 'carousel-123',
        slide_number: 1,
        ...updates,
      };

      (contentRepository.updateSlide as jest.Mock).mockResolvedValue(updatedSlide);

      const result = await contentService.updateSlide('slide-123', updates);

      expect(result.title).toBe('Updated Title');
    });

    it('should delete slide successfully', async () => {
      (contentRepository.deleteSlide as jest.Mock).mockResolvedValue(undefined);

      await expect(
        contentService.deleteSlide('slide-123')
      ).resolves.not.toThrow();

      expect(contentRepository.deleteSlide).toHaveBeenCalledWith('slide-123');
    });

    it('should get carousel slides', async () => {
      const mockSlides = [
        { id: 'slide-1', slide_number: 1, title: 'Slide 1' },
        { id: 'slide-2', slide_number: 2, title: 'Slide 2' },
      ];

      (contentRepository.getCarouselSlides as jest.Mock).mockResolvedValue(mockSlides);

      const result = await contentService.getCarouselSlides('carousel-123');

      expect(result).toHaveLength(2);
      expect(result[0].slide_number).toBe(1);
    });
  });

  describe('Metrics Service', () => {
    it('should get or create metrics', async () => {
      const mockMetrics = {
        id: 'metrics-123',
        carousel_id: 'carousel-123',
        likes_count: 0,
        shares_count: 0,
        comments_count: 0,
        views_count: 0,
        saves_count: 0,
        engagement_rate: 0,
      };

      (contentRepository.getOrCreateMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await contentService.getMetrics('carousel-123');

      expect(result.carousel_id).toBe('carousel-123');
      expect(result.likes_count).toBe(0);
    });

    it('should update metrics successfully', async () => {
      const updates = {
        likes_count: 100,
        shares_count: 20,
      };

      const updatedMetrics = {
        id: 'metrics-123',
        carousel_id: 'carousel-123',
        ...updates,
        comments_count: 0,
        views_count: 0,
        saves_count: 0,
        engagement_rate: 5.2,
      };

      (contentRepository.updateMetrics as jest.Mock).mockResolvedValue(updatedMetrics);

      const result = await contentService.updateMetrics('carousel-123', updates);

      expect(result.likes_count).toBe(100);
      expect(result.shares_count).toBe(20);
    });
  });
});
