"""
云心伴 - AICompanion 单元测试
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.companion import AICompanion, CompanionResponse
from app.services.safety_filter import SafetyFilter
from app.services.sentiment import SentimentAnalyzer, SentimentResult
from app.services.memory_pool import SessionMemoryPool
from app.services.crisis_detector import CrisisIntentionDetector
from app.core.security import CrisisDetectionResult, RiskLevel, AlertType


class TestAICompanion:
    """AICompanion 核心测试"""

    @pytest.fixture
    def mock_llm(self):
        """Mock LLM Provider"""
        llm = AsyncMock()
        llm.get_model_name.return_value = "test-model"
        llm.health_check.return_value = True
        return llm

    @pytest.fixture
    def mock_safety(self):
        """Mock SafetyFilter"""
        sf = SafetyFilter()
        return sf

    @pytest.fixture
    def mock_sentiment(self):
        """Mock SentimentAnalyzer"""
        sa = SentimentAnalyzer()
        return sa

    @pytest.fixture
    def mock_memory(self):
        """Mock SessionMemoryPool"""
        return SessionMemoryPool()

    @pytest.fixture
    def mock_crisis(self):
        """Mock CrisisIntentionDetector"""
        cd = MagicMock()
        cd.analyze = AsyncMock(return_value={
            "is_crisis": False,
            "alert": None,
            "response_action": "normal_chat",
            "response_message": None,
        })
        return cd

    @pytest.fixture
    def companion(self, mock_llm, mock_safety, mock_sentiment, mock_memory, mock_crisis):
        return AICompanion(
            llm_provider=mock_llm,
            safety_filter=mock_safety,
            sentiment_analyzer=mock_sentiment,
            memory_pool=mock_memory,
            crisis_detector=mock_crisis,
        )

    @pytest.mark.asyncio
    async def test_normal_chat(self, companion, mock_llm):
        """测试正常对话"""
        from app.models.llm_provider import ChatCompletionChunk

        async def mock_chat(*args, **kwargs):
            yield ChatCompletionChunk(content="你好，我能理解你的感受。")

        mock_llm.chat = mock_chat

        responses = []
        async for resp in companion.chat(
            user_id="test_user",
            message="今天考试考砸了，有点难过",
            session_id="test_session",
        ):
            responses.append(resp)

        assert len(responses) > 0
        assert not responses[0].is_crisis
        assert responses[0].sentiment is not None

    @pytest.mark.asyncio
    async def test_crisis_chat(self, companion):
        """测试危机对话"""
        # 设置危机检测返回
        companion.crisis.analyze = AsyncMock(return_value={
            "is_crisis": True,
            "alert": MagicMock(),
            "response_action": "emergency_protocol",
            "response_message": "请拨打心理援助热线 400-161-9995",
        })

        responses = []
        async for resp in companion.chat(
            user_id="test_user",
            message="我不想活了",
            session_id="test_session",
        ):
            responses.append(resp)

        assert len(responses) > 0
        assert responses[0].is_crisis
        assert "400-161-9995" in responses[0].content

    @pytest.mark.asyncio
    async def test_chat_non_stream(self, companion, mock_llm):
        """测试非流式对话"""
        mock_llm.chat_complete = AsyncMock(return_value="你好，有什么我可以帮你的吗？")

        response = await companion.chat_non_stream(
            user_id="test_user",
            message="你好",
            session_id="test_session",
        )

        assert response.content == "你好，有什么我可以帮你的吗？"
        assert not response.is_crisis

    @pytest.mark.asyncio
    async def test_health_check(self, companion):
        """测试健康检查"""
        result = await companion.health_check()
        assert result["service"] == "AICompanion"
        assert result["status"] == "healthy"
