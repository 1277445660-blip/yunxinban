/**
 * 云心伴 - 聊天服务
 */
import { v4 as uuidv4 } from 'uuid';
import { pgClient } from '../../database/postgres/client';
import { mongoClient } from '../../database/mongodb/client';
import { aiClient } from '../../services/aiClient.service';
import { logger } from '../../utils/logger';

interface SessionRow {
  id: string;
  user_id: string;
  session_type: string;
  title: string;
  mood_score_start: number;
  mood_score_end: number;
  status: string;
  started_at: string;
}

interface MessageDoc {
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: 'text' | 'voice';
  sentiment_score?: number;
  crisis_flags?: string[];
  created_at: Date;
}

class ChatService {
  /**
   * 创建新会话
   */
  async createSession(userId: string, sessionType: string = 'companion', title?: string) {
    const result = await pgClient.query<SessionRow>(
      `INSERT INTO chat_sessions (id, user_id, session_type, title, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [uuidv4(), userId, sessionType, title || '新的陪伴对话'],
    );
    return result.rows[0];
  }

  /**
   * 获取用户会话列表
   */
  async getUserSessions(userId: string, limit: number = 20) {
    const result = await pgClient.query<SessionRow>(
      `SELECT * FROM chat_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string) {
    const result = await pgClient.query<SessionRow>(
      'SELECT * FROM chat_sessions WHERE id = $1',
      [sessionId],
    );
    return result.rows[0] || null;
  }

  /**
   * 发送消息并获取 AI 回复（非流式）
   */
  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    contentType: 'text' | 'voice' = 'text',
  ) {
    // 1. 保存用户消息到 MongoDB
    const userMsg: MessageDoc = {
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: message,
      content_type: contentType,
      created_at: new Date(),
    };
    await mongoClient.chatMessages.insertOne(userMsg);

    // 2. 调用 AI 服务
    const aiResponse = await aiClient.chat({
      user_id: userId,
      session_id: sessionId,
      message,
      stream: false,
    });

    // 3. 保存 AI 回复到 MongoDB
    const assistantMsg: MessageDoc = {
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: aiResponse.content,
      content_type: 'text',
      sentiment_score: aiResponse.sentiment_score,
      crisis_flags: aiResponse.is_crisis ? ['crisis_detected'] : [],
      created_at: new Date(),
    };
    await mongoClient.chatMessages.insertOne(assistantMsg);

    // 4. 更新会话消息计数
    await pgClient.query(
      `UPDATE chat_sessions SET message_count = message_count + 2, updated_at = NOW()
       WHERE id = $1`,
      [sessionId],
    );

    // 5. 如果是危机，更新会话状态
    if (aiResponse.is_crisis) {
      await pgClient.query(
        `UPDATE chat_sessions SET status = 'escalated', updated_at = NOW() WHERE id = $1`,
        [sessionId],
      );
    }

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      isCrisis: aiResponse.is_crisis,
      sentimentScore: aiResponse.sentiment_score,
      moodLabel: aiResponse.mood_label,
    };
  }

  /**
   * 获取会话历史消息
   */
  async getMessages(sessionId: string, limit: number = 50, before?: string) {
    const filter: any = { session_id: sessionId };
    if (before) {
      filter.created_at = { $lt: new Date(before) };
    }

    const messages = await mongoClient.chatMessages
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return messages.reverse();
  }

  /**
   * 获取快捷话题标签
   */
  getQuickTopics() {
    return [
      { id: 'academic', label: '学业压力', emoji: '📚', prompt: '最近学习压力好大...' },
      { id: 'relationship', label: '人际困扰', emoji: '💔', prompt: '最近和朋友有些矛盾...' },
      { id: 'late_night', label: '深夜emo', emoji: '🌙', prompt: '深夜突然感觉好孤单...' },
      { id: 'future_anxiety', label: '未来迷茫', emoji: '🔮', prompt: '对未来感到很迷茫...' },
      { id: 'family', label: '家庭问题', emoji: '🏠', prompt: '家里有些事情让我困扰...' },
      { id: 'self_esteem', label: '自我怀疑', emoji: '🪞', prompt: '总觉得自己不够好...' },
      { id: 'stress', label: '日常压力', emoji: '😰', prompt: '各种事情堆在一起...' },
      { id: 'loneliness', label: '孤独感', emoji: '🧩', prompt: '总觉得很孤独...' },
    ];
  }

  /**
   * 关闭会话
   */
  async closeSession(sessionId: string, moodScoreEnd?: number) {
    await pgClient.query(
      `UPDATE chat_sessions
       SET status = 'closed', mood_score_end = $2, ended_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [sessionId, moodScoreEnd || null],
    );
  }
}

export const chatService = new ChatService();
