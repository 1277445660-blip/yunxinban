"""
云心伴 - 危机检测单元测试
"""
import pytest
from app.services.safety_filter import SafetyFilter
from app.core.security import RiskLevel, AlertType, CrisisDetectionResult


class TestCrisisDetector:
    """危机检测器测试"""

    @pytest.fixture
    def safety(self):
        return SafetyFilter()

    def test_self_harm_detection(self, safety):
        """测试自伤意图检测"""
        result = safety.detect_crisis("我想割腕")
        assert result.is_crisis
        assert result.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        assert result.alert_type in [AlertType.SELF_HARM, AlertType.SUICIDE]

    def test_suicide_detection(self, safety):
        """测试自杀意图检测"""
        result = safety.detect_crisis("我不想活了，活着好累")
        assert result.is_crisis
        assert result.score >= 0.6
        assert len(result.trigger_phrases) > 0

    def test_severe_depression(self, safety):
        """测试严重抑郁关键词"""
        result = safety.detect_crisis("我感觉自己对一切都失去兴趣了")
        # "对一切都失去兴趣" 匹配严重抑郁关键词
        assert result.is_crisis

    def test_harm_others(self, safety):
        """测试伤害他人意图"""
        result = safety.detect_crisis("我恨他们，我要报复社会")
        assert result.is_crisis
        assert result.alert_type == AlertType.HARM_OTHERS

    def test_normal_text(self, safety):
        """测试正常文本"""
        result = safety.detect_crisis("今天天气真好，适合出去散步")
        assert not result.is_crisis
        assert result.level == RiskLevel.LOW

    def test_ambiguous_text(self, safety):
        """测试模糊文本"""
        result = safety.detect_crisis("今天有点累，不太想动")
        # 可能轻度匹配，但不应是高危
        assert result.level.value != RiskLevel.CRITICAL.value

    def test_pattern_matching(self, safety):
        """测试正则模式匹配"""
        result = safety.detect_crisis("我活着真的没意义了")
        assert result.is_crisis
        # 检查 trigger_phrases 包含匹配的文本
        assert any("意义" in p for p in result.trigger_phrases) or result.score > 0.3

    def test_crisis_response_critical(self, safety):
        """测试极危响应消息"""
        response = safety.get_crisis_response(RiskLevel.CRITICAL, AlertType.SUICIDE)
        assert "400-161-9995" in response
        assert "心理援助热线" in response

    def test_crisis_response_high(self, safety):
        """测试高危响应消息"""
        response = safety.get_crisis_response(RiskLevel.HIGH, AlertType.SELF_HARM)
        assert len(response) > 0
        assert "心理咨询" in response

    def test_crisis_response_moderate(self, safety):
        """测试中度响应消息"""
        response = safety.get_crisis_response(RiskLevel.MODERATE, AlertType.SEVERE_DEPRESSION)
        assert len(response) > 0

    def test_combined_sentiment_score(self, safety):
        """测试情感分数对检测的影响"""
        # 负面情感应增强危机分数
        result_negative = safety.detect_crisis("我很难过", sentiment_score=0.1)
        result_positive = safety.detect_crisis("我很难过", sentiment_score=0.8)
        assert result_negative.score >= result_positive.score
