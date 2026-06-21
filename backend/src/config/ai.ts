/**
 * 云心伴 - AI 服务配置
 */
import { config } from './index';

export const aiServiceConfig = {
  baseURL: config.aiService.url,
  timeout: config.aiService.timeout,

  // AI 服务接口端点
  endpoints: {
    chat: '/api/chat',
    analyze: '/api/analyze',
    detectCrisis: '/api/detect-crisis',
    health: '/api/health',
    memoryContext: '/api/chat/memory/context',
  },
} as const;
