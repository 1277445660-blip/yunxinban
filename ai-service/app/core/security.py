"""
云心伴 - 安全常量与风险等级定义
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional


class RiskLevel(str, Enum):
    """风险等级"""
    LOW = "low"            # 🟢 低风险：正常
    MILD = "mild"          # 🟡 轻度：情绪困扰
    MODERATE = "moderate"  # 🟠 中度：需要关注
    HIGH = "high"          # 🔴 高危：需要干预
    CRITICAL = "critical"  # ⚫ 极危：立即行动


class AlertStatus(str, Enum):
    """预警状态"""
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    ESCALATED = "escalated"
    RESOLVED = "resolved"


class AlertType(str, Enum):
    """预警类型"""
    SELF_HARM = "self_harm"       # 自伤意图
    SUICIDE = "suicide"           # 自杀意图
    HARM_OTHERS = "harm_others"   # 伤害他人意图
    SEVERE_DEPRESSION = "severe_depression"
    PANIC_ATTACK = "panic_attack"
    OTHER = "other"


@dataclass
class CrisisDetectionResult:
    """危机检测结果"""
    is_crisis: bool
    score: float
    level: RiskLevel
    alert_type: AlertType = AlertType.OTHER
    trigger_phrases: List[str] = field(default_factory=list)
    rule_score: float = 0.0
    sentiment_score: float = 0.0


# 风险等级 → 阈值映射
RISK_THRESHOLDS = {
    RiskLevel.LOW: 0.0,
    RiskLevel.MILD: 0.3,
    RiskLevel.MODERATE: 0.5,
    RiskLevel.HIGH: 0.75,
    RiskLevel.CRITICAL: 0.9,
}

# 风险等级 → 响应动作
RISK_RESPONSE_MAP = {
    RiskLevel.LOW: {
        "action": "normal_chat",
        "description": "正常聊天，记录情绪轨迹",
        "notify": [],
    },
    RiskLevel.MILD: {
        "action": "push_resources",
        "description": "推送科普文章、自助资源",
        "notify": [],
    },
    RiskLevel.MODERATE: {
        "action": "notify_counselor",
        "description": "通知辅导员关注、建议预约咨询",
        "notify": ["counselor"],
    },
    RiskLevel.HIGH: {
        "action": "alert_center",
        "description": "立即通知心理中心、触发干预工单",
        "notify": ["counselor", "psychology_center"],
    },
    RiskLevel.CRITICAL: {
        "action": "emergency_protocol",
        "description": "启动紧急协议、直拨心理热线",
        "notify": ["counselor", "psychology_center", "emergency_contact"],
    },
}

# 数据分级加密配置
ENCRYPTION_LEVELS = {
    "L3": {  # 身份信息
        "algorithm": "AES-256-GCM",
        "key_source": "KMS",
        "access": "双重授权",
        "fields": ["student_id", "phone", "real_name"],
    },
    "L2": {  # 聊天/测评
        "algorithm": "AES-256-GCM",
        "key_source": "APP_KEY",
        "access": "角色授权",
        "fields": ["chat_content", "assessment_results"],
    },
    "L1": {  # 标签数据
        "algorithm": "DB_LEVEL",
        "key_source": "DB_KEY",
        "access": "登录可见",
        "fields": ["grade", "college", "risk_level"],
    },
    "L0": {  # 公开内容
        "algorithm": "NONE",
        "key_source": "NONE",
        "access": "公开",
        "fields": ["articles", "announcements"],
    },
}
