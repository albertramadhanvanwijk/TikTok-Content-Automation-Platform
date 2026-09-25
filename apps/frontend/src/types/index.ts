export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface Carousel {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  template_id?: string;
  category?: string;
  tags: string[];
  slides_count: number;
  created_at: string;
  updated_at: string;
  scheduled_at?: string;
  published_at?: string;
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  title: string;
  description?: string;
  content_text?: string;
  image_url?: string;
  style_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  style_name: string;
  style_data: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarouselMetrics {
  id: string;
  carousel_id: string;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  views_count: number;
  saves_count: number;
  engagement_rate: number;
  last_updated: string;
}

export interface UploadJob {
  id: string;
  carousel_id: string;
  tiktok_account_id: string;
  status: 'pending' | 'uploading' | 'processing' | 'published' | 'failed';
  tiktok_video_id?: string;
  scheduled_at?: string;
  uploaded_at?: string;
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
