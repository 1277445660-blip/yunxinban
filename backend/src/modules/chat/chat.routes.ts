/**
 * 云心伴 - 聊天路由
 */
import { Router } from 'express';
import { chatController } from './chat.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { chatLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

// 所有聊天路由需要认证
router.use(authMiddleware as any);

// POST /api/v1/chat/sessions
router.post('/sessions', (req, res) => chatController.createSession(req as any, res));

// GET /api/v1/chat/sessions
router.get('/sessions', (req, res) => chatController.getSessions(req as any, res));

// GET /api/v1/chat/sessions/:id
router.get('/sessions/:id', (req, res) => chatController.getSession(req as any, res));

// POST /api/v1/chat/sessions/:id/messages
router.post('/sessions/:id/messages', chatLimiter, (req, res) =>
  chatController.sendMessage(req as any, res),
);

// GET /api/v1/chat/sessions/:id/messages
router.get('/sessions/:id/messages', (req, res) =>
  chatController.getMessages(req as any, res),
);

// POST /api/v1/chat/sessions/:id/close
router.post('/sessions/:id/close', (req, res) =>
  chatController.closeSession(req as any, res),
);

// GET /api/v1/chat/quick-topics
router.get('/quick-topics', (_req, res) => chatController.getQuickTopics(_req, res));

export { router as chatRoutes };
