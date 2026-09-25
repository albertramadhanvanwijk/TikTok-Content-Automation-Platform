import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}

export interface QueryNotionInput {
  database_id: string;
  filter?: Record<string, any>;
  sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
  page_size?: number;
}

class NotionService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.notion.com/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NOTION_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Notion API error', {
          status: error.response?.status,
          message: error.response?.data?.message,
        });
        throw error;
      }
    );
  }

  /**
   * Query database for pages
   */
  async queryDatabase(input: QueryNotionInput): Promise<NotionPage[]> {
    try {
      const response = await this.client.post(`/databases/${input.database_id}/query`, {
        filter: input.filter,
        sorts: input.sorts,
        page_size: input.page_size || 100,
      });

      const pages: NotionPage[] = response.data.results.map((result: any) => ({
        id: result.id,
        title: this.extractTitle(result.properties),
        content: this.extractContent(result),
        properties: result.properties,
        created_time: result.created_time,
        last_edited_time: result.last_edited_time,
      }));

      return pages;
    } catch (error) {
      logger.error('Error querying Notion database', error);
      throw error;
    }
  }

  /**
   * Get page content
   */
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      const response = await this.client.get(`/pages/${pageId}`);

      return {
        id: response.data.id,
        title: this.extractTitle(response.data.properties),
        content: '',
        properties: response.data.properties,
        created_time: response.data.created_time,
        last_edited_time: response.data.last_edited_time,
      };
    } catch (error) {
      logger.error('Error getting Notion page', error);
      throw error;
    }
  }

  /**
   * Get page blocks (content)
   */
  async getPageBlocks(pageId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/blocks/${pageId}/children`);
      return response.data.results;
    } catch (error) {
      logger.error('Error getting Notion page blocks', error);
      throw error;
    }
  }

  /**
   * Extract text content from blocks
   */
  async extractPageText(pageId: string): Promise<string> {
    try {
      const blocks = await this.getPageBlocks(pageId);
      const textParts: string[] = [];

      for (const block of blocks) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text.map((rt: any) => rt.plain_text).join('');
          if (text) textParts.push(text);
        } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
          const text = block.heading_1.rich_text.map((rt: any) => rt.plain_text).join('');
          if (text) textParts.push(`# ${text}`);
        } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
          const text = block.heading_2.rich_text.map((rt: any) => rt.plain_text).join('');
          if (text) textParts.push(`## ${text}`);
        } else if (block.type === 'bullet_list_item' && block.bullet_list_item?.rich_text) {
          const text = block.bullet_list_item.rich_text.map((rt: any) => rt.plain_text).join('');
          if (text) textParts.push(`- ${text}`);
        }
      }

      return textParts.join('\n');
    } catch (error) {
      logger.error('Error extracting page text', error);
      throw error;
    }
  }

  /**
   * Get database schema
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    try {
      const response = await this.client.get(`/databases/${databaseId}`);

      return {
        id: response.data.id,
        title: response.data.title[0]?.plain_text || 'Untitled',
        properties: response.data.properties,
      };
    } catch (error) {
      logger.error('Error getting Notion database', error);
      throw error;
    }
  }

  /**
   * Create page in database
   */
  async createPage(
    databaseId: string,
    title: string,
    properties: Record<string, any>
  ): Promise<NotionPage> {
    try {
      const response = await this.client.post('/pages', {
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          ...properties,
        },
      });

      return {
        id: response.data.id,
        title,
        content: '',
        properties: response.data.properties,
        created_time: response.data.created_time,
        last_edited_time: response.data.last_edited_time,
      };
    } catch (error) {
      logger.error('Error creating Notion page', error);
      throw error;
    }
  }

  /**
   * Update page properties
   */
  async updatePage(
    pageId: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      await this.client.patch(`/pages/${pageId}`, {
        properties,
      });
    } catch (error) {
      logger.error('Error updating Notion page', error);
      throw error;
    }
  }

  /**
   * Helper: Extract title from properties
   */
  private extractTitle(properties: Record<string, any>): string {
    for (const [key, value] of Object.entries(properties)) {
      if (value.type === 'title' && value.title?.length > 0) {
        return value.title.map((t: any) => t.plain_text).join('');
      }
    }
    return 'Untitled';
  }

  /**
   * Helper: Extract content preview
   */
  private extractContent(page: any): string {
    // Return first 200 chars of content
    const title = this.extractTitle(page.properties);
    return title.substring(0, 200);
  }
}

export default new NotionService();
