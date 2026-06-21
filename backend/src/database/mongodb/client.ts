/**
 * 云心伴 - MongoDB 数据库客户端
 */
import { MongoClient, Db, Collection } from 'mongodb';
import { mongoConfig } from '../../config/database';
import { logger } from '../../utils/logger';

class MongoDBClient {
  private client: MongoClient;
  private db: Db | null = null;
  private static instance: MongoDBClient;

  private constructor() {
    this.client = new MongoClient(mongoConfig.uri, {
      maxPoolSize: mongoConfig.maxPoolSize,
      minPoolSize: mongoConfig.minPoolSize,
      serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS,
      connectTimeoutMS: mongoConfig.connectTimeoutMS,
    });
  }

  static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  async connect(): Promise<void> {
    if (this.db) return;

    try {
      await this.client.connect();
      this.db = this.client.db(mongoConfig.dbName);
      logger.info('MongoDB 连接成功', { db: mongoConfig.dbName });

      // 验证连接
      await this.db.command({ ping: 1 });
    } catch (error: any) {
      logger.error('MongoDB 连接失败', { error: error.message });
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB 未连接，请先调用 connect()');
    }
    return this.db;
  }

  collection(name: string): Collection {
    return this.getDb().collection(name);
  }

  // 便捷访问常用集合
  get chatMessages() {
    return this.collection('chat_messages');
  }
  get sessionMemory() {
    return this.collection('session_memory');
  }
  get sentimentLogs() {
    return this.collection('sentiment_logs');
  }
  get auditArchive() {
    return this.collection('audit_archive');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getDb().command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
    logger.info('MongoDB 连接已关闭');
  }
}

export const mongoClient = MongoDBClient.getInstance();
