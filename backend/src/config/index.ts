/**
 * 云心伴 - 后端配置
 */
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  // 应用
  app: {
    name: process.env.APP_NAME || 'yunxinban',
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV !== 'production',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // PostgreSQL
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'yunxinban',
    user: process.env.POSTGRES_USER || 'yunxinban',
    password: process.env.POSTGRES_PASSWORD || 'yunxinban_dev',
  },

  // MongoDB
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/yunxinban',
    dbName: process.env.MONGO_DB || 'yunxinban',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // 加密
  encryption: {
    key: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', // 32字节 hex
    algorithm: 'aes-256-gcm' as const,
  },

  // AI 服务
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10),
  },

  // 危机预警
  crisis: {
    highThreshold: parseFloat(process.env.CRISIS_HIGH_THRESHOLD || '0.75'),
    criticalThreshold: parseFloat(process.env.CRISIS_CRITICAL_THRESHOLD || '0.9'),
    cooldownSeconds: parseInt(process.env.CRISIS_ALERT_COOLDOWN || '300', 10),
    emergencyHotline: process.env.EMERGENCY_HOTLINE || '400-161-9995',
  },

  // 限流
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
} as const;

export type Config = typeof config;
