/**
 * 云心伴 - 用户控制器
 */
import { Request, Response } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class UserController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const profile = await userService.getProfile(req.userId!);
      if (!profile) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const profile = await userService.updateProfile(req.userId!, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCounselors(_req: Request, res: Response): Promise<void> {
    try {
      const counselors = await userService.getCounselors();
      res.json({ counselors });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.userRole !== 'admin') {
        res.status(403).json({ error: '权限不足' });
        return;
      }
      const stats = await userService.getUserStats();
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
