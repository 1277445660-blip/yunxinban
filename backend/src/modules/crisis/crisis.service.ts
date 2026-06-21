/**
 * 云心伴 - 危机预警服务
 */
import { v4 as uuidv4 } from 'uuid';
import { pgClient } from '../../database/postgres/client';
import { aiClient } from '../../services/aiClient.service';
import { notificationService } from '../../services/notification.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { sha256 } from '../../utils/crypto';

interface AlertRow {
  id: string;
  user_id: string;
  session_id: string;
  risk_level: string;
  sentiment_score: number;
  trigger_text_hash: string;
  alert_status: string;
  assigned_counselor_id: string;
  created_at: string;
}

interface CreateAlertParams {
  userId: string;
  sessionId: string;
  riskLevel: string;
  sentimentScore: number;
  triggerText: string;
}

class CrisisService {
  /**
   * 创建危机预警
   */
  async createAlert(params: CreateAlertParams) {
    const triggerHash = sha256(params.triggerText).substring(0, 16);

    const result = await pgClient.query<AlertRow>(
      `INSERT INTO crisis_alerts (id, user_id, session_id, risk_level, sentiment_score, trigger_text_hash, alert_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [
        uuidv4(),
        params.userId,
        params.sessionId,
        params.riskLevel,
        params.sentimentScore,
        triggerHash,
      ],
    );

    const alert = result.rows[0];

    // 高危/极危：立即通知
    if (['high', 'critical', 'red'].includes(params.riskLevel)) {
      await notificationService.send({
        userId: params.userId,
        type: 'crisis_alert',
        title: '⚠️ 紧急心理支持',
        content: `我们关注到你可能正在经历困难时刻。请记住，你不需要独自面对。拨打心理援助热线：${config.crisis.emergencyHotline}`,
      });
    }

    logger.warn('危机预警已创建', {
      alertId: alert.id,
      userId: params.userId,
      riskLevel: params.riskLevel,
    });

    return alert;
  }

  /**
   * 获取预警列表（辅导员/管理员）
   */
  async getAlerts(filters: {
    status?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = 'SELECT * FROM crisis_alerts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND alert_status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.riskLevel) {
      query += ` AND risk_level = $${paramIndex++}`;
      params.push(filters.riskLevel);
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(filters.limit || 20, filters.offset || 0);

    const result = await pgClient.query<AlertRow>(query, params);
    return result.rows;
  }

  /**
   * 获取预警详情
   */
  async getAlert(alertId: string) {
    const result = await pgClient.query<AlertRow>(
      'SELECT * FROM crisis_alerts WHERE id = $1',
      [alertId],
    );
    return result.rows[0] || null;
  }

  /**
   * 更新预警状态
   */
  async updateAlertStatus(
    alertId: string,
    status: string,
    counselorId?: string,
    resolutionNote?: string,
  ) {
    const result = await pgClient.query<AlertRow>(
      `UPDATE crisis_alerts
       SET alert_status = $1,
           assigned_counselor_id = COALESCE($2, assigned_counselor_id),
           resolution_note = $3,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $4
       RETURNING *`,
      [status, counselorId || null, resolutionNote || null, alertId],
    );
    return result.rows[0];
  }

  /**
   * 分配咨询师
   */
  async assignCounselor(alertId: string, counselorId: string) {
    // 更新预警
    const alert = await pgClient.query<AlertRow>(
      `UPDATE crisis_alerts
       SET assigned_counselor_id = $1, alert_status = 'acknowledged'
       WHERE id = $2
       RETURNING *`,
      [counselorId, alertId],
    );

    if (!alert.rows[0]) {
      throw new Error('预警不存在');
    }

    // 创建咨询师分配记录
    await pgClient.query(
      `INSERT INTO counselor_assignments (id, counselor_id, user_id, assignment_type, status)
       VALUES ($1, $2, $3, 'intervention', 'active')`,
      [uuidv4(), counselorId, alert.rows[0].user_id],
    );

    return alert.rows[0];
  }

  /**
   * 获取预警统计
   */
  async getStats() {
    const result = await pgClient.query(`
      SELECT
        risk_level,
        alert_status,
        COUNT(*) as count
      FROM crisis_alerts
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY risk_level, alert_status
      ORDER BY risk_level, alert_status
    `);
    return result.rows;
  }

  /**
   * 分析消息并创建预警（被 chat gateway 调用）
   */
  async analyzeAndAlert(userId: string, text: string, sessionId?: string) {
    try {
      const crisisResult = await aiClient.detectCrisis({
        user_id: userId,
        text,
        session_id: sessionId,
      });

      if (crisisResult.is_crisis) {
        const alert = await this.createAlert({
          userId,
          sessionId: sessionId || '',
          riskLevel: crisisResult.risk_level,
          sentimentScore: crisisResult.combined_score,
          triggerText: text,
        });
        return { alert, crisisResult };
      }

      return { alert: null, crisisResult };
    } catch (error: any) {
      logger.error('危机分析失败', { error: error.message });
      return { alert: null, crisisResult: null };
    }
  }
}

export const crisisService = new CrisisService();
