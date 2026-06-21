/**
 * 云心伴 - 危机预警路由
 */
import { Router } from 'express';
import { crisisController } from './crisis.controller';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';

const router = Router();

// 所有预警路由需要认证 + 辅导员/管理员权限
router.use(authMiddleware as any);
router.use(requireRole('counselor', 'admin') as any);

// GET /api/v1/crisis/alerts
router.get('/alerts', (req, res) => crisisController.getAlerts(req as any, res));

// GET /api/v1/crisis/alerts/:id
router.get('/alerts/:id', (req, res) => crisisController.getAlert(req as any, res));

// PUT /api/v1/crisis/alerts/:id
router.put('/alerts/:id', auditLog('crisis.update', 'crisis_alert'), (req, res) =>
  crisisController.updateAlert(req as any, res),
);

// POST /api/v1/crisis/alerts/:id/assign
router.post('/alerts/:id/assign', auditLog('crisis.assign', 'crisis_alert'), (req, res) =>
  crisisController.assignCounselor(req as any, res),
);

// GET /api/v1/crisis/stats
router.get('/stats', (req, res) => crisisController.getStats(req as any, res));

export { router as crisisRoutes };
