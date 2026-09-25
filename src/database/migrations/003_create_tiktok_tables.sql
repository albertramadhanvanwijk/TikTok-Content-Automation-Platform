-- Migration: 003_create_tiktok_tables.sql
-- Description: Create tables for TikTok integration and upload jobs
-- Created: 2026-09-25

-- TikTok Accounts table
CREATE TABLE IF NOT EXISTS tiktok_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tiktok_user_id VARCHAR(100) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP NOT NULL,
  is_connected BOOLEAN DEFAULT true,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tiktok_accounts_user_id ON tiktok_accounts(user_id);
CREATE INDEX idx_tiktok_accounts_username ON tiktok_accounts(username);
CREATE INDEX idx_tiktok_accounts_is_connected ON tiktok_accounts(is_connected);
CREATE TRIGGER update_tiktok_accounts_updated_at BEFORE UPDATE ON tiktok_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Upload Jobs table
CREATE TABLE IF NOT EXISTS tiktok_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  tiktok_account_id UUID NOT NULL REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
  video_file_path VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'published', 'failed')),
  tiktok_video_id VARCHAR(100),
  scheduled_at TIMESTAMP,
  uploaded_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upload_jobs_user_id ON tiktok_upload_jobs(user_id);
CREATE INDEX idx_upload_jobs_carousel_id ON tiktok_upload_jobs(carousel_id);
CREATE INDEX idx_upload_jobs_status ON tiktok_upload_jobs(status);
CREATE INDEX idx_upload_jobs_scheduled_at ON tiktok_upload_jobs(scheduled_at);
CREATE INDEX idx_upload_jobs_created_at ON tiktok_upload_jobs(created_at DESC);
CREATE TRIGGER update_upload_jobs_updated_at BEFORE UPDATE ON tiktok_upload_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Upload Job Logs table (for audit trail)
CREATE TABLE IF NOT EXISTS tiktok_upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_job_id UUID NOT NULL REFERENCES tiktok_upload_jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  message TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upload_logs_job_id ON tiktok_upload_logs(upload_job_id);
CREATE INDEX idx_upload_logs_created_at ON tiktok_upload_logs(created_at DESC);
