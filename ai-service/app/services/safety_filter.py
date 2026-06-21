"""
云心伴 - 安全过滤器
负责危机意图检测、内容安全审核
"""
import re
from typing import List, Tuple, Optional
from loguru import logger

from ..core.security import (
    CrisisDetectionResult,
    RiskLevel,
    AlertType,
    RISK_THRESHOLDS,
)
from ..utils.text_processing import TextProcessor


class SafetyFilter:
    """
    安全过滤器：规则引擎 + 情感分析
    提供多层级的安全检查，确保 AI 回复安全可控
    """

    # 危机关键词库（规则匹配）
    SELF_HARM_KEYWORDS: List[str] = [
        "想死", "不想活", "结束生命", "自杀", "自残", "割腕",
        "跳楼", "上吊", "服毒", "吃安眠药", "解脱", "一了百了",
        "活不下去", "没有活着的意义", "死了算了", "想结束一切",
        "怎么死", "哪种方式不痛苦", "农药", "烧炭",
    ]

    HARM_OTHERS_KEYWORDS: List[str] = [
        "杀人", "报复社会", "砍死", "炸掉", "同归于尽",
        "我要让他付出代价", "弄死他",
    ]

    SEVERE_DEPRESSION_KEYWORDS: List[str] = [
        "重度抑郁", "抑郁发作", "完全不想动", "床都起不来",
        "对一切都失去兴趣", "行尸走肉", "生不如死",
    ]

    # 危机句式模式（正则）
    CRISIS_PATTERNS: List[Tuple[re.Pattern, float]] = [
        (re.compile(r"我.*(想死|不想活了|活不下去)"), 0.9),
        (re.compile(r"(怎么|如何|哪种).*(死|自杀|结束生命)"), 0.85),
        (re.compile(r"(已经|刚刚|刚才).*(吃|吞|喝).*(药|安眠药)"), 0.95),
        (re.compile(r"永别[了啦]"), 0.85),
        (re.compile(r"(没有人|没人).*(在乎|关心|需要).*我"), 0.55),
        (re.compile(r"我.*(消失|离开).*(世界|这里)"), 0.65),
        (re.compile(r"(活着|活下去).*(没意义|没意思|好累)"), 0.6),
        (re.compile(r"再见了.*(世界|大家|所有人)"), 0.8),
    ]

    def __init__(self, text_processor: Optional[TextProcessor] = None):
        self.text_processor = text_processor or TextProcessor()

    def detect_crisis(
        self,
        text: str,
        sentiment_score: float = 0.0,
    ) -> CrisisDetectionResult:
        """
        检测危机意图

        Args:
            text: 用户输入文本
            sentiment_score: 外部情感分析分数（0-1, 0=极度负面, 1=极度正面）

        Returns:
            CrisisDetectionResult: 检测结果
        """
        # 步骤 1: 规则引擎快速匹配
        rule_score, alert_type, trigger_phrases = self._rule_based_scan(text)

        # 步骤 2: 综合判定
        # 规则分数权重 0.6，情感分数权重 0.4（转换为危机倾向：1 - sentiment_score）
        sentiment_crisis_score = 1.0 - sentiment_score if sentiment_score > 0 else 0.0
        combined_score = 0.6 * rule_score + 0.4 * sentiment_crisis_score

        # 规则匹配到严重关键词时，提升权重
        if rule_score > 0.8:
            combined_score = max(combined_score, rule_score)

        # 步骤 3: 风险分级
        level = self._classify_risk(combined_score)

        is_crisis = combined_score >= RISK_THRESHOLDS[RiskLevel.MODERATE]

        return CrisisDetectionResult(
            is_crisis=is_crisis,
            score=round(combined_score, 4),
            level=level,
            alert_type=alert_type,
            trigger_phrases=trigger_phrases,
            rule_score=round(rule_score, 4),
            sentiment_score=round(sentiment_score, 4),
        )

    def _rule_based_scan(self, text: str) -> Tuple[float, AlertType, List[str]]:
        """
        基于规则的关键词+模式扫描

        Returns:
            (score, alert_type, trigger_phrases)
        """
        score = 0.0
        alert_type = AlertType.OTHER
        trigger_phrases: List[str] = []
        cleaned_text = self.text_processor.clean(text)

        # 1. 检查自伤/自杀关键词
        for keyword in self.SELF_HARM_KEYWORDS:
            if keyword in cleaned_text:
                trigger_phrases.append(keyword)
                score = max(score, 0.85)
                alert_type = AlertType.SELF_HARM if "伤" in keyword or "残" in keyword else AlertType.SUICIDE

        # 2. 检查伤害他人关键词
        for keyword in self.HARM_OTHERS_KEYWORDS:
            if keyword in cleaned_text:
                trigger_phrases.append(keyword)
                score = max(score, 0.9)
                alert_type = AlertType.HARM_OTHERS

        # 3. 检查严重抑郁关键词
        for keyword in self.SEVERE_DEPRESSION_KEYWORDS:
            if keyword in cleaned_text:
                trigger_phrases.append(keyword)
                score = max(score, 0.55)
                if alert_type == AlertType.OTHER:
                    alert_type = AlertType.SEVERE_DEPRESSION

        # 4. 正则模式匹配
        for pattern, pattern_score in self.CRISIS_PATTERNS:
            match = pattern.search(cleaned_text)
            if match:
                matched_text = match.group(0)
                trigger_phrases.append(matched_text)
                score = max(score, pattern_score)
                if alert_type == AlertType.OTHER and pattern_score > 0.7:
                    alert_type = AlertType.SUICIDE

        return min(score, 1.0), alert_type, list(set(trigger_phrases))

    @staticmethod
    def _classify_risk(score: float) -> RiskLevel:
        """根据分数映射风险等级"""
        if score >= RISK_THRESHOLDS[RiskLevel.CRITICAL]:
            return RiskLevel.CRITICAL
        elif score >= RISK_THRESHOLDS[RiskLevel.HIGH]:
            return RiskLevel.HIGH
        elif score >= RISK_THRESHOLDS[RiskLevel.MODERATE]:
            return RiskLevel.MODERATE
        elif score >= RISK_THRESHOLDS[RiskLevel.MILD]:
            return RiskLevel.MILD
        else:
            return RiskLevel.LOW

    def get_crisis_response(self, level: RiskLevel, alert_type: AlertType) -> str:
        """根据危机等级生成对应的回复模板"""
        if level == RiskLevel.CRITICAL:
            return (
                "我听到你说的了，我能感受到你现在非常痛苦。💙\n\n"
                "请记住，你不需要一个人面对这些。现在请你做一件事：\n"
                f"拨打心理援助热线 **{self._get_hotline()}**\n\n"
                "电话那头是受过专业培训的咨询师，他们会倾听你、帮助你。\n"
                "你的生命非常珍贵，这个世界上有人在乎你。"
            )

        elif level == RiskLevel.HIGH:
            return (
                "我能感受到你现在很不容易，心里压着很重的东西。🫂\n\n"
                "这些事情不需要你一个人扛着。学校的心理咨询中心有专业的老师可以帮助你，"
                "如果你愿意的话，我可以帮你了解预约方式。\n\n"
                "你愿意和我多聊聊现在的感受吗？"
            )

        elif level == RiskLevel.MODERATE:
            return (
                "听起来你最近的感受确实挺沉重的。🌧️\n\n"
                "有时候情绪低落是很正常的，但如果这种状态持续太久，"
                "可能需要一些专业的帮助。我这边有一些关于情绪调节的资源，"
                "你想看看吗？"
            )

        else:
            return ""

    @staticmethod
    def _get_hotline() -> str:
        """获取紧急热线"""
        return "400-161-9995"
