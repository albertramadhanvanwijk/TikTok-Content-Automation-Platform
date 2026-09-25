export interface Template {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  style_name: string;
  style_data: Record<string, any>;
  preview_url?: string;
  thumbnail_url?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  style_name: string;
  style_data: Record<string, any>;
  is_public?: boolean;
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  title?: string;
  description?: string;
  content_text?: string;
  image_url?: string;
  style_data?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSlideInput {
  slide_number: number;
  title?: string;
  description?: string;
  content_text?: string;
  image_url?: string;
  style_data?: Record<string, any>;
}

export interface Carousel {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  template_id?: string;
  slides_count: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  content_type: string;
  tags: string[];
  category?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  scheduled_at?: Date;
}

export interface CreateCarouselInput {
  title: string;
  description?: string;
  template_id?: string;
  category?: string;
  tags?: string[];
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
  last_updated: Date;
}

export interface CarouselResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  slides_count: number;
  created_at: Date;
  published_at?: Date;
  scheduled_at?: Date;
}
