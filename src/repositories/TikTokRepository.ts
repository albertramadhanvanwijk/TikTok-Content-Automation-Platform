import database from '../database/connection';
import { TikTokAccount, TikTokUploadJob, CreateUploadJobInput } from '../models/TikTok';
import logger from '../utils/logger';

class TikTokRepository {
  // ===== TIKTOK ACCOUNT OPERATIONS =====

  async createAccount(
    userId: string,
    tiktokUserId: string,
    username: string,
    displayName: string,
    accessToken: string,
    refreshToken: string | null,
    tokenExpiresAt: Date
  ): Promise<TikTokAccount> {
    const query = `
      INSERT INTO tiktok_accounts 
      (user_id, tiktok_user_id, username, display_name, access_token, refresh_token, token_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, tiktok_user_id, username, display_name, avatar_url, 
                access_token, refresh_token, token_expires_at, is_connected, 
                connected_at, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        tiktokUserId,
        username,
        displayName,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      ]);

      return result.rows[0] as TikTokAccount;
    } catch (error) {
      logger.error('Error creating TikTok account', error);
      throw error;
    }
  }

  async getAccountById(id: string): Promise<TikTokAccount | null> {
    const query = `
      SELECT id, user_id, tiktok_user_id, username, display_name, avatar_url, 
             access_token, refresh_token, token_expires_at, is_connected, 
             connected_at, created_at, updated_at
      FROM tiktok_accounts
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting TikTok account', error);
      throw error;
    }
  }

  async getUserAccounts(userId: string): Promise<TikTokAccount[]> {
    const query = `
      SELECT id, user_id, tiktok_user_id, username, display_name, avatar_url, 
             access_token, refresh_token, token_expires_at, is_connected, 
             connected_at, created_at, updated_at
      FROM tiktok_accounts
      WHERE user_id = $1
      ORDER BY connected_at DESC
    `;

    try {
      const result = await database.query(query, [userId]);
      return result.rows as TikTokAccount[];
    } catch (error) {
      logger.error('Error getting user TikTok accounts', error);
      throw error;
    }
  }

  async updateAccessToken(
    accountId: string,
    accessToken: string,
    refreshToken: string | null,
    tokenExpiresAt: Date
  ): Promise<TikTokAccount> {
    const query = `
      UPDATE tiktok_accounts
      SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, user_id, tiktok_user_id, username, display_name, avatar_url, 
                access_token, refresh_token, token_expires_at, is_connected, 
                connected_at, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        accessToken,
        refreshToken,
        tokenExpiresAt,
        accountId,
      ]);

      return result.rows[0] as TikTokAccount;
    } catch (error) {
      logger.error('Error updating TikTok access token', error);
      throw error;
    }
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const query = `
      UPDATE tiktok_accounts
      SET is_connected = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await database.query(query, [accountId]);
    } catch (error) {
      logger.error('Error disconnecting TikTok account', error);
      throw error;
    }
  }

  // ===== UPLOAD JOB OPERATIONS =====

  async createUploadJob(
    userId: string,
    input: CreateUploadJobInput
  ): Promise<TikTokUploadJob> {
    const query = `
      INSERT INTO tiktok_upload_jobs 
      (user_id, carousel_id, tiktok_account_id, video_file_path, title, description, scheduled_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, carousel_id, tiktok_account_id, video_file_path, title, 
                description, status, tiktok_video_id, scheduled_at, uploaded_at, 
                error_message, retry_count, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        userId,
        input.carousel_id,
        input.tiktok_account_id,
        input.video_file_path,
        input.title,
        input.description,
        input.scheduled_at || null,
      ]);

      return result.rows[0] as TikTokUploadJob;
    } catch (error) {
      logger.error('Error creating upload job', error);
      throw error;
    }
  }

  async getUploadJobById(id: string): Promise<TikTokUploadJob | null> {
    const query = `
      SELECT id, user_id, carousel_id, tiktok_account_id, video_file_path, title, 
             description, status, tiktok_video_id, scheduled_at, uploaded_at, 
             error_message, retry_count, created_at, updated_at
      FROM tiktok_upload_jobs
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting upload job', error);
      throw error;
    }
  }

  async getCarouselUploadJobs(carouselId: string): Promise<TikTokUploadJob[]> {
    const query = `
      SELECT id, user_id, carousel_id, tiktok_account_id, video_file_path, title, 
             description, status, tiktok_video_id, scheduled_at, uploaded_at, 
             error_message, retry_count, created_at, updated_at
      FROM tiktok_upload_jobs
      WHERE carousel_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await database.query(query, [carouselId]);
      return result.rows as TikTokUploadJob[];
    } catch (error) {
      logger.error('Error getting carousel upload jobs', error);
      throw error;
    }
  }

  async getPendingUploadJobs(): Promise<TikTokUploadJob[]> {
    const query = `
      SELECT id, user_id, carousel_id, tiktok_account_id, video_file_path, title, 
             description, status, tiktok_video_id, scheduled_at, uploaded_at, 
             error_message, retry_count, created_at, updated_at
      FROM tiktok_upload_jobs
      WHERE status = 'pending' 
      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
      AND retry_count < 3
      ORDER BY created_at ASC
      LIMIT 10
    `;

    try {
      const result = await database.query(query);
      return result.rows as TikTokUploadJob[];
    } catch (error) {
      logger.error('Error getting pending upload jobs', error);
      throw error;
    }
  }

  async updateUploadJobStatus(
    jobId: string,
    status: string,
    tiktokVideoId?: string,
    errorMessage?: string
  ): Promise<TikTokUploadJob> {
    const query = `
      UPDATE tiktok_upload_jobs
      SET status = $1, 
          tiktok_video_id = COALESCE($2, tiktok_video_id),
          error_message = COALESCE($3, error_message),
          uploaded_at = CASE WHEN $1 = 'published' THEN CURRENT_TIMESTAMP ELSE uploaded_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, user_id, carousel_id, tiktok_account_id, video_file_path, title, 
                description, status, tiktok_video_id, scheduled_at, uploaded_at, 
                error_message, retry_count, created_at, updated_at
    `;

    try {
      const result = await database.query(query, [
        status,
        tiktokVideoId || null,
        errorMessage || null,
        jobId,
      ]);

      return result.rows[0] as TikTokUploadJob;
    } catch (error) {
      logger.error('Error updating upload job status', error);
      throw error;
    }
  }

  async incrementRetryCount(jobId: string): Promise<void> {
    const query = `
      UPDATE tiktok_upload_jobs
      SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await database.query(query, [jobId]);
    } catch (error) {
      logger.error('Error incrementing retry count', error);
      throw error;
    }
  }

  // ===== UPLOAD LOG OPERATIONS =====

  async logUploadEvent(
    uploadJobId: string,
    status: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    const query = `
      INSERT INTO tiktok_upload_logs (upload_job_id, status, message, details)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      await database.query(query, [
        uploadJobId,
        status,
        message,
        details ? JSON.stringify(details) : null,
      ]);
    } catch (error) {
      logger.error('Error logging upload event', error);
      throw error;
    }
  }

  async getUploadLogs(uploadJobId: string) {
    const query = `
      SELECT id, upload_job_id, status, message, details, created_at
      FROM tiktok_upload_logs
      WHERE upload_job_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await database.query(query, [uploadJobId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting upload logs', error);
      throw error;
    }
  }
}

export default new TikTokRepository();
