"""
云心伴 - 分析 API 路由
提供情感分析、危机检测等独立分析接口
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List

from ..services.sentiment import SentimentAnalyzer
from ..services.safety_filter import SafetyFilter
from ..services.crisis_detector import CrisisIntentionDetector
from ..core.security import RiskLevel, AlertType
from .dependencies import get_sentiment_analyzer, get_crisis_detector, get_safety_filter

router = APIRouter(prefix="/api", tags=["analyze"])


# ============================================
# 请求/响应模型
# ============================================

class AnalyzeRequest(BaseModel):
    """情感分析请求"""
    text: str = Field(..., min_length=1, max_length=5000, description="待分析文本")
    detect_crisis: bool = Field(default=True, description="是否同时进行危机检测")


class AnalyzeResponse(BaseModel):
    """情感分析响应"""
    sentiment_score: float
    sentiment_label: str
    sentiment_confidence: float
    emotions: dict = {}
    keywords: List[str] = []
    mood_description: str
    crisis_detected: bool = False
    crisis_level: Optional[str] = None
    crisis_score: Optional[float] = None
    trigger_phrases: Optional[List[str]] = None


class CrisisDetectRequest(BaseModel):
    """危机检测请求"""
    user_id: str = Field(..., description="用户 ID")
    text: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[str] = Field(default=None)


class CrisisDetectResponse(BaseModel):
    """危机检测响应"""
    is_crisis: bool
    risk_level: str
    combined_score: float
    alert_type: str
    trigger_phrases: List[str]
    response_action: str
    response_message: Optional[str] = None


class BatchAnalyzeRequest(BaseModel):
    """批量分析请求"""
    texts: List[str] = Field(..., min_items=1, max_items=100)


class BatchAnalyzeResponse(BaseModel):
    """批量分析响应"""
    results: List[AnalyzeResponse]


# ============================================
# API 路由
# ============================================

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(
    request: AnalyzeRequest,
    sentiment_analyzer: SentimentAnalyzer = Depends(get_sentiment_analyzer),
    safety_filter: SafetyFilter = Depends(get_safety_filter),
):
    """
    文本情感分析

    分析文本的情感极性、情绪类别，可同时进行危机检测。
    """
    # 情感分析
    result = await sentiment_analyzer.analyze(request.text)

    response = AnalyzeResponse(
        sentiment_score=result.score,
        sentiment_label=result.label,
        sentiment_confidence=result.confidence,
        emotions=result.emotions,
        keywords=result.keywords,
        mood_description=sentiment_analyzer.get_mood_description(result.score),
    )

    # 危机检测（如果需要）
    if request.detect_crisis:
        detection = safety_filter.detect_crisis(
            text=request.text,
            sentiment_score=result.score,
        )
        response.crisis_detected = detection.is_crisis
        response.crisis_level = detection.level.value
        response.crisis_score = detection.score
        response.trigger_phrases = detection.trigger_phrases

    return response


@router.post("/detect-crisis", response_model=CrisisDetectResponse)
async def detect_crisis(
    request: CrisisDetectRequest,
    crisis_detector: CrisisIntentionDetector = Depends(get_crisis_detector),
):
    """
    危机意图检测

    对用户消息进行完整的危机分析，返回风险等级和响应建议。
    用于后端服务调用，不直接暴露给客户端。
    """
    if not request.session_id:
        import uuid
        request.session_id = str(uuid.uuid4())

    result = await crisis_detector.analyze(
        user_id=request.user_id,
        text=request.text,
        session_id=request.session_id,
    )

    alert = result.get("alert")

    return CrisisDetectResponse(
        is_crisis=result["is_crisis"],
        risk_level=alert.risk_level.value if alert else RiskLevel.LOW.value,
        combined_score=alert.combined_score if alert else 0.0,
        alert_type=alert.alert_type.value if alert else AlertType.OTHER.value,
        trigger_phrases=alert.trigger_phrases if alert else [],
        response_action=result["response_action"],
        response_message=result.get("response_message"),
    )


@router.post("/analyze/batch", response_model=BatchAnalyzeResponse)
async def batch_analyze(
    request: BatchAnalyzeRequest,
    sentiment_analyzer: SentimentAnalyzer = Depends(get_sentiment_analyzer),
):
    """批量情感分析"""
    results = sentiment_analyzer.analyze_batch(request.texts)
    return BatchAnalyzeResponse(
        results=[
            AnalyzeResponse(
                sentiment_score=r.score,
                sentiment_label=r.label,
                sentiment_confidence=r.confidence,
                emotions=r.emotions,
                keywords=r.keywords,
                mood_description=sentiment_analyzer.get_mood_description(r.score),
            )
            for r in results
        ]
    )


@router.get("/analyze/stats")
async def get_analysis_stats(
    crisis_detector: CrisisIntentionDetector = Depends(get_crisis_detector),
):
    """获取分析统计数据（预警等级分布）"""
    return {
        "alert_stats": crisis_detector.get_alert_stats(),
    }
