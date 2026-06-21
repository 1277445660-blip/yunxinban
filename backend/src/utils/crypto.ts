/**
 * 云心伴 - 加密工具
 * AES-256-GCM 加解密 + 哈希
 */
import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY = Buffer.from(config.encryption.key, 'utf-8').subarray(0, 32);

/**
 * AES-256-GCM 加密
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // 格式: iv:authTag:encrypted (均为 hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * AES-256-GCM 解密
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('无效的密文格式');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

/**
 * SHA-256 哈希（用于学号、手机号脱敏）
 */
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * 生成安全随机 Token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 加密对象中的指定字段
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]) as any;
    }
  }
  return result;
}

/**
 * 解密对象中的指定字段
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = decrypt(result[field]) as any;
      } catch {
        // 解密失败（可能是未加密的旧数据），保持原值
      }
    }
  }
  return result;
}
