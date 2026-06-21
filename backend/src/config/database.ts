/**
 * 云心伴 - 数据库配置
 */
import { PoolConfig } from 'pg';
import { config } from './index';

export const postgresConfig: PoolConfig = {
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  max: 20,                       // 最大连接数
  idleTimeoutMillis: 30000,      // 空闲超时
  connectionTimeoutMillis: 5000, // 连接超时
};

export const mongoConfig = {
  uri: config.mongodb.uri,
  dbName: config.mongodb.dbName,
  maxPoolSize: 50,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

export const redisConfig = {
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
};
