/**
 * 云心伴 - 请求参数验证工具
 */
import { z } from 'zod';

// ============================================
// 用户相关
// ============================================

export const registerSchema = z.object({
  studentId: z.string().min(5).max(30),
  password: z.string().min(8).max(100),
  nickname: z.string().min(1).max(50).optional(),
  grade: z.string().max(20).optional(),
  college: z.string().max(100).optional(),
  role: z.enum(['student', 'counselor']).default('student'),
});

export const loginSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(1),
});

// ============================================
// 聊天相关
// ============================================

export const createSessionSchema = z.object({
  sessionType: z.enum(['companion', 'crisis', 'assessment']).default('companion'),
  title: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  contentType: z.enum(['text', 'voice']).default('text'),
});

// ============================================
// 危机预警相关
// ============================================

export const updateAlertSchema = z.object({
  alertStatus: z.enum(['acknowledged', 'escalated', 'resolved']),
  resolutionNote: z.string().max(1000).optional(),
});

export const assignCounselorSchema = z.object({
  counselorId: z.string().uuid(),
});

// ============================================
// 通用工具
// ============================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(messages.join('; '));
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
