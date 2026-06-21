/**
 * 云心伴 - 认证路由
 */
import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { loginLimiter } from '../../middleware/rateLimiter.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', auditLog('user.register', 'user'), (req, res) =>
  authController.register(req, res),
);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, auditLog('user.login', 'user'), (req, res) =>
  authController.login(req, res),
);

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => authController.refresh(req, res));

// GET /api/v1/auth/privacy-policy
router.get('/privacy-policy', (_req, res) => authController.privacyPolicy(_req, res));

// POST /api/v1/auth/consent
router.post('/consent', authMiddleware, (req, res) =>
  authController.consent(req as any, res),
);

// DELETE /api/v1/auth/account
router.delete('/account', authMiddleware, auditLog('user.delete', 'user'), (req, res) =>
  authController.deleteAccount(req as any, res),
);

export { router as authRoutes };
