export interface TikTokAccount {
  id: string;
  user_id: string;
  tiktok_user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at: Date;
  is_connected: boolean;
  connected_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ConnectTikTokInput {
  code: string;
  redirect_uri: string;
}

export interface TikTokUploadJob {
  id: string;
  user_id: string;
  carousel_id: string;
  tiktok_account_id: string;
  video_file_path: string;
  title: string;
  description: string;
  status: 'pending' | 'uploading' | 'processing' | 'published' | 'failed';
  tiktok_video_id?: string;
  scheduled_at?: Date;
  uploaded_at?: Date;
  error_message?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUploadJobInput {
  carousel_id: string;
  tiktok_account_id: string;
  video_file_path: string;
  title: string;
  description: string;
  scheduled_at?: Date;
}
