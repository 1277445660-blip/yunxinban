/**
 * 云心伴 - 速率限制中间件
 */
import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * 通用 API 限流
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 优先使用用户 ID，其次使用 IP
    return (req as any).userId || req.ip || 'unknown';
  },
});

/**
 * 登录接口专用限流（更严格）
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 最多 10 次
  message: { error: '登录尝试过多，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI 聊天接口限流
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 30, // 最多 30 条消息
  message: { error: '消息发送过于频繁，请稍后再发' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).userId || req.ip || 'unknown',
});
