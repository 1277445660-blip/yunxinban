/**
 * 云心伴 - JWT 认证中间件
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * JWT 认证中间件
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' });
      return;
    }
    logger.warn('JWT 验证失败', { error: error.message });
    res.status(401).json({ error: '无效的认证令牌' });
  }
}

/**
 * 可选认证（不强制，但解析 Token）
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), config.jwt.secret) as JwtPayload;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // 不报错，继续处理
    }
  }
  next();
}

/**
 * 角色验证中间件
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: '未认证' });
      return;
    }
    if (!roles.includes(req.userRole)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }
    next();
  };
}
