/**
 * 云心伴 - 用户服务
 */
import { pgClient } from '../../database/postgres/client';
import { logger } from '../../utils/logger';

class UserService {
  async getProfile(userId: string) {
    const result = await pgClient.query(
      `SELECT id, role, nickname, grade, college, risk_level, account_status, created_at
       FROM users WHERE id = $1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  async updateProfile(userId: string, data: { nickname?: string; grade?: string; college?: string }) {
    const result = await pgClient.query(
      `UPDATE users SET
         nickname = COALESCE($2, nickname),
         grade = COALESCE($3, grade),
         college = COALESCE($4, college),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, nickname, grade, college, updated_at`,
      [userId, data.nickname || null, data.grade || null, data.college || null],
    );
    return result.rows[0];
  }

  async updateRiskLevel(userId: string, riskLevel: string) {
    await pgClient.query(
      `UPDATE users SET risk_level = $2, updated_at = NOW() WHERE id = $1`,
      [userId, riskLevel],
    );
  }

  async getCounselors() {
    const result = await pgClient.query(
      `SELECT id, nickname, college FROM users WHERE role = 'counselor' AND account_status = 'active'`,
    );
    return result.rows;
  }

  async getUserStats() {
    const result = await pgClient.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'student') as students,
        COUNT(*) FILTER (WHERE role = 'counselor') as counselors,
        COUNT(*) FILTER (WHERE risk_level = 'high' OR risk_level = 'critical') as high_risk_count
      FROM users WHERE account_status = 'active'
    `);
    return result.rows[0];
  }
}

export const userService = new UserService();
