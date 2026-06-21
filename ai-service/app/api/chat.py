"""
云心伴 - 对话 API 路由
提供 AI 心理陪伴对话接口
"""
import time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from loguru import logger

from ..services.companion import AICompanion
from ..core.security import RiskLevel
from .dependencies import get_companion

router = APIRouter(prefix="/api", tags=["chat"])


# ============================================
# 请求/响应模型
# ============================================

class ChatRequest(BaseModel):
    """对话请求"""
    user_id: str = Field(..., description="用户 ID")
    session_id: str = Field(..., description="会话 ID")
    message: str = Field(..., min_length=1, max_length=5000, description="用户消息")
    stream: bool = Field(default=True, description="是否流式返回")


class ChatNonStreamResponse(BaseModel):
    """非流式对话响应"""
    content: str
    sentiment_score: Optional[float] = None
    mood_label: Optional[str] = None
    is_crisis: bool = False
    response_time_ms: float = 0.0


class CrisisAlertResponse(BaseModel):
    """危机预警响应"""
    alert_id: Optional[str] = None
    risk_level: Optional[str] = None
    alert_type: Optional[str] = None
    response_action: str = "normal_chat"


class QuickTopic(BaseModel):
    """快捷话题"""
    id: str
    label: str
    emoji: str
    prompt: str


# ============================================
# 快捷话题标签
# ============================================

QUICK_TOPICS = [
    QuickTopic(id="academic", label="学业压力", emoji="📚",
               prompt="最近学习压力好大，感觉怎么努力都跟不上节奏"),
    QuickTopic(id="relationship", label="人际困扰", emoji="💔",
               prompt="最近和朋友/恋人之间有些矛盾，心情很不好"),
    QuickTopic(id="late_night", label="深夜emo", emoji="🌙",
               prompt="深夜了，突然感觉好孤单，睡不着觉"),
    QuickTopic(id="future_anxiety", label="未来迷茫", emoji="🔮",
               prompt="对未来感到很迷茫，不知道毕业后该怎么办"),
    QuickTopic(id="family", label="家庭问题", emoji="🏠",
               prompt="家里有些事情让我很困扰，不知道该怎么处理"),
    QuickTopic(id="self_esteem", label="自我怀疑", emoji="🪞",
               prompt="总觉得自己不够好，做什么都比不上别人"),
    QuickTopic(id="stress", label="日常压力", emoji="😰",
               prompt="各种事情堆在一起，感觉快喘不过气了"),
    QuickTopic(id="loneliness", label="孤独感", emoji="🧩",
               prompt="虽然身边有人，但总觉得很孤独，没人真正理解我"),
]


# ============================================
# API 路由
# ============================================

@router.post("/chat")
async def chat(
    request: ChatRequest,
    companion: AICompanion = Depends(get_companion),
):
    """
    AI 心理陪伴对话接口

    支持流式（SSE）和非流式两种模式。
    流式模式下返回 Server-Sent Events。
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    if request.stream:
        # 流式 SSE 响应
        async def generate():
            try:
                async for response in companion.chat(
                    user_id=request.user_id,
                    message=request.message,
                    session_id=request.session_id,
                    stream=True,
                ):
                    # SSE 格式
                    chunk_data = response.content.replace("\n", "\\n")
                    event_data = (
                        f"data: {chunk_data}\n"
                    )
                    if response.is_crisis:
                        event_data += f"event: crisis_alert\n"
                        event_data += f"id: {response.crisis_alert.get('id', '') if response.crisis_alert else ''}\n"
                    yield event_data + "\n"

                # 发送完成标记
                yield "data: [DONE]\n\n"

            except Exception as e:
                logger.error(f"流式对话异常: {e}")
                yield f"data: [ERROR: {str(e)}]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Nginx 禁用缓冲
            },
        )
    else:
        # 非流式响应
        start_time = time.time()
        response = await companion.chat_non_stream(
            user_id=request.user_id,
            message=request.message,
            session_id=request.session_id,
        )

        return ChatNonStreamResponse(
            content=response.content,
            sentiment_score=response.sentiment.score if response.sentiment else None,
            mood_label=response.sentiment.label if response.sentiment else None,
            is_crisis=response.is_crisis,
            response_time_ms=(time.time() - start_time) * 1000,
        )


@router.get("/chat/quick-topics")
async def get_quick_topics():
    """获取快捷话题标签列表"""
    return {
        "topics": [t.model_dump() for t in QUICK_TOPICS],
    }


@router.post("/chat/memory/context")
async def get_chat_context(
    user_id: str,
    session_id: str,
    companion: AICompanion = Depends(get_companion),
):
    """获取用户会话上下文（调试用）"""
    context = await companion.memory.get_context(user_id, session_id)
    return {
        "user_id": context.user_id,
        "session_id": context.session_id,
        "short_term_rounds": len(context.short_term) // 2,
        "long_term_keywords": context.long_term_keywords,
        "mood_summary": companion.memory.get_mood_summary(context),
    }
