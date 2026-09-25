import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

class TelegramService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.telegram.org/bot';
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    this.client = axios.create({
      timeout: 10000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Telegram API error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Send message to Telegram chat
   */
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${this.botToken}/sendMessage`;

      const response = await this.client.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });

      if (response.data.ok) {
        logger.info(`Message sent to Telegram: ${chatId}`);
        return true;
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      logger.error('Error sending Telegram message', error);
      throw error;
    }
  }

  /**
   * Send formatted notification message
   */
  async sendNotification(
    chatId: string,
    title: string,
    message: string,
    eventType?: string
  ): Promise<boolean> {
    try {
      const emoji = this.getEmojiForEvent(eventType);
      const formattedMessage = `${emoji} <b>${title}</b>\n\n${message}`;

      return await this.sendMessage(chatId, formattedMessage);
    } catch (error) {
      logger.error('Error sending notification', error);
      throw error;
    }
  }

  /**
   * Send alert with inline buttons
   */
  async sendAlert(
    chatId: string,
    title: string,
    message: string,
    buttons?: Array<{ text: string; url: string }>
  ): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${this.botToken}/sendMessage`;

      const reply_markup = buttons
        ? {
            inline_keyboard: [
              buttons.map((btn) => ({
                text: btn.text,
                url: btn.url,
              })),
            ],
          }
        : undefined;

      const response = await this.client.post(url, {
        chat_id: chatId,
        text: `⚠️ <b>${title}</b>\n\n${message}`,
        parse_mode: 'HTML',
        reply_markup,
      });

      if (response.data.ok) {
        logger.info(`Alert sent to Telegram: ${chatId}`);
        return true;
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      logger.error('Error sending alert', error);
      throw error;
    }
  }

  /**
   * Verify bot token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${this.botToken}/getMe`;
      const response = await this.client.get(url);

      if (response.data.ok) {
        logger.info('Telegram bot token verified');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error verifying Telegram token', error);
      return false;
    }
  }

  /**
   * Helper: Get emoji for event type
   */
  private getEmojiForEvent(eventType?: string): string {
    const emojiMap: Record<string, string> = {
      'carousel.created': '📝',
      'carousel.published': '✅',
      'carousel.scheduled': '📅',
      'carousel.uploaded': '🚀',
      'carousel.failed': '❌',
      'carousel.engagement_updated': '📊',
      'user.content_generated': '🤖',
      'system.alert': '⚠️',
    };

    return emojiMap[eventType || ''] || '📢';
  }
}

export default new TelegramService();
