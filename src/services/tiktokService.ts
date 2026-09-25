import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export interface TikTokAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface TikTokVideoUploadParams {
  video_file: Buffer;
  title: string;
  description: string;
  tags?: string[];
  thumbnail?: Buffer;
}

export interface TikTokUploadResponse {
  data: {
    video_id: string;
    status: string;
    create_time: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TikTokVideoMetrics {
  video_id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  play_count: number;
}

class TikTokService {
  private client: AxiosInstance;
  private baseUrl = 'https://open.tiktokapis.com/v1';
  private clientKey: string;
  private clientSecret: string;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('TikTok API error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Get access token using authorization code (OAuth flow)
   */
  async getAccessToken(code: string): Promise<TikTokAuthResponse> {
    try {
      const response = await this.client.post('/oauth/token/', {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting TikTok access token', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokAuthResponse> {
    try {
      const response = await this.client.post('/oauth/token/', {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error) {
      logger.error('Error refreshing TikTok access token', error);
      throw error;
    }
  }

  /**
   * Upload video to TikTok
   */
  async uploadVideo(
    accessToken: string,
    params: TikTokVideoUploadParams
  ): Promise<TikTokUploadResponse> {
    try {
      // First, get upload URL
      const initResponse = await this.client.post(
        '/video/upload/init/',
        {
          source_info: {
            source: 'FILE_UPLOAD',
            platform: 'TIKTOK',
          },
          post_info: {
            title: params.title,
            description: params.description,
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const uploadUrl = initResponse.data.data.upload_url;
      const publishId = initResponse.data.data.publish_id;

      // Upload video file
      await axios.put(uploadUrl, params.video_file, {
        headers: {
          'Content-Type': 'video/mp4',
        },
        timeout: 120000, // 2 minutes for large files
      });

      // Complete upload
      const completeResponse = await this.client.post(
        '/video/upload/complete/',
        {
          publish_id: publishId,
          post_info: {
            title: params.title,
            description: params.description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info(`Video uploaded to TikTok: ${completeResponse.data.data.video_id}`);

      return completeResponse.data;
    } catch (error) {
      logger.error('Error uploading video to TikTok', error);
      throw error;
    }
  }

  /**
   * Get video metrics/analytics
   */
  async getVideoMetrics(
    accessToken: string,
    videoId: string
  ): Promise<TikTokVideoMetrics> {
    try {
      const response = await this.client.get(
        `/video/query/?fields=like_count,comment_count,share_count,view_count,play_count`,
        {
          params: {
            video_ids: videoId,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const videoData = response.data.data.videos[0];

      return {
        video_id: videoId,
        like_count: videoData.like_count || 0,
        comment_count: videoData.comment_count || 0,
        share_count: videoData.share_count || 0,
        view_count: videoData.view_count || 0,
        play_count: videoData.play_count || 0,
      };
    } catch (error) {
      logger.error('Error getting video metrics', error);
      throw error;
    }
  }

  /**
   * Delete video from TikTok
   */
  async deleteVideo(accessToken: string, videoId: string): Promise<boolean> {
    try {
      await this.client.delete(`/video/?video_id=${videoId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      logger.info(`Video deleted from TikTok: ${videoId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting video from TikTok', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.client.get('/user/info/?fields=open_id', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return true;
    } catch (error) {
      logger.warn('Invalid or expired access token', error);
      return false;
    }
  }

  /**
   * Build TikTok OAuth authorization URL
   */
  buildAuthorizationUrl(
    state: string,
    redirectUri: string,
    scopes: string[] = ['user.info.basic', 'video.upload']
  ): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });

    return `https://www.tiktok.com/v1/oauth/authorize/?${params.toString()}`;
  }
}

export default new TikTokService();
