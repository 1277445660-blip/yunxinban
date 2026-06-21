/**
 * 云心伴 - 通知推送服务
 * 支持：系统内通知、微信推送、短信通知
 */
import { pgClient } from '../database/postgres/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface NotificationPayload {
  userId: string;
  type: 'crisis_alert' | 'appointment' | 'system' | 'reminder';
  title: string;
  content: string;
}

class NotificationService {
  /**
   * 推送通知给用户
   */
  async send(payload: NotificationPayload): Promise<void> {
    try {
      // 1. 存入数据库通知表
      await pgClient.query(
        `INSERT INTO notifications (id, user_id, type, title, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), payload.userId, payload.type, payload.title, payload.content],
      );

      // 2. 如果是危机预警，额外推送
      if (payload.type === 'crisis_alert') {
        await this.sendCrisisAlert(payload);
      }

      logger.info('通知已发送', { userId: payload.userId, type: payload.type });
    } catch (error: any) {
      logger.error('通知发送失败', { error: error.message, payload });
    }
  }

  /**
   * 危机预警通知（高优先级）
   */
  private async sendCrisisAlert(payload: NotificationPayload): Promise<void> {
    // TODO: 集成微信小程序订阅消息推送
    // TODO: 高危情况触发短信通知
    // 当前阶段：仅数据库记录 + 日志告警
    logger.warn('⚠️ 危机预警通知', {
      userId: payload.userId,
      title: payload.title,
      content: payload.content.substring(0, 100),
    });
  }

  /**
   * 批量推送通知
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    const values: any[] = [];
    const placeholders: string[] = [];

    payloads.forEach((p, i) => {
      const base = i * 5;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      values.push(uuidv4(), p.userId, p.type, p.title, p.content);
    });

    try {
      await pgClient.query(
        `INSERT INTO notifications (id, user_id, type, title, content) VALUES ${placeholders.join(', ')}`,
        values,
      );
    } catch (error: any) {
      logger.error('批量通知发送失败', { error: error.message });
    }
  }

  /**
   * 获取用户未读通知
   */
  async getUnread(userId: string, limit: number = 20) {
    const result = await pgClient.query(
      `SELECT id, type, title, content, is_read, created_at
       FROM notifications
       WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<void> {
    await pgClient.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1`,
      [notificationId],
    );
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    await pgClient.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
  }
}

export const notificationService = new NotificationService();
