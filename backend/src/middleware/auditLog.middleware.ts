/**
 * 云心伴 - 审计日志中间件
 * 记录所有敏感操作
 */
import { Request, Response, NextFunction } from 'express';
import { pgClient } from '../database/postgres/client';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth.middleware';

interface AuditEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * 审计日志记录器
 */
class AuditLogger {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await pgClient.query(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          entry.userId || null,
          entry.action,
          entry.resourceType || null,
          entry.resourceId || null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.details ? JSON.stringify(entry.details) : null,
        ],
      );
    } catch (error: any) {
      console.error('审计日志写入失败:', error.message);
    }
  }
}

const auditLogger = new AuditLogger();

/**
 * 审计中间件工厂
 * @param action 操作类型
 * @param resourceType 资源类型
 */
export function auditLog(action: string, resourceType?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 记录响应完成后的审计日志
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // 异步记录，不阻塞响应
      auditLogger.log({
        userId: req.userId,
        action,
        resourceType,
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        },
      }).catch(() => {});

      return originalJson(body);
    };

    next();
  };
}

export { auditLogger };
