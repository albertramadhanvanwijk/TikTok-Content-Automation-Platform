import request from 'supertest';
import app from '../../dist/index';

jest.mock('../../services/contentService');

describe('ContentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Endpoints', () => {
    it('should create template successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        user_id: 'user-123',
        name: 'Style A',
        style_name: 'professional',
        style_data: { colors: ['navy', 'gold'] },
        is_public: false,
        created_at: new Date(),
      };

      (contentService.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const response = await request(app)
        .post('/content/templates')
        .set('Authorization', 'Bearer valid_token')
        .send({
          name: 'Style A',
          style_name: 'professional',
          style_data: { colors: ['navy', 'gold'] },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.template.id).toBe('template-123');
    });

    it('should reject template creation without auth', async () => {
      const response = await request(app).post('/content/templates').send({
        name: 'Style A',
        style_name: 'professional',
        style_data: {},
      });

      expect(response.status).toBe(401);
    });

    it('should get user templates', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Style A' },
        { id: 'template-2', name: 'Style B' },
      ];

      (contentService.getUserTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const response = await request(app)
        .get('/content/templates')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.templates).toHaveLength(2);
    });
  });

  describe('Carousel Endpoints', () => {
    it('should create carousel successfully', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        user_id: 'user-123',
        title: 'My Carousel',
        description: 'Test carousel',
        status: 'draft',
        slides_count: 0,
        created_at: new Date(),
      };

      (contentService.createCarousel as jest.Mock).mockResolvedValue(mockCarousel);

      const response = await request(app)
        .post('/content/carousels')
        .set('Authorization', 'Bearer valid_token')
        .send({
          title: 'My Carousel',
          description: 'Test carousel',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.carousel.id).toBe('carousel-123');
    });

    it('should reject carousel creation without title', async () => {
      const response = await request(app)
        .post('/content/carousels')
        .set('Authorization', 'Bearer valid_token')
        .send({
          description: 'No title',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('title is required');
    });

    it('should get user carousels', async () => {
      const mockData = {
        data: [
          { id: 'carousel-1', title: 'First' },
          { id: 'carousel-2', title: 'Second' },
        ],
        total: 2,
      };

      (contentService.getUserCarousels as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/content/carousels')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter carousels by status', async () => {
      const mockData = {
        data: [{ id: 'carousel-1', title: 'Published', status: 'published' }],
        total: 1,
      };

      (contentService.getUserCarousels as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/content/carousels?status=published')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.data[0].status).toBe('published');
    });

    it('should get specific carousel', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        title: 'My Carousel',
        status: 'draft',
      };

      (contentService.getCarouselById as jest.Mock).mockResolvedValue(mockCarousel);

      const response = await request(app)
        .get('/content/carousels/carousel-123')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.carousel.id).toBe('carousel-123');
    });

    it('should return 404 for non-existent carousel', async () => {
      (contentService.getCarouselById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/content/carousels/invalid-id')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
    });

    it('should publish carousel successfully', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        status: 'published',
      };

      (contentService.publishCarousel as jest.Mock).mockResolvedValue(mockCarousel);

      const response = await request(app)
        .post('/content/carousels/carousel-123/publish')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.carousel.status).toBe('published');
    });

    it('should schedule carousel successfully', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockCarousel = {
        id: 'carousel-123',
        status: 'scheduled',
        scheduled_at: futureDate,
      };

      (contentService.scheduleCarousel as jest.Mock).mockResolvedValue(mockCarousel);

      const response = await request(app)
        .post('/content/carousels/carousel-123/schedule')
        .set('Authorization', 'Bearer valid_token')
        .send({
          scheduled_at: futureDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data.carousel.status).toBe('scheduled');
    });

    it('should archive carousel successfully', async () => {
      const mockCarousel = {
        id: 'carousel-123',
        status: 'archived',
      };

      (contentService.archiveCarousel as jest.Mock).mockResolvedValue(mockCarousel);

      const response = await request(app)
        .post('/content/carousels/carousel-123/archive')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.carousel.status).toBe('archived');
    });
  });

  describe('Slide Endpoints', () => {
    it('should create slide successfully', async () => {
      const mockSlide = {
        id: 'slide-123',
        carousel_id: 'carousel-123',
        slide_number: 1,
        title: 'Slide 1',
        content_text: 'Content',
      };

      (contentService.createSlide as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .post('/content/carousels/carousel-123/slides')
        .set('Authorization', 'Bearer valid_token')
        .send({
          slide_number: 1,
          title: 'Slide 1',
          content_text: 'Content',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.slide.id).toBe('slide-123');
    });

    it('should get carousel slides', async () => {
      const mockSlides = [
        { id: 'slide-1', slide_number: 1, title: 'Slide 1' },
        { id: 'slide-2', slide_number: 2, title: 'Slide 2' },
      ];

      (contentService.getCarouselSlides as jest.Mock).mockResolvedValue(mockSlides);

      const response = await request(app)
        .get('/content/carousels/carousel-123/slides')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.slides).toHaveLength(2);
    });

    it('should update slide successfully', async () => {
      const mockSlide = {
        id: 'slide-123',
        title: 'Updated Title',
        content_text: 'Updated Content',
      };

      (contentService.updateSlide as jest.Mock).mockResolvedValue(mockSlide);

      const response = await request(app)
        .put('/content/slides/slide-123')
        .set('Authorization', 'Bearer valid_token')
        .send({
          title: 'Updated Title',
          content_text: 'Updated Content',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.slide.title).toBe('Updated Title');
    });

    it('should delete slide successfully', async () => {
      (contentService.deleteSlide as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/content/slides/slide-123')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Slide deleted successfully');
    });
  });

  describe('Metrics Endpoints', () => {
    it('should get carousel metrics', async () => {
      const mockMetrics = {
        id: 'metrics-123',
        carousel_id: 'carousel-123',
        likes_count: 100,
        shares_count: 20,
        engagement_rate: 5.2,
      };

      (contentService.getMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/content/carousels/carousel-123/metrics')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data.metrics.likes_count).toBe(100);
    });
  });

  describe('Authorization', () => {
    it('should require auth for all content endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/content/templates' },
        { method: 'get', path: '/content/templates' },
        { method: 'post', path: '/content/carousels' },
        { method: 'get', path: '/content/carousels' },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app) as any)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });
  });
});
