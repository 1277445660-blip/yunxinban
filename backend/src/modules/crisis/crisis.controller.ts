/**
 * 云心伴 - 危机预警控制器
 */
import { Request, Response } from 'express';
import { crisisService } from './crisis.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class CrisisController {
  /**
   * GET /api/v1/crisis/alerts
   */
  async getAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 权限控制：学生只能看自己的
      if (req.userRole === 'student') {
        res.status(403).json({ error: '权限不足' });
        return;
      }

      const alerts = await crisisService.getAlerts({
        status: req.query.status as string,
        riskLevel: req.query.risk_level as string,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      });
      res.json({ alerts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/crisis/alerts/:id
   */
  async getAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alert = await crisisService.getAlert(req.params.id);
      if (!alert) {
        res.status(404).json({ error: '预警不存在' });
        return;
      }
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/v1/crisis/alerts/:id
   */
  async updateAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertStatus, resolutionNote } = req.body;
      const alert = await crisisService.updateAlertStatus(
        req.params.id,
        alertStatus,
        req.userId!,
        resolutionNote,
      );
      if (!alert) {
        res.status(404).json({ error: '预警不存在' });
        return;
      }
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/crisis/alerts/:id/assign
   */
  async assignCounselor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { counselorId } = req.body;
      if (!counselorId) {
        res.status(400).json({ error: '请指定咨询师' });
        return;
      }
      const alert = await crisisService.assignCounselor(req.params.id, counselorId);
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/crisis/stats
   */
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await crisisService.getStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const crisisController = new CrisisController();
