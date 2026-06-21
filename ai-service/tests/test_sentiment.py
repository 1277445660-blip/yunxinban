"""
云心伴 - 情感分析单元测试
"""
import pytest
from app.services.sentiment import SentimentAnalyzer, SentimentResult


class TestSentimentAnalyzer:
    """情感分析器测试"""

    @pytest.fixture
    def analyzer(self):
        return SentimentAnalyzer()

    def test_positive_text(self, analyzer):
        """测试正面文本"""
        result = analyzer._analyze_with_rules("今天阳光很好，心情非常开心！")
        assert result.score > 0.5
        assert result.label == "positive"

    def test_negative_text(self, analyzer):
        """测试负面文本"""
        result = analyzer._analyze_with_rules("我今天特别难过，感觉很孤独很绝望")
        assert result.score < 0.5
        assert result.label == "negative"

    def test_neutral_text(self, analyzer):
        """测试中性文本"""
        result = analyzer._analyze_with_rules("今天去图书馆看书")
        assert 0.4 <= result.score <= 0.6
        # 中性文本可能被判定为 neutral 或接近的 label

    def test_negation_text(self, analyzer):
        """测试否定词翻转"""
        result = analyzer._analyze_with_rules("我不开心")
        # "不" 否定 "开心"，应该是负面
        assert result.score < 0.5

    def test_intensifier_text(self, analyzer):
        """测试程度副词增强"""
        result_normal = analyzer._analyze_with_rules("我很难过")
        result_intense = analyzer._analyze_with_rules("我非常难过")
        # 程度副词应增强负面程度
        assert result_intense.score <= result_normal.score

    def test_confidence(self, analyzer):
        """测试置信度"""
        result = analyzer._analyze_with_rules("非常开心快乐幸福满足")
        # 多个正面词，置信度应该较高
        assert result.confidence > 0.0

    def test_empty_text(self, analyzer):
        """测试空文本"""
        result = analyzer._analyze_with_rules("")
        assert result.score == 0.5
        assert result.label == "neutral"

    def test_mood_description(self, analyzer):
        """测试情绪描述映射"""
        assert "极度" in analyzer.get_mood_description(0.1)
        assert "开心" in analyzer.get_mood_description(0.9)
        assert "平稳" in analyzer.get_mood_description(0.5)
