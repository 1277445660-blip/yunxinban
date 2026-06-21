"""
云心伴 - FastAPI 依赖注入
管理全局服务单例
"""
from functools import lru_cache
from typing import Optional

from ..core.config import settings
from ..models.llm_provider import LLMProvider
from ..models.provider_factory import ProviderFactory
from ..services.safety_filter import SafetyFilter
from ..services.sentiment import SentimentAnalyzer
from ..services.memory_pool import SessionMemoryPool
from ..services.crisis_detector import CrisisIntentionDetector
from ..services.companion import AICompanion
from ..utils.text_processing import TextProcessor

# ---------- 全局单例（懒加载） ----------

_llm_provider: Optional[LLMProvider] = None
_safety_filter: Optional[SafetyFilter] = None
_sentiment_analyzer: Optional[SentimentAnalyzer] = None
_memory_pool: Optional[SessionMemoryPool] = None
_crisis_detector: Optional[CrisisIntentionDetector] = None
_companion: Optional[AICompanion] = None
_text_processor: Optional[TextProcessor] = None


def get_text_processor() -> TextProcessor:
    """获取文本处理器单例"""
    global _text_processor
    if _text_processor is None:
        _text_processor = TextProcessor()
    return _text_processor


def get_llm_provider() -> LLMProvider:
    """获取 LLM Provider 单例"""
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = ProviderFactory.create(
            provider_name=settings.llm_provider,
            model=settings.tongyi_model if settings.llm_provider == "tongyi" else settings.glm_model,
            api_key=settings.tongyi_api_key,
            base_url=settings.tongyi_base_url if settings.llm_provider == "tongyi" else None,
            api_url=settings.glm_api_url if settings.llm_provider == "glm" else None,
            max_tokens=settings.llm_max_tokens,
            temperature=settings.llm_temperature,
            top_p=settings.llm_top_p,
            timeout=settings.llm_timeout,
        )
    return _llm_provider


def get_safety_filter() -> SafetyFilter:
    """获取安全过滤器单例"""
    global _safety_filter
    if _safety_filter is None:
        _safety_filter = SafetyFilter(text_processor=get_text_processor())
    return _safety_filter


def get_sentiment_analyzer() -> SentimentAnalyzer:
    """获取情感分析器单例"""
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer(
            text_processor=get_text_processor(),
            use_api=settings.sentiment_use_api,
            llm_provider=get_llm_provider() if settings.sentiment_use_api else None,
        )
    return _sentiment_analyzer


def get_memory_pool() -> SessionMemoryPool:
    """获取记忆池单例"""
    global _memory_pool
    if _memory_pool is None:
        _memory_pool = SessionMemoryPool(
            short_term_rounds=settings.memory_short_term_rounds,
        )
    return _memory_pool


def get_crisis_detector() -> CrisisIntentionDetector:
    """获取危机检测器单例"""
    global _crisis_detector
    if _crisis_detector is None:
        _crisis_detector = CrisisIntentionDetector(
            safety_filter=get_safety_filter(),
            sentiment_analyzer=get_sentiment_analyzer(),
        )
    return _crisis_detector


def get_companion() -> AICompanion:
    """获取 AICompanion 单例"""
    global _companion
    if _companion is None:
        _companion = AICompanion(
            llm_provider=get_llm_provider(),
            safety_filter=get_safety_filter(),
            sentiment_analyzer=get_sentiment_analyzer(),
            memory_pool=get_memory_pool(),
            crisis_detector=get_crisis_detector(),
        )
    return _companion
