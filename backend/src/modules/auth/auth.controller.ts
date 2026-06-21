/**
 * 云心伴 - 认证控制器
 */
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, validate } from '../../utils/validator';
import { AuthRequest } from '../../middleware/auth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = validate(registerSchema, req.body);
      const result = await authService.register(data);
      res.status(201).json({
        message: '注册成功',
        user: {
          id: result.user.id,
          nickname: result.user.nickname,
          role: result.user.role,
        },
        token: result.token,
      });
    } catch (error: any) {
      if (error.message === '该学号已注册') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = validate(loginSchema, req.body);
      const result = await authService.login(data.studentId, data.password);
      res.json({
        message: '登录成功',
        ...result,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: '缺少刷新令牌' });
        return;
      }
      const result = authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/auth/privacy-policy
   */
  async privacyPolicy(_req: Request, res: Response): Promise<void> {
    const policy = authService.getPrivacyPolicy();
    res.json(policy);
  }

  /**
   * POST /api/v1/auth/consent
   */
  async consent(req: AuthRequest, res: Response): Promise<void> {
    try {
      await authService.consentPrivacy(req.userId!);
      res.json({ message: '隐私政策同意已记录' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/v1/auth/account
   */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      await authService.deleteAccount(req.userId!);
      res.json({ message: '账号已注销' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
