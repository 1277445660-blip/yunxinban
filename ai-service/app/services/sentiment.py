"""
云心伴 - 情感分析服务
提供文本情感极性打分、情绪类别识别
"""
import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from loguru import logger

from ..utils.text_processing import TextProcessor


@dataclass
class SentimentResult:
    """情感分析结果"""
    score: float  # 情感极性分数 0-1（0=极度负面, 0.5=中性, 1=极度正面）
    label: str  # positive | neutral | negative
    confidence: float  # 置信度 0-1
    emotions: Dict[str, float] = field(default_factory=dict)  # 情绪分布
    keywords: List[str] = field(default_factory=list)  # 提取的情绪关键词


class SentimentAnalyzer:
    """
    情感分析器

    支持两种模式：
    1. 规则模式：基于情感词典 + 规则（快速、离线可用）
    2. API 模式：调用 LLM API 进行更准确的情感分析
    """

    # 中文情感词典（简化版，生产环境应加载完整词典）
    POSITIVE_WORDS: set = {
        "开心", "快乐", "高兴", "幸福", "满足", "感激", "温暖",
        "期待", "希望", "信心", "放松", "安心", "喜悦", "兴奋",
        "感动", "美好", "喜欢", "热爱", "积极", "阳光", "微笑",
        "哈哈", "嘻嘻", "太好了", "棒", "赞", "nice",
    }

    NEGATIVE_WORDS: set = {
        "难过", "伤心", "痛苦", "焦虑", "害怕", "恐惧", "孤独",
        "绝望", "无助", "沮丧", "失落", "烦躁", "愤怒", "压抑",
        "疲惫", "厌倦", "迷茫", "空虚", "自责", "内疚", "崩溃",
        "想哭", "难受", "不舒服", "糟糕", "烦", "累", "唉",
    }

    # 程度副词（增强或减弱情感）
    INTENSIFIERS: Dict[str, float] = {
        "非常": 1.5, "特别": 1.5, "极其": 1.8, "十分": 1.3,
        "太": 1.4, "很": 1.2, "真的": 1.3, "好": 1.1,
        "有点": 0.6, "有些": 0.6, "稍微": 0.5, "略微": 0.4,
    }

    # 否定词（翻转情感极性）
    NEGATION_WORDS: set = {
        "不", "没", "没有", "不是", "别", "无", "非", "未",
    }

    def __init__(
        self,
        text_processor: Optional[TextProcessor] = None,
        use_api: bool = False,
        llm_provider=None,
    ):
        self.text_processor = text_processor or TextProcessor()
        self.use_api = use_api
        self.llm_provider = llm_provider

    async def analyze(self, text: str) -> SentimentResult:
        """
        分析文本情感

        Args:
            text: 输入文本

        Returns:
            SentimentResult: 情感分析结果
        """
        if self.use_api and self.llm_provider:
            return await self._analyze_with_api(text)
        else:
            return self._analyze_with_rules(text)

    def _analyze_with_rules(self, text: str) -> SentimentResult:
        """
        基于情感词典 + 规则的情感分析

        算法：
        1. 分词
        2. 统计正负向词汇
        3. 考虑程度副词和否定词
        4. 归一化到 0-1 分数
        """
        cleaned = self.text_processor.clean(text)
        words = self.text_processor.tokenize(cleaned)

        positive_count = 0
        negative_count = 0
        total_weight = 0
        found_keywords: List[str] = []
        emotions: Dict[str, float] = {}

        skip_next = False
        for i, word in enumerate(words):
            if skip_next:
                skip_next = False
                continue

            multiplier = 1.0

            # 检查前面的程度副词
            if i > 0 and words[i - 1] in self.INTENSIFIERS:
                multiplier = self.INTENSIFIERS[words[i - 1]]

            # 检查前面的否定词
            if i > 0 and words[i - 1] in self.NEGATION_WORDS:
                multiplier *= -0.5  # 否定翻转
            if i > 1 and words[i - 2] in self.NEGATION_WORDS:
                multiplier *= -0.5
                if words[i - 1] in self.INTENSIFIERS:
                    skip_next = True

            if word in self.POSITIVE_WORDS:
                weight = multiplier
                positive_count += max(weight, 0)
                negative_count += max(-weight, 0)
                total_weight += abs(weight)
                found_keywords.append(word)

            elif word in self.NEGATIVE_WORDS:
                weight = multiplier
                negative_count += max(weight, 0)
                positive_count += max(-weight, 0)
                total_weight += abs(weight)
                found_keywords.append(word)

        # 计算情感分数
        if total_weight == 0:
            score = 0.5  # 中性
            confidence = 0.3
        else:
            # 映射: 纯正面=1, 纯负面=0
            score = positive_count / (positive_count + negative_count) if (positive_count + negative_count) > 0 else 0.5
            confidence = min(total_weight / max(len(words), 1) * 2, 1.0)

        # 情绪分布估算
        if negative_count > positive_count:
            emotions = {"sadness": min(negative_count / total_weight, 1.0) if total_weight > 0 else 0.5}
            label = "negative"
        elif positive_count > negative_count:
            emotions = {"joy": min(positive_count / total_weight, 1.0) if total_weight > 0 else 0.5}
            label = "positive"
        else:
            emotions = {"neutral": 1.0}
            label = "neutral"

        return SentimentResult(
            score=round(score, 4),
            label=label,
            confidence=round(confidence, 4),
            emotions=emotions,
            keywords=found_keywords[:10],
        )

    async def _analyze_with_api(self, text: str) -> SentimentResult:
        """通过 LLM API 进行情感分析（更准确但更慢）"""
        from ..models.llm_provider import ChatMessage

        prompt = f"""请分析以下文本的情感，返回JSON格式（不要其他内容）：
{{
    "score": <0到1之间的数字，0=极度负面，0.5=中性，1=极度正面>,
    "label": "<positive|neutral|negative>",
    "emotions": {{"<情绪>": <强度0-1>}},
    "keywords": ["<情绪关键词>"]
}}

文本："{text}"
"""
        try:
            response = await self.llm_provider.chat_complete(
                messages=[ChatMessage(role="user", content=prompt)],
            )

            import json
            # 尝试提取 JSON
            json_match = re.search(r"\{[\s\S]*\}", response)
            if json_match:
                data = json.loads(json_match.group())
                return SentimentResult(
                    score=float(data.get("score", 0.5)),
                    label=data.get("label", "neutral"),
                    confidence=0.8,
                    emotions=data.get("emotions", {}),
                    keywords=data.get("keywords", []),
                )
        except Exception as e:
            logger.error(f"API 情感分析失败: {e}")

        # 降级到规则模式
        return self._analyze_with_rules(text)

    def analyze_batch(self, texts: List[str]) -> List[SentimentResult]:
        """批量情感分析（非异步）"""
        return [self._analyze_with_rules(t) for t in texts]

    def get_mood_description(self, score: float) -> str:
        """将情感分数转换为情绪描述"""
        if score < 0.2:
            return "极度低落"
        elif score < 0.35:
            return "比较难过"
        elif score < 0.45:
            return "有些低落"
        elif score < 0.55:
            return "心情平稳"
        elif score < 0.7:
            return "状态不错"
        elif score < 0.85:
            return "比较开心"
        else:
            return "心情很好"
