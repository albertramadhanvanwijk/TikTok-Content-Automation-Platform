import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';
import { WebhookPayload, EventType } from '../models/Notification';

class WebhookService {
  /**
   * Dispatch webhook event
   */
  async dispatchEvent(
    webhook: any,
    eventType: EventType,
    payload: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if webhook listens to this event
      if (!webhook.events.includes(eventType) && !webhook.events.includes('*')) {
        logger.debug(`Webhook ${webhook.id} does not listen to ${eventType}`);
        return false;
      }

      const webhookPayload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        user_id: webhook.user_id,
        data: payload,
      };

      // Create signature if secret key exists
      const signature = webhook.secret_key
        ? this.createSignature(JSON.stringify(webhookPayload), webhook.secret_key)
        : undefined;

      const response = await axios.post(webhook.url, webhookPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
        },
      });

      logger.info(`Webhook ${webhook.id} dispatched successfully`);
      return response.status >= 200 && response.status < 300;
    } catch (error: any) {
      logger.error(`Error dispatching webhook ${webhook.id}`, error);
      throw error;
    }
  }

  /**
   * Dispatch event to all user webhooks
   */
  async dispatchToUser(
    _userId: string,
    eventType: EventType,
    payload: Record<string, any>,
    webhooks: any[]
  ): Promise<{ success: number; failed: number }> {
    try {
      let success = 0;
      let failed = 0;

      for (const webhook of webhooks) {
        if (!webhook.is_active) continue;

        try {
          const dispatched = await this.dispatchEvent(webhook, eventType, payload);
          if (dispatched) success++;
          else failed++;
        } catch (error) {
          failed++;
          logger.warn(`Webhook dispatch failed for ${webhook.id}`);
        }
      }

      logger.info(`Webhooks dispatched: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      logger.error('Error dispatching webhooks to user', error);
      throw error;
    }
  }

  /**
   * Create HMAC signature for webhook security
   */
  private createSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate webhook secret key
   */
  static generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new WebhookService();
