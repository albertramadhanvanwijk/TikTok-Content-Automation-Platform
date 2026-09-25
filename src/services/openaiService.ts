import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export interface GenerateContentInput {
  topic: string;
  style?: 'professional' | 'casual' | 'educational' | 'promotional';
  slides_count?: number;
  audience?: string;
  context?: string;
}

export interface GeneratedSlide {
  slide_number: number;
  title: string;
  content: string;
  key_points?: string[];
}

export interface GeneratedContent {
  title: string;
  description: string;
  slides: GeneratedSlide[];
  tags?: string[];
  hashtags?: string[];
}

class OpenAIService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.openai.com/v1';
  private apiKey: string;
  private model = 'gpt-4o';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('OpenAI API error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message,
        });
        throw error;
      }
    );
  }

  /**
   * Generate carousel content from topic
   */
  async generateCarouselContent(input: GenerateContentInput): Promise<GeneratedContent> {
    try {
      const slideCount = input.slides_count || 3;
      const style = input.style || 'professional';

      const prompt = this.buildContentPrompt(input, slideCount, style);

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional content creator for TikTok carousels. Generate engaging, concise content in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error generating carousel content', error);
      throw error;
    }
  }

  /**
   * Generate carousel design recommendations
   */
  async generateDesignRecommendations(topic: string, style: string): Promise<any> {
    try {
      const prompt = `Based on the topic "${topic}" and style "${style}", suggest a TikTok carousel design including:
- Color scheme (hex codes)
- Font recommendations
- Layout type
- Visual elements
- Recommended dimensions
Return as JSON.`;

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional UI/UX designer. Provide design recommendations in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error('Error generating design recommendations', error);
      throw error;
    }
  }

  /**
   * Generate hashtags for content
   */
  async generateHashtags(title: string, topic: string): Promise<string[]> {
    try {
      const prompt = `Generate 10 relevant TikTok hashtags for:
Title: "${title}"
Topic: "${topic}"

Return as JSON array of strings.`;

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Generate trending hashtags in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.hashtags || [];
    } catch (error) {
      logger.error('Error generating hashtags', error);
      throw error;
    }
  }

  /**
   * Improve/refine existing content
   */
  async refineContent(content: string, instruction: string): Promise<string> {
    try {
      const prompt = `Please refine the following content with this instruction: "${instruction}"
Content: "${content}"

Return only the refined content.`;

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional content editor. Improve content based on instructions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error refining content', error);
      throw error;
    }
  }

  /**
   * Generate SEO description
   */
  async generateDescription(title: string, content: string): Promise<string> {
    try {
      const prompt = `Generate a compelling TikTok carousel description (max 150 characters) for:
Title: "${title}"
Content: "${content.substring(0, 200)}"

Return only the description.`;

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a copywriter. Write concise, engaging descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 150,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating description', error);
      throw error;
    }
  }

  /**
   * Helper: Build content generation prompt
   */
  private buildContentPrompt(
    input: GenerateContentInput,
    slideCount: number,
    style: string
  ): string {
    return `Create a TikTok carousel with ${slideCount} slides about "${input.topic}".
Style: ${style}
${input.audience ? `Audience: ${input.audience}` : ''}
${input.context ? `Additional context: ${input.context}` : ''}

Return JSON with structure:
{
  "title": "carousel title",
  "description": "brief description",
  "slides": [
    {
      "slide_number": 1,
      "title": "slide title",
      "content": "slide content",
      "key_points": ["point1", "point2"]
    }
  ],
  "tags": ["tag1", "tag2"],
  "hashtags": ["#hashtag1", "#hashtag2"]
}`;
  }
}

export default new OpenAIService();
