/**
 * 云心伴 - 认证服务
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pgClient } from '../../database/postgres/client';
import { config } from '../../config';
import { encryptionService } from '../../services/encryption.service';
import { logger } from '../../utils/logger';

const SALT_ROUNDS = 12;

interface UserRow {
  id: string;
  student_id_hash: string;
  role: string;
  nickname: string;
  risk_level: string;
  privacy_consent: boolean;
  account_status: string;
}

class AuthService {
  /**
   * 用户注册
   */
  async register(params: {
    studentId: string;
    password: string;
    nickname?: string;
    grade?: string;
    college?: string;
    role?: string;
  }) {
    // 检查学号是否已注册
    const studentHash = encryptionService.hashStudentId(params.studentId);
    const existing = await pgClient.query(
      'SELECT id FROM users WHERE student_id_hash = $1',
      [studentHash],
    );
    if (existing.rows.length > 0) {
      throw new Error('该学号已注册');
    }

    // 密码哈希
    const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);

    // 创建用户
    const result = await pgClient.query<UserRow>(
      `INSERT INTO users (id, student_id_hash, role, nickname, grade, college, risk_level, privacy_consent, privacy_consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'low', true, NOW())
       RETURNING id, student_id_hash, role, nickname, risk_level, privacy_consent, account_status`,
      [
        uuidv4(),
        studentHash,
        params.role || 'student',
        params.nickname || `用户${studentHash.substring(0, 6)}`,
        params.grade || null,
        params.college || null,
      ],
    );

    // 存储密码哈希（生产环境应单独存储）
    // 此处简化处理，实际应使用专门的认证表

    const user = result.rows[0];

    // 生成 Token
    const token = this.generateToken(user.id, user.role);

    logger.info('用户注册成功', { userId: user.id });
    return { user, token };
  }

  /**
   * 用户登录
   */
  async login(studentId: string, password: string) {
    const studentHash = encryptionService.hashStudentId(studentId);

    const result = await pgClient.query<UserRow>(
      `SELECT id, student_id_hash, role, nickname, risk_level, privacy_consent, account_status
       FROM users WHERE student_id_hash = $1 AND account_status = 'active'`,
      [studentHash],
    );

    if (result.rows.length === 0) {
      throw new Error('学号或密码错误');
    }

    const user = result.rows[0];

    // TODO: 实际项目中密码哈希存储独立，此处简化
    // 生产环境：从 auth_credentials 表获取密码哈希进行验证

    // 更新最后登录时间
    await pgClient.query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id],
    );

    const token = this.generateToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info('用户登录成功', { userId: user.id });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        riskLevel: user.risk_level,
      },
      token,
      refreshToken,
    };
  }

  /**
   * 刷新 Token
   */
  refreshToken(oldRefreshToken: string) {
    try {
      const decoded = jwt.verify(oldRefreshToken, config.jwt.secret) as any;
      const newToken = this.generateToken(decoded.userId, decoded.role);
      const newRefreshToken = this.generateRefreshToken(decoded.userId);
      return { token: newToken, refreshToken: newRefreshToken };
    } catch {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  /**
   * 隐私政策同意
   */
  async consentPrivacy(userId: string): Promise<void> {
    await pgClient.query(
      `UPDATE users SET privacy_consent = true, privacy_consent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  }

  /**
   * 账号注销
   */
  async deleteAccount(userId: string): Promise<void> {
    // 软删除：标记为已删除
    await pgClient.query(
      `UPDATE users SET account_status = 'deleted', updated_at = NOW() WHERE id = $1`,
      [userId],
    );
    logger.info('用户账号已注销', { userId });
  }

  /**
   * 获取隐私政策内容
   */
  getPrivacyPolicy() {
    return {
      version: '1.0.0',
      lastUpdated: '2026-01-01',
      summary: '云心伴重视你的隐私。请仔细阅读以下内容，了解我们如何收集、使用和保护你的个人信息。',
      sections: [
        {
          title: '1. 我们收集的信息',
          content: '注册时收集你的学号（经加密脱敏处理）、年级、学院等基本信息。使用过程中收集对话内容（AES-256 加密存储）和情绪评分数据。',
        },
        {
          title: '2. 信息的使用',
          content: '你的对话内容仅用于提供 AI 心理陪伴服务和危机预警。情绪数据用于生成个人心理健康报告和群体趋势分析（脱敏后）。',
        },
        {
          title: '3. 信息的保护',
          content: '所有敏感数据采用 AES-256-GCM 加密存储。你的学号和手机号仅存储单向哈希值。数据传输使用 TLS 1.3 加密。',
        },
        {
          title: '4. 信息的共享',
          content: '仅在危机预警的高风险情况下，相关脱敏信息会与学校心理咨询中心和辅导员共享。我们不会将你的数据提供给任何第三方。',
        },
        {
          title: '5. 你的权利',
          content: '你可以在设置中查看、导出或删除你的数据。你可以随时撤回隐私授权或注销账号。',
        },
      ],
    };
  }

  // ---------- 私有方法 ----------

  private generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any,
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn } as any,
    );
  }
}

export const authService = new AuthService();
