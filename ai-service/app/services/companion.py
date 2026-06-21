"""
云心伴 - AICompanion 核心服务
整合 LLM、安全过滤、记忆池、情感分析，提供完整的心理陪伴对话能力
"""
import time
from typing import AsyncIterator, Dict, Any, Optional, List
from dataclasses import dataclass
from loguru import logger

from ..models.llm_provider import LLMProvider, ChatMessage, ChatCompletionChunk
from ..core.config import settings
from ..core.security import RiskLevel
from .safety_filter import SafetyFilter
from .sentiment import SentimentAnalyzer, SentimentResult
from .memory_pool import SessionMemoryPool, SessionContext
from .crisis_detector import CrisisIntentionDetector


@dataclass
class CompanionResponse:
    """AICompanion 完整响应"""
    content: str
    sentiment: Optional[SentimentResult] = None
    mood_update: Optional[Dict[str, Any]] = None
    crisis_alert: Optional[Dict[str, Any]] = None
    is_crisis: bool = False
    response_time_ms: float = 0.0


class AICompanion:
    """
    AI 心理陪伴核心引擎

    工作流程：
    1. 接收用户消息
    2. 情感分析（并行）
    3. 危机检测（基于情感结果）
    4. 如果是危机 → 返回危机响应
    5. 否则 → 加载记忆 → LLM 生成共情回复 → 更新记忆
    """

    def __init__(
        self,
        llm_provider: LLMProvider,
        safety_filter: SafetyFilter,
        sentiment_analyzer: SentimentAnalyzer,
        memory_pool: SessionMemoryPool,
        crisis_detector: CrisisIntentionDetector,
    ):
        self.llm = llm_provider
        self.safety = safety_filter
        self.sentiment = sentiment_analyzer
        self.memory = memory_pool
        self.crisis = crisis_detector

        self.system_prompt = settings.companion_system_prompt

    async def chat(
        self,
        user_id: str,
        message: str,
        session_id: str,
        stream: bool = True,
    ) -> AsyncIterator[CompanionResponse]:
        """
        主对话接口（流式）

        Args:
            user_id: 用户 ID
            message: 用户消息
            session_id: 会话 ID
            stream: 是否流式返回

        Yields:
            CompanionResponse: 每次 yield 一个 chunk（流式）或完整响应
        """
        start_time = time.time()
        full_response = ""

        # ---------- 步骤 1: 并行执行情感分析 + 危机检测 ----------
        sentiment_result = await self.sentiment.analyze(message)

        crisis_result = await self.crisis.analyze(
            user_id=user_id,
            text=message,
            session_id=session_id,
        )

        # ---------- 步骤 2: 如果是危机，返回危机响应 ----------
        if crisis_result["is_crisis"] and crisis_result["response_message"]:
            crisis_msg = crisis_result["response_message"]

            if stream:
                # 流式输出危机响应
                for i in range(0, len(crisis_msg), 10):
                    chunk = crisis_msg[i:i + 10]
                    full_response += chunk
                    yield CompanionResponse(
                        content=chunk,
                        sentiment=sentiment_result,
                        crisis_alert=crisis_result.get("alert"),
                        is_crisis=True,
                        response_time_ms=(time.time() - start_time) * 1000,
                    )
                    import asyncio
                    await asyncio.sleep(0.02)  # 模拟流式输出
            else:
                full_response = crisis_msg
                yield CompanionResponse(
                    content=crisis_msg,
                    sentiment=sentiment_result,
                    crisis_alert=crisis_result.get("alert"),
                    is_crisis=True,
                    response_time_ms=(time.time() - start_time) * 1000,
                )

            # 更新记忆池
            import asyncio
            asyncio.create_task(
                self.memory.update(
                    user_id=user_id,
                    session_id=session_id,
                    user_message=message,
                    assistant_message=full_response,
                    sentiment_score=sentiment_result.score,
                )
            )
            return

        # ---------- 步骤 3: 加载上下文记忆 ----------
        context = await self.memory.get_context(user_id, session_id)

        # 构建对话历史
        recent_messages = self.memory.get_recent_messages(context, n=8)
        llm_messages = [ChatMessage(role=m["role"], content=m["content"]) for m in recent_messages]
        llm_messages.append(ChatMessage(role="user", content=message))

        # 获取情绪摘要（用于增强 system prompt）
        mood_summary = self.memory.get_mood_summary(context)

        # 增强 system prompt（注入情绪上下文）
        enhanced_prompt = self._build_enhanced_prompt(mood_summary, sentiment_result)

        # ---------- 步骤 4: LLM 生成回复 ----------
        try:
            if stream:
                async for chunk in self.llm.chat(
                    messages=llm_messages,
                    system_prompt=enhanced_prompt,
                    stream=True,
                ):
                    full_response += chunk.content
                    yield CompanionResponse(
                        content=chunk.content,
                        sentiment=sentiment_result,
                        mood_update={
                            "score": sentiment_result.score,
                            "trend": mood_summary.get("trend", "stable"),
                        },
                        is_crisis=False,
                        response_time_ms=(time.time() - start_time) * 1000,
                    )
            else:
                response_text = await self.llm.chat_complete(
                    messages=llm_messages,
                    system_prompt=enhanced_prompt,
                )
                full_response = response_text
                yield CompanionResponse(
                    content=response_text,
                    sentiment=sentiment_result,
                    mood_update={
                        "score": sentiment_result.score,
                        "trend": mood_summary.get("trend", "stable"),
                    },
                    is_crisis=False,
                    response_time_ms=(time.time() - start_time) * 1000,
                )

        except Exception as e:
            logger.error(f"LLM 调用失败: {e}")
            error_msg = "抱歉，我暂时无法回复。请稍等片刻再试试，或者你可以拨打心理援助热线 400-161-9995 🌱"
            yield CompanionResponse(
                content=error_msg,
                sentiment=sentiment_result,
                is_crisis=False,
                response_time_ms=(time.time() - start_time) * 1000,
            )
            return

        # ---------- 步骤 5: 异步更新记忆池 ----------
        import asyncio
        asyncio.create_task(
            self.memory.update(
                user_id=user_id,
                session_id=session_id,
                user_message=message,
                assistant_message=full_response,
                sentiment_score=sentiment_result.score,
            )
        )

    async def chat_non_stream(
        self,
        user_id: str,
        message: str,
        session_id: str,
    ) -> CompanionResponse:
        """非流式对话（收集完整响应后返回）"""
        full_content = ""
        last_response = None

        async for response in self.chat(
            user_id=user_id,
            message=message,
            session_id=session_id,
            stream=False,
        ):
            full_content += response.content
            last_response = response

        if last_response:
            last_response.content = full_content
            return last_response

        return CompanionResponse(content="[无响应]")

    def _build_enhanced_prompt(
        self,
        mood_summary: Dict[str, Any],
        current_sentiment: SentimentResult,
    ) -> str:
        """根据用户情绪状态增强 system prompt"""
        prompt = self.system_prompt

        # 注入情绪上下文
        mood_desc = self.sentiment.get_mood_description(current_sentiment.score)
        prompt += f"\n\n[当前用户情绪状态]\n- 情绪评分: {mood_desc}"

        if mood_summary.get("trend") == "declining":
            prompt += "\n- 情绪趋势: 近期有下降趋势，请更加关注和支持"
        elif mood_summary.get("trend") == "improving":
            prompt += "\n- 情绪趋势: 近期有改善趋势"

        if current_sentiment.keywords:
            prompt += f"\n- 关键词: {', '.join(current_sentiment.keywords[:5])}"

        return prompt

    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        return {
            "service": "AICompanion",
            "status": "healthy",
            "llm_provider": self.llm.get_model_name(),
            "llm_available": await self.llm.health_check(),
        }
