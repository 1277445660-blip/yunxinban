"""
云心伴 - 危机预警引擎
整合规则引擎 + NLP 情感分析，提供多级预警和响应建议
"""
import hashlib
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from loguru import logger

from ..core.security import (
    CrisisDetectionResult,
    RiskLevel,
    AlertType,
    AlertStatus,
    RISK_THRESHOLDS,
    RISK_RESPONSE_MAP,
)
from .safety_filter import SafetyFilter
from .sentiment import SentimentAnalyzer, SentimentResult


@dataclass
class CrisisAlert:
    """危机预警记录"""
    id: str  # 预警 ID
    user_id: str
    session_id: str
    risk_level: RiskLevel
    alert_type: AlertType
    sentiment_score: float
    combined_score: float
    trigger_text_hash: str  # 触发文本哈希（脱敏）
    trigger_phrases: List[str]
    alert_status: AlertStatus = AlertStatus.PENDING
    assigned_counselor_id: Optional[str] = None
    response_actions: List[str] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    resolved_at: Optional[float] = None


class CrisisIntentionDetector:
    """
    危机预警引擎

    功能：
    1. 多层级危机检测（规则 + NLP）
    2. 风险分级（5 级）
    3. 预警冷却（避免重复告警）
    4. 分级响应建议
    """

    def __init__(
        self,
        safety_filter: SafetyFilter,
        sentiment_analyzer: SentimentAnalyzer,
        cooldown_seconds: int = 300,  # 同一用户预警冷却时间
    ):
        self.safety_filter = safety_filter
        self.sentiment = sentiment_analyzer
        self.cooldown = cooldown_seconds

        # 预警冷却缓存: user_id → 最后一次预警时间
        self._cooldown_cache: Dict[str, float] = {}

        # 预警历史（生产环境应持久化到数据库）
        self._alert_history: Dict[str, List[CrisisAlert]] = {}

    async def analyze(
        self,
        user_id: str,
        text: str,
        session_id: str,
    ) -> Dict[str, Any]:
        """
        综合分析用户消息，返回预警结果

        Returns:
            {
                "is_crisis": bool,
                "alert": CrisisAlert | None,
                "response_action": str,
                "response_message": str | None,
                "sentiment": SentimentResult,
            }
        """
        # 步骤 1: 情感分析
        sentiment_result = await self.sentiment.analyze(text)

        # 步骤 2: 危机检测
        detection = self.safety_filter.detect_crisis(
            text=text,
            sentiment_score=sentiment_result.score,
        )

        # 步骤 3: 判断是否需要触发预警
        if not detection.is_crisis:
            return {
                "is_crisis": False,
                "alert": None,
                "response_action": "normal_chat",
                "response_message": None,
                "sentiment": sentiment_result,
            }

        # 步骤 4: 检查冷却时间
        if self._is_in_cooldown(user_id):
            logger.info(f"用户 {user_id} 在预警冷却期内，跳过重复预警")
            return {
                "is_crisis": True,
                "alert": None,  # 冷却期内不生成新预警
                "response_action": "cooldown_silent",
                "response_message": self.safety_filter.get_crisis_response(
                    detection.level, detection.alert_type
                ),
                "sentiment": sentiment_result,
            }

        # 步骤 5: 生成预警
        trigger_hash = hashlib.sha256(text.encode()).hexdigest()[:16]

        alert = CrisisAlert(
            id=self._generate_alert_id(user_id),
            user_id=user_id,
            session_id=session_id,
            risk_level=detection.level,
            alert_type=detection.alert_type,
            sentiment_score=detection.sentiment_score,
            combined_score=detection.score,
            trigger_text_hash=trigger_hash,
            trigger_phrases=detection.trigger_phrases,
            response_actions=RISK_RESPONSE_MAP[detection.level]["notify"].copy(),
        )

        # 步骤 6: 记录预警
        self._record_alert(user_id, alert)

        # 步骤 7: 获取危机回复
        crisis_response = self.safety_filter.get_crisis_response(
            detection.level, detection.alert_type
        )

        return {
            "is_crisis": True,
            "alert": alert,
            "response_action": RISK_RESPONSE_MAP[detection.level]["action"],
            "response_message": crisis_response,
            "sentiment": sentiment_result,
        }

    def _is_in_cooldown(self, user_id: str) -> bool:
        """检查是否在预警冷却期"""
        if user_id not in self._cooldown_cache:
            return False
        elapsed = time.time() - self._cooldown_cache[user_id]
        return elapsed < self.cooldown

    def _record_alert(self, user_id: str, alert: CrisisAlert):
        """记录预警"""
        self._cooldown_cache[user_id] = time.time()

        if user_id not in self._alert_history:
            self._alert_history[user_id] = []
        self._alert_history[user_id].append(alert)

    def get_user_alert_history(
        self,
        user_id: str,
        limit: int = 20,
    ) -> List[CrisisAlert]:
        """获取用户预警历史"""
        alerts = self._alert_history.get(user_id, [])
        return sorted(alerts, key=lambda a: a.created_at, reverse=True)[:limit]

    def get_alert_stats(self) -> Dict[str, int]:
        """获取预警统计"""
        stats = {level.value: 0 for level in RiskLevel}
        for alerts in self._alert_history.values():
            for alert in alerts:
                if alert.risk_level.value in stats:
                    stats[alert.risk_level.value] += 1
        return stats

    @staticmethod
    def _generate_alert_id(user_id: str) -> str:
        """生成预警 ID"""
        raw = f"{user_id}:{time.time()}:{hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
