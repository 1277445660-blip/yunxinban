-- ============================================
-- 云心伴 - PostgreSQL 数据库初始化脚本
-- 在容器首次启动时自动执行
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id_hash VARCHAR(64) NOT NULL UNIQUE,   -- 学号 SHA-256 哈希
    role VARCHAR(20) NOT NULL DEFAULT 'student',    -- student | counselor | admin
    nickname VARCHAR(100),
    grade VARCHAR(20),                               -- 年级
    college VARCHAR(100),                            -- 学院
    major VARCHAR(100),                              -- 专业
    risk_level VARCHAR(20) DEFAULT 'low',            -- low | medium | high | critical
    privacy_consent BOOLEAN DEFAULT false,           -- 隐私协议同意
    privacy_consent_at TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active',     -- active | disabled | deleted
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_student_hash ON users(student_id_hash);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_risk_level ON users(risk_level);
CREATE INDEX idx_users_account_status ON users(account_status);

-- ============================================
-- 聊天会话表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'companion',    -- companion | crisis | assessment
    title VARCHAR(200),                              -- 会话标题（可由首条消息自动生成）
    mood_score_start FLOAT,                          -- 会话开始情绪评分
    mood_score_end FLOAT,                            -- 会话结束情绪评分
    message_count INT DEFAULT 0,                     -- 消息计数
    status VARCHAR(20) DEFAULT 'active',             -- active | closed | escalated
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_started ON chat_sessions(started_at DESC);

-- ============================================
-- 危机预警表
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    risk_level VARCHAR(20) NOT NULL,                 -- yellow | orange | red
    sentiment_score FLOAT NOT NULL,                  -- 情感极性分数 0-1
    trigger_text_hash VARCHAR(64),                   -- 触发文本 SHA-256 哈希（脱敏）
    trigger_keywords TEXT[],                         -- 触发的关键词
    alert_status VARCHAR(30) DEFAULT 'pending',      -- pending | acknowledged | escalated | resolved
    assigned_counselor_id UUID REFERENCES users(id),
    resolution_note TEXT,                            -- 处理备注
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crisis_alerts_user ON crisis_alerts(user_id);
CREATE INDEX idx_crisis_alerts_risk ON crisis_alerts(risk_level);
CREATE INDEX idx_crisis_alerts_status ON crisis_alerts(alert_status);
CREATE INDEX idx_crisis_alerts_created ON crisis_alerts(created_at DESC);
CREATE INDEX idx_crisis_alerts_counselor ON crisis_alerts(assigned_counselor_id);

-- ============================================
-- 咨询师分配表
-- ============================================
CREATE TABLE IF NOT EXISTS counselor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_type VARCHAR(30) DEFAULT 'monitoring', -- monitoring | intervention | followup
    status VARCHAR(20) DEFAULT 'active',              -- active | completed | cancelled
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT NOW(),
    end_at TIMESTAMP
);

CREATE INDEX idx_assignments_counselor ON counselor_assignments(counselor_id);
CREATE INDEX idx_assignments_user ON counselor_assignments(user_id);
CREATE INDEX idx_assignments_status ON counselor_assignments(status);

-- ============================================
-- 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,                    -- 操作类型
    resource_type VARCHAR(50),                       -- 资源类型
    resource_id UUID,                                -- 资源 ID
    ip_address INET,                                 -- 操作 IP
    user_agent TEXT,                                 -- 客户端 UA
    details JSONB,                                   -- 操作详情（JSON）
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 通知记录表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                       -- crisis_alert | appointment | system
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始数据：系统管理员账号
-- 密码在生产环境需要修改
-- ============================================
-- INSERT INTO users (student_id_hash, role, nickname, privacy_consent, privacy_consent_at)
-- VALUES (
--     encode(sha256('admin@yunxinban.com'::bytea), 'hex'),
--     'admin',
--     '系统管理员',
--     true,
--     NOW()
-- );
