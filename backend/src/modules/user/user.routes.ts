import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware as any);

router.get('/profile', (req, res) => userController.getProfile(req as any, res));
router.put('/profile', (req, res) => userController.updateProfile(req as any, res));
router.get('/counselors', (req, res) => userController.getCounselors(req, res));
router.get('/stats', (req, res) => userController.getStats(req as any, res));

export { router as userRoutes };
