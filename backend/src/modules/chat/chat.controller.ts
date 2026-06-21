/**
 * 云心伴 - 聊天控制器
 */
import { Request, Response } from 'express';
import { chatService } from './chat.service';
import { createSessionSchema, sendMessageSchema, validate } from '../../utils/validator';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ChatController {
  /**
   * POST /api/v1/chat/sessions
   */
  async createSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = validate(createSessionSchema, req.body);
      const session = await chatService.createSession(req.userId!, data.sessionType, data.title);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/chat/sessions
   */
  async getSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sessions = await chatService.getUserSessions(req.userId!);
      res.json({ sessions });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/chat/sessions/:id
   */
  async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const session = await chatService.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ error: '会话不存在' });
        return;
      }
      if (session.user_id !== req.userId!) {
        res.status(403).json({ error: '无权访问此会话' });
        return;
      }
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/chat/sessions/:id/messages
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = validate(sendMessageSchema, req.body);
      const session = await chatService.getSession(req.params.id);
      if (!session) {
        res.status(404).json({ error: '会话不存在' });
        return;
      }

      const result = await chatService.sendMessage(
        req.userId!,
        req.params.id,
        data.message,
        data.contentType,
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/chat/sessions/:id/messages
   */
  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string | undefined;
      const messages = await chatService.getMessages(req.params.id, limit, before);
      res.json({ messages });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/chat/quick-topics
   */
  async getQuickTopics(_req: Request, res: Response): Promise<void> {
    const topics = chatService.getQuickTopics();
    res.json({ topics });
  }

  /**
   * POST /api/v1/chat/sessions/:id/close
   */
  async closeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { moodScoreEnd } = req.body;
      await chatService.closeSession(req.params.id, moodScoreEnd);
      res.json({ message: '会话已关闭' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const chatController = new ChatController();
