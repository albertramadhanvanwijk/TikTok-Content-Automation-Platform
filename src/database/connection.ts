import { Pool, QueryResult } from 'pg';
import databaseConfig from '../config/database';
import logger from '../utils/logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(databaseConfig);

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      process.exitCode = 1;
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info('Database connected successfully');
      client.release();
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async query(
    text: string,
    params?: any[]
  ): Promise<QueryResult<any>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug(`Executed query in ${duration}ms`);
      return result;
    } catch (error) {
      logger.error(`Query error: ${error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection closed');
  }

  getPool(): Pool {
    return this.pool;
  }
}

export default new Database();
