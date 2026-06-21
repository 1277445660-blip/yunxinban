"""
云心伴 - 会话记忆池
管理短期记忆（当前会话上下文）和长期记忆（跨会话关键信息）
"""
import time
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from loguru import logger


@dataclass
class MemoryEntry:
    """记忆条目"""
    role: str  # user | assistant
    content: str
    timestamp: float = field(default_factory=time.time)
    sentiment_score: Optional[float] = None
    keywords: List[str] = field(default_factory=list)


@dataclass
class SessionContext:
    """会话上下文"""
    user_id: str
    session_id: str
    short_term: List[MemoryEntry] = field(default_factory=list)
    long_term_keywords: List[str] = field(default_factory=list)
    mood_trajectory: List[Dict[str, Any]] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)


class SessionMemoryPool:
    """
    会话记忆池

    短期记忆：保留当前会话最近 N 轮对话（滑动窗口）
    长期记忆：跨会话提取的关键主题和情绪模式
    情绪轨迹：追踪用户情绪变化趋势
    """

    # 默认配置
    SHORT_TERM_ROUNDS = 10  # 短期记忆保留最近 N 轮对话
    LONG_TERM_TTL = 90 * 24 * 3600  # 长期记忆 TTL: 90 天
    KEYWORD_EXTRACT_COUNT = 5  # 每次提取关键词数量

    def __init__(
        self,
        mongo_client=None,
        redis_client=None,
        short_term_rounds: int = SHORT_TERM_ROUNDS,
    ):
        self.mongo = mongo_client
        self.redis = redis_client
        self.short_term_rounds = short_term_rounds

        # 内存缓存（开发/测试用，生产环境使用 Redis）
        self._cache: Dict[str, SessionContext] = {}

    async def get_context(
        self,
        user_id: str,
        session_id: str,
    ) -> SessionContext:
        """
        获取用户会话上下文

        优先级：Redis 缓存 > MongoDB > 新建
        """
        cache_key = f"memory:{user_id}:{session_id}"

        # 1. 尝试从 Redis 缓存获取
        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    import json
                    data = json.loads(cached)
                    return self._deserialize_context(data)
            except Exception as e:
                logger.warning(f"Redis 读取失败: {e}")

        # 2. 尝试从 MongoDB 获取
        if self.mongo:
            try:
                doc = await self.mongo.session_memory.find_one({
                    "user_id": user_id,
                    "session_id": session_id,
                })
                if doc:
                    return self._doc_to_context(doc)
            except Exception as e:
                logger.warning(f"MongoDB 读取失败: {e}")

        # 3. 检查内存缓存
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 4. 新建上下文
        return SessionContext(user_id=user_id, session_id=session_id)

    async def update(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
        assistant_message: str,
        sentiment_score: Optional[float] = None,
    ):
        """
        更新记忆池（每轮对话结束后调用）

        Args:
            user_id: 用户 ID
            session_id: 会话 ID
            user_message: 用户消息
            assistant_message: AI 回复
            sentiment_score: 用户消息的情感分数
        """
        cache_key = f"memory:{user_id}:{session_id}"

        # 获取或创建上下文
        context = await self.get_context(user_id, session_id)

        # 提取关键词（简化版：基于词频）
        user_keywords = self._extract_keywords(user_message)
        assistant_keywords = self._extract_keywords(assistant_message)

        # 添加快短期记忆
        context.short_term.append(MemoryEntry(
            role="user",
            content=user_message,
            sentiment_score=sentiment_score,
            keywords=user_keywords,
        ))
        context.short_term.append(MemoryEntry(
            role="assistant",
            content=assistant_message,
            keywords=assistant_keywords,
        ))

        # 滑动窗口：保留最近 N 轮
        max_entries = self.short_term_rounds * 2  # 每轮 user + assistant
        if len(context.short_term) > max_entries:
            context.short_term = context.short_term[-max_entries:]

        # 更新长期记忆关键词
        all_new_keywords = user_keywords + assistant_keywords
        for kw in all_new_keywords:
            if kw not in context.long_term_keywords:
                context.long_term_keywords.append(kw)
        # 限制长期关键词数量
        if len(context.long_term_keywords) > 50:
            context.long_term_keywords = context.long_term_keywords[-50:]

        # 更新情绪轨迹
        if sentiment_score is not None:
            context.mood_trajectory.append({
                "score": sentiment_score,
                "timestamp": time.time(),
            })
            # 保留最近 30 天的情绪轨迹
            cutoff = time.time() - 30 * 24 * 3600
            context.mood_trajectory = [
                m for m in context.mood_trajectory
                if m["timestamp"] > cutoff
            ]

        context.updated_at = time.time()

        # 持久化存储
        await self._persist(user_id, session_id, context, cache_key)

    async def _persist(
        self,
        user_id: str,
        session_id: str,
        context: SessionContext,
        cache_key: str,
    ):
        """持久化到 Redis 和 MongoDB"""
        # Redis 缓存（带 TTL）
        if self.redis:
            try:
                import json
                await self.redis.setex(
                    cache_key,
                    3600,  # 1 小时 TTL
                    json.dumps(self._context_to_dict(context), ensure_ascii=False),
                )
            except Exception as e:
                logger.warning(f"Redis 写入失败: {e}")

        # MongoDB 持久化
        if self.mongo:
            try:
                await self.mongo.session_memory.update_one(
                    {"user_id": user_id, "session_id": session_id},
                    {"$set": {
                        **self._context_to_dict(context),
                        "updated_at": datetime.now(timezone.utc),
                    }},
                    upsert=True,
                )
            except Exception as e:
                logger.warning(f"MongoDB 写入失败: {e}")

        # 内存缓存
        self._cache[cache_key] = context

    def get_recent_messages(
        self,
        context: SessionContext,
        n: int = 6,
    ) -> List[Dict[str, str]]:
        """
        获取最近 N 条消息，用于构建 LLM 上下文

        Returns:
            [{"role": "user", "content": "..."}, ...]
        """
        recent = context.short_term[-n:]
        return [{"role": e.role, "content": e.content} for e in recent]

    def get_mood_summary(self, context: SessionContext) -> Dict[str, Any]:
        """获取情绪摘要"""
        if not context.mood_trajectory:
            return {"trend": "unknown", "average": None, "latest": None}

        scores = [m["score"] for m in context.mood_trajectory]

        # 趋势判断
        if len(scores) >= 3:
            recent_avg = sum(scores[-3:]) / 3
            early_avg = sum(scores[:3]) / 3
            if recent_avg > early_avg + 0.1:
                trend = "improving"
            elif recent_avg < early_avg - 0.1:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "average": round(sum(scores) / len(scores), 4),
            "latest": scores[-1],
            "total_points": len(scores),
        }

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """简化版关键词提取"""
        # 生产环境应使用 jieba.analyse.extract_tags
        try:
            import jieba.analyse
            return jieba.analyse.extract_tags(text, topK=5)
        except ImportError:
            # 退化为简单按长度过滤
            words = text.replace("，", " ").replace("。", " ").split()
            return [w for w in words if len(w) >= 2][:5]

    # ---------- 序列化辅助方法 ----------

    def _context_to_dict(self, ctx: SessionContext) -> dict:
        return {
            "user_id": ctx.user_id,
            "session_id": ctx.session_id,
            "short_term_context": [
                {
                    "role": e.role,
                    "content": e.content,
                    "timestamp": e.timestamp,
                    "sentiment_score": e.sentiment_score,
                    "keywords": e.keywords,
                }
                for e in ctx.short_term
            ],
            "long_term_keywords": ctx.long_term_keywords,
            "mood_trajectory": ctx.mood_trajectory,
            "created_at": ctx.created_at,
            "updated_at": ctx.updated_at,
        }

    @staticmethod
    def _doc_to_context(doc: dict) -> SessionContext:
        ctx = SessionContext(
            user_id=doc["user_id"],
            session_id=doc["session_id"],
            long_term_keywords=doc.get("long_term_keywords", []),
            mood_trajectory=doc.get("mood_trajectory", []),
            created_at=doc.get("created_at", time.time()),
            updated_at=doc.get("updated_at", time.time()),
        )
        for entry in doc.get("short_term_context", []):
            ctx.short_term.append(MemoryEntry(
                role=entry["role"],
                content=entry["content"],
                timestamp=entry.get("timestamp", 0),
                sentiment_score=entry.get("sentiment_score"),
                keywords=entry.get("keywords", []),
            ))
        return ctx

    @staticmethod
    def _deserialize_context(data: dict) -> SessionContext:
        return SessionMemoryPool._doc_to_context(data)
