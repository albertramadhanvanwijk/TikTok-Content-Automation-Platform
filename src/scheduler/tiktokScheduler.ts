import cron from 'node-cron';
import tiktokIntegrationService from '../services/tiktokIntegrationService';
import logger from '../utils/logger';

class TikTokScheduler {
  private uploadJobTask: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler
   * Process pending upload jobs every 5 minutes
   */
  start() {
    try {
      // Run every 5 minutes
      this.uploadJobTask = cron.schedule('*/5 * * * *', async () => {
        logger.debug('TikTok upload job scheduler triggered');
        try {
          await tiktokIntegrationService.processPendingJobs();
        } catch (error) {
          logger.error('Error in TikTok upload job scheduler', error);
        }
      });

      logger.info('TikTok scheduler started - processing pending jobs every 5 minutes');
    } catch (error) {
      logger.error('Error starting TikTok scheduler', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    try {
      if (this.uploadJobTask) {
        this.uploadJobTask.stop();
        this.uploadJobTask.destroy();
        logger.info('TikTok scheduler stopped');
      }
    } catch (error) {
      logger.error('Error stopping TikTok scheduler', error);
    }
  }

  /**
   * Manually trigger job processing
   */
  async triggerNow() {
    try {
      logger.info('Manually triggering TikTok upload job processing');
      await tiktokIntegrationService.processPendingJobs();
    } catch (error) {
      logger.error('Error in manual trigger', error);
      throw error;
    }
  }
}

export default new TikTokScheduler();
