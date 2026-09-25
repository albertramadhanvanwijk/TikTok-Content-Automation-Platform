export interface NotificationPreferences {
  id: string;
  user_id: string;
  telegram_enabled: boolean;
  telegram_chat_id?: string;
  email_enabled: boolean;
  webhook_enabled: boolean;
  notify_on_upload_success: boolean;
  notify_on_upload_failure: boolean;
  notify_on_scheduled_post: boolean;
  notify_on_analytics_update: boolean;
  notify_on_new_engagement: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key?: string;
  last_triggered?: Date;
  failed_attempts: number;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  attempt_count: number;
  next_retry?: Date;
  created_at: Date;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: 'telegram' | 'email' | 'webhook';
  title: string;
  message: string;
  event_type?: string;
  related_carousel_id?: string;
  status: 'sent' | 'failed' | 'pending';
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface SendNotificationInput {
  user_id: string;
  title: string;
  message: string;
  event_type: string;
  carousel_id?: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  user_id: string;
  data: Record<string, any>;
}

export type EventType =
  | 'carousel.created'
  | 'carousel.published'
  | 'carousel.scheduled'
  | 'carousel.uploaded'
  | 'carousel.failed'
  | 'carousel.engagement_updated'
  | 'user.content_generated'
  | 'system.alert';
