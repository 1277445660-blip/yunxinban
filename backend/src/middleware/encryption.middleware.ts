/**
 * 云心伴 - 加密中间件
 * 在数据写入/读取时自动进行字段级加解密
 */
import { Request, Response, NextFunction } from 'express';
import { encryptionService, EncryptionLevel } from '../services/encryption.service';

/**
 * 敏感字段加密等级映射
 */
const SENSITIVE_FIELDS: Record<string, EncryptionLevel> = {
  studentId: EncryptionLevel.L3,
  phone: EncryptionLevel.L3,
  realName: EncryptionLevel.L3,
  chatContent: EncryptionLevel.L2,
  assessmentResults: EncryptionLevel.L2,
  email: EncryptionLevel.L2,
};

/**
 * 请求体加密中间件（写入前加密敏感字段）
 */
export function encryptRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = encryptionService.encryptByLevel(req.body, SENSITIVE_FIELDS);
  }
  next();
}

/**
 * 响应体解密中间件（读取后解密）
 * 注意：这是一个概念性实现，实际使用时需要更精细的控制
 */
export function decryptResponseBody(
  data: Record<string, any>,
): Record<string, any> {
  if (data && typeof data === 'object') {
    return encryptionService.decryptByLevel(data, SENSITIVE_FIELDS);
  }
  return data;
}
