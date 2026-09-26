import aiIntegrationService from '../aiIntegrationService';

jest.mock('../../repositories/ContentRepository', () => ({
  __esModule: true,
  default: {
    createCarousel: jest.fn().mockResolvedValue({ id: 'mock-carousel-id', title: 'Trading Psychology — Carousel (mock)', description: 'mock', user_id: 'user-id-123' }),
    createSlide: jest.fn().mockResolvedValue({ id: 'mock-slide-id', slide_number: 1 }),
    getCarouselSlides: jest.fn().mockResolvedValue([{ id: 's1', content_text: 'hello' }]),
    updateSlide: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
  },
}));

jest.mock('../openaiService', () => ({
  __esModule: true,
  default: {
    generateCarouselContent: jest.fn(),
    generateDesignRecommendations: jest.fn(),
    generateHashtags: jest.fn(),
    refineContent: jest.fn(),
  },
}));

jest.mock('../notionService', () => ({
  __esModule: true,
  default: {
    queryDatabase: jest.fn(),
    extractPageText: jest.fn(),
    getDatabase: jest.fn(),
  },
}));

describe('aiIntegrationService mock fallbacks', () => {
  const origOpenAI = process.env.OPENAI_API_KEY;
  const origNotion = process.env.NOTION_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.NOTION_API_KEY;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (origOpenAI) process.env.OPENAI_API_KEY = origOpenAI; else delete process.env.OPENAI_API_KEY;
    if (origNotion) process.env.NOTION_API_KEY = origNotion; else delete process.env.NOTION_API_KEY;
  });

  it('generateCarouselFromTopic returns mock with mock:true when OPENAI_API_KEY empty', async () => {
    const res: any = await aiIntegrationService.generateCarouselFromTopic('user-id-123', 'Trading Psychology', { style: 'professional', slides_count: 3 });
    expect(res.carousel).toBeDefined();
    expect(res.slides.length).toBe(3);
    expect(res.mock).toBe(true);
  });

  it('suggestDesign returns mock when OPENAI_API_KEY empty', async () => {
    const res: any = await aiIntegrationService.suggestDesign('Trading', 'professional');
    expect(res.color_scheme).toBeDefined();
    expect(res.mock).toBe(true);
  });

  it('generateHashtags returns mock when OPENAI_API_KEY empty', async () => {
    const res: any = await aiIntegrationService.generateHashtags('Title', 'Topic');
    expect(Array.isArray(res.hashtags || res)).toBe(true);
    const arr = res.hashtags || res;
    expect(arr.length).toBeGreaterThan(0);
  });

  it('setupNotionIntegration returns mock when NOTION_API_KEY empty', async () => {
    const res: any = await aiIntegrationService.setupNotionIntegration('user-id-123', 'dummy-db-id');
    expect(res.databaseTitle).toBeDefined();
    expect(res.mock).toBe(true);
  });

  it('syncNotionAndGenerate returns mock carousels when keys empty', async () => {
    const res: any = await aiIntegrationService.syncNotionAndGenerate('user-id-123', 'dummy-db-id');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
});
