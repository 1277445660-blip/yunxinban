/**
 * 云心伴 - PostgreSQL 数据库客户端
 */
import { Pool, QueryResult } from 'pg';
import { postgresConfig } from '../../config/database';
import { logger } from '../../utils/logger';

class PostgresClient {
  private pool: Pool;
  private static instance: PostgresClient;

  private constructor() {
    this.pool = new Pool(postgresConfig);

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL 池错误', { error: err.message });
    });

    this.pool.on('connect', () => {
      logger.debug('PostgreSQL 新连接建立');
    });
  }

  static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn('慢查询', { text: text.substring(0, 200), duration, rows: result.rowCount });
      }
      return result;
    } catch (error: any) {
      logger.error('PostgreSQL 查询错误', { text: text.substring(0, 200), error: error.message });
      throw error;
    }
  }

  async transaction<T>(callback: (query: typeof this.query) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(
        async (text: string, params?: any[]) => {
          const res = await client.query(text, params);
          return res;
        }
      );
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('PostgreSQL 连接池已关闭');
  }
}

export const pgClient = PostgresClient.getInstance();
