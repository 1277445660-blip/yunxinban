/**
 * 云心伴 - 加密服务
 * 提供数据分级加密、脱敏、哈希能力
 */
import { encrypt, decrypt, sha256, encryptFields, decryptFields } from '../utils/crypto';
import { logger } from '../utils/logger';

/**
 * 数据加密等级
 */
export enum EncryptionLevel {
  L0 = 'L0', // 公开：不加密
  L1 = 'L1', // 标签数据：数据库层加密
  L2 = 'L2', // 敏感数据：AES-256-GCM
  L3 = 'L3', // 核心身份数据：AES-256 + 哈希
}

/**
 * 加密服务
 */
class EncryptionService {
  /**
   * 根据加密等级处理数据
   */
  encryptByLevel<T extends Record<string, any>>(
    data: T,
    fieldLevels: Record<string, EncryptionLevel>,
  ): T {
    const result = { ...data };

    for (const [field, level] of Object.entries(fieldLevels)) {
      if (result[field] === undefined || result[field] === null) continue;

      switch (level) {
        case EncryptionLevel.L3:
          // L3: 先哈希存储，原始值加密
          result[`${field}_hash`] = sha256(String(result[field]));
          result[field] = encrypt(String(result[field]));
          break;
        case EncryptionLevel.L2:
          // L2: AES-256-GCM 加密
          result[field] = encrypt(String(result[field]));
          break;
        case EncryptionLevel.L1:
          // L1: 不做应用层处理，依赖数据库层
          break;
        case EncryptionLevel.L0:
        default:
          // L0: 不处理
          break;
      }
    }

    return result;
  }

  /**
   * 解密数据
   */
  decryptByLevel<T extends Record<string, any>>(
    data: T,
    fieldLevels: Record<string, EncryptionLevel>,
  ): T {
    const result = { ...data };

    for (const [field, level] of Object.entries(fieldLevels)) {
      if (result[field] === undefined || result[field] === null) continue;

      switch (level) {
        case EncryptionLevel.L3:
        case EncryptionLevel.L2:
          try {
            result[field] = decrypt(String(result[field]));
          } catch {
            // 解密失败保留原值
          }
          break;
        default:
          break;
      }
    }

    return result;
  }

  /**
   * 哈希学号（单向脱敏）
   */
  hashStudentId(studentId: string): string {
    return sha256(studentId);
  }

  /**
   * 脱敏手机号（显示前3后4）
   */
  maskPhone(phone: string): string {
    if (phone.length < 7) return '****';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  /**
   * 脱敏姓名（只显示姓）
   */
  maskName(name: string): string {
    if (!name) return '**';
    return name[0] + (name.length > 1 ? '*' : '');
  }
}

export const encryptionService = new EncryptionService();
