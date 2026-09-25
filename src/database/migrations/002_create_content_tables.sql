-- Migration: 002_create_content_tables.sql
-- Description: Create tables for carousel content management
-- Created: 2026-09-25

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  style_name VARCHAR(100) NOT NULL,
  style_data JSONB NOT NULL,
  preview_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Content/Carousel table
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES templates(id),
  slides_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  content_type VARCHAR(50) DEFAULT 'carousel',
  tags VARCHAR[] DEFAULT '{}',
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  scheduled_at TIMESTAMP
);

CREATE INDEX idx_carousels_user_id ON carousels(user_id);
CREATE INDEX idx_carousels_status ON carousels(status);
CREATE INDEX idx_carousels_scheduled_at ON carousels(scheduled_at);
CREATE TRIGGER update_carousels_updated_at BEFORE UPDATE ON carousels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Slides table
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  content_text TEXT,
  image_url VARCHAR(500),
  style_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(carousel_id, slide_number)
);

CREATE INDEX idx_slides_carousel_id ON slides(carousel_id);
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics/Metrics table
CREATE TABLE IF NOT EXISTS carousel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(carousel_id)
);

CREATE INDEX idx_metrics_carousel_id ON carousel_metrics(carousel_id);
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON carousel_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
