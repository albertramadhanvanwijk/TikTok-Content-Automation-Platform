import database from '../database/connection';
import {
  Template,
  Carousel,
  Slide,
  CarouselMetrics,
  CreateTemplateInput,
  CreateCarouselInput,
  CreateSlideInput,
} from '../models/Content';
import logger from '../utils/logger';

class ContentRepository {
  // ===== TEMPLATE OPERATIONS =====

  async createTemplate(
    userId: string,
    input: CreateTemplateInput
  ): Promise<Template> {
    const query = `
      INSERT INTO templates (user_id, name, description, style_name, style_data, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, name, description, style_name, style_data, 
                preview_url, thumbnail_url, is_public, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        input.name,
        input.description || null,
        input.style_name,
        JSON.stringify(input.style_data),
        input.is_public || false,
      ]);

      return result.rows[0] as Template;
    } catch (error) {
      logger.error('Error creating template', error);
      throw error;
    }
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const query = `
      SELECT id, user_id, name, description, style_name, style_data, 
             preview_url, thumbnail_url, is_public, created_at, updated_at
      FROM templates
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting template', error);
      throw error;
    }
  }

  async getUserTemplates(userId: string): Promise<Template[]> {
    const query = `
      SELECT id, user_id, name, description, style_name, style_data, 
             preview_url, thumbnail_url, is_public, created_at, updated_at
      FROM templates
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await database.query(query, [userId]);
      return result.rows as Template[];
    } catch (error) {
      logger.error('Error getting user templates', error);
      throw error;
    }
  }

  // ===== CAROUSEL OPERATIONS =====

  async createCarousel(
    userId: string,
    input: CreateCarouselInput
  ): Promise<Carousel> {
    const query = `
      INSERT INTO carousels (user_id, title, description, template_id, category, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, title, description, template_id, slides_count, status, 
                content_type, tags, category, created_at, updated_at, published_at, scheduled_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        input.title,
        input.description || null,
        input.template_id || null,
        input.category || null,
        input.tags || [],
      ]);

      return result.rows[0] as Carousel;
    } catch (error) {
      logger.error('Error creating carousel', error);
      throw error;
    }
  }

  async getCarouselById(id: string): Promise<Carousel | null> {
    const query = `
      SELECT id, user_id, title, description, template_id, slides_count, status, 
             content_type, tags, category, created_at, updated_at, published_at, scheduled_at
      FROM carousels
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
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
  ): Promise<{ data: Carousel[]; total: number }> {
    const whereClause = status ? 'WHERE user_id = $1 AND status = $2' : 'WHERE user_id = $1';
    const params = status ? [userId, status] : [userId];

    const query = `
      SELECT id, user_id, title, description, template_id, slides_count, status, 
             content_type, tags, category, created_at, updated_at, published_at, scheduled_at
      FROM carousels
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `SELECT COUNT(*) FROM carousels ${whereClause}`;

    try {
      const [dataResult, countResult] = await Promise.all([
        database.query(query, [...params, limit, offset]),
        database.query(countQuery, params),
      ]);

      return {
        data: dataResult.rows as Carousel[],
        total: parseInt(countResult.rows[0].count, 10),
      };
    } catch (error) {
      logger.error('Error getting user carousels', error);
      throw error;
    }
  }

  async updateCarouselStatus(
    carouselId: string,
    status: string
  ): Promise<Carousel> {
    const query = `
      UPDATE carousels
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, user_id, title, description, template_id, slides_count, status, 
                content_type, tags, category, created_at, updated_at, published_at, scheduled_at
    `;

    try {
      const result = await database.query(query, [status, carouselId]);
      return result.rows[0] as Carousel;
    } catch (error) {
      logger.error('Error updating carousel status', error);
      throw error;
    }
  }

  async scheduleCarousel(
    carouselId: string,
    scheduledAt: Date
  ): Promise<Carousel> {
    const query = `
      UPDATE carousels
      SET scheduled_at = $1, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, user_id, title, description, template_id, slides_count, status, 
                content_type, tags, category, created_at, updated_at, published_at, scheduled_at
    `;

    try {
      const result = await database.query(query, [scheduledAt, carouselId]);
      return result.rows[0] as Carousel;
    } catch (error) {
      logger.error('Error scheduling carousel', error);
      throw error;
    }
  }

  // ===== SLIDE OPERATIONS =====

  async createSlide(
    carouselId: string,
    input: CreateSlideInput
  ): Promise<Slide> {
    const query = `
      INSERT INTO slides (carousel_id, slide_number, title, description, content_text, 
                         image_url, style_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, carousel_id, slide_number, title, description, content_text, 
                image_url, style_data, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        carouselId,
        input.slide_number,
        input.title || null,
        input.description || null,
        input.content_text || null,
        input.image_url || null,
        input.style_data ? JSON.stringify(input.style_data) : null,
      ]);

      return result.rows[0] as Slide;
    } catch (error) {
      logger.error('Error creating slide', error);
      throw error;
    }
  }

  async getCarouselSlides(carouselId: string): Promise<Slide[]> {
    const query = `
      SELECT id, carousel_id, slide_number, title, description, content_text, 
             image_url, style_data, created_at, updated_at
      FROM slides
      WHERE carousel_id = $1
      ORDER BY slide_number ASC
    `;

    try {
      const result = await database.query(query, [carouselId]);
      return result.rows as Slide[];
    } catch (error) {
      logger.error('Error getting carousel slides', error);
      throw error;
    }
  }

  async updateCarouselSlidesCount(carouselId: string): Promise<void> {
    const query = `
      UPDATE carousels
      SET slides_count = (
        SELECT COUNT(*) FROM slides WHERE carousel_id = $1
      ), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await database.query(query, [carouselId]);
    } catch (error) {
      logger.error('Error updating carousel slides count', error);
      throw error;
    }
  }

  async updateSlide(slideId: string, input: Partial<CreateSlideInput>): Promise<Slide> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.content_text !== undefined) {
      updates.push(`content_text = $${paramIndex++}`);
      values.push(input.content_text);
    }
    if (input.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(input.image_url);
    }
    if (input.style_data !== undefined) {
      updates.push(`style_data = $${paramIndex++}`);
      values.push(JSON.stringify(input.style_data));
    }

    if (updates.length === 0) {
      throw new Error('No updates provided');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(slideId);

    const query = `
      UPDATE slides
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, carousel_id, slide_number, title, description, content_text, 
                image_url, style_data, created_at, updated_at
    `;

    try {
      const result = await database.query(query, values);
      return result.rows[0] as Slide;
    } catch (error) {
      logger.error('Error updating slide', error);
      throw error;
    }
  }

  async deleteSlide(slideId: string): Promise<void> {
    const query = 'DELETE FROM slides WHERE id = $1';

    try {
      await database.query(query, [slideId]);
    } catch (error) {
      logger.error('Error deleting slide', error);
      throw error;
    }
  }

  // ===== METRICS OPERATIONS =====

  async getOrCreateMetrics(carouselId: string): Promise<CarouselMetrics> {
    const selectQuery = 'SELECT * FROM carousel_metrics WHERE carousel_id = $1';

    try {
      let result = await database.query(selectQuery, [carouselId]);

      if (result.rows.length === 0) {
        const insertQuery = `
          INSERT INTO carousel_metrics (carousel_id)
          VALUES ($1)
          RETURNING id, carousel_id, likes_count, shares_count, comments_count, 
                    views_count, saves_count, engagement_rate, last_updated
        `;
        result = await database.query(insertQuery, [carouselId]);
      }

      return result.rows[0] as CarouselMetrics;
    } catch (error) {
      logger.error('Error getting or creating metrics', error);
      throw error;
    }
  }

  async updateMetrics(
    carouselId: string,
    metrics: Partial<CarouselMetrics>
  ): Promise<CarouselMetrics> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (metrics.likes_count !== undefined) {
      updates.push(`likes_count = $${paramIndex++}`);
      values.push(metrics.likes_count);
    }
    if (metrics.shares_count !== undefined) {
      updates.push(`shares_count = $${paramIndex++}`);
      values.push(metrics.shares_count);
    }
    if (metrics.comments_count !== undefined) {
      updates.push(`comments_count = $${paramIndex++}`);
      values.push(metrics.comments_count);
    }
    if (metrics.views_count !== undefined) {
      updates.push(`views_count = $${paramIndex++}`);
      values.push(metrics.views_count);
    }
    if (metrics.saves_count !== undefined) {
      updates.push(`saves_count = $${paramIndex++}`);
      values.push(metrics.saves_count);
    }
    if (metrics.engagement_rate !== undefined) {
      updates.push(`engagement_rate = $${paramIndex++}`);
      values.push(metrics.engagement_rate);
    }

    if (updates.length === 0) {
      throw new Error('No metrics to update');
    }

    updates.push(`last_updated = CURRENT_TIMESTAMP`);
    values.push(carouselId);

    const query = `
      UPDATE carousel_metrics
      SET ${updates.join(', ')}
      WHERE carousel_id = $${paramIndex}
      RETURNING id, carousel_id, likes_count, shares_count, comments_count, 
                views_count, saves_count, engagement_rate, last_updated
    `;

    try {
      const result = await database.query(query, values);
      return result.rows[0] as CarouselMetrics;
    } catch (error) {
      logger.error('Error updating metrics', error);
      throw error;
    }
  }
}

export default new ContentRepository();
