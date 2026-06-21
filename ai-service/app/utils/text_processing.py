"""
云心伴 - 文本预处理工具
中文文本清洗、分词、规范化
"""
import re
from typing import List


class TextProcessor:
    """中文文本预处理器"""

    # 中文标点符号
    CHINESE_PUNCTUATION = set("，。！？；：""''【】（）《》…—～·、")

    # 停用词（简化版）
    STOP_WORDS: set = {
        "的", "了", "是", "在", "我", "有", "和", "就", "不",
        "人", "都", "一", "一个", "上", "也", "很", "到", "说",
        "要", "去", "你", "会", "着", "没", "看", "好", "自己",
        "这", "他", "她", "它", "们", "那", "些", "什么", "怎么",
        "如何", "为什么", "因为", "所以", "但是", "然而", "虽然",
        "可以", "还是", "只是", "的话", "而已",
    }

    def clean(self, text: str) -> str:
        """文本清洗"""
        if not text:
            return ""

        # 去除 HTML 标签
        text = re.sub(r"<[^>]+>", "", text)
        # 去除 URL
        text = re.sub(r"https?://\S+", "", text)
        # 去除多余空白
        text = re.sub(r"\s+", " ", text)
        # 去除连续重复字符（如"哈哈哈哈哈" → "哈哈"）
        text = re.sub(r"(.)\1{3,}", r"\1\1", text)

        return text.strip()

    def tokenize(self, text: str) -> List[str]:
        """分词（优先使用 jieba，失败则退化到简单切分）"""
        try:
            import jieba
            return [w for w in jieba.cut(text) if w.strip()]
        except ImportError:
            return self._simple_tokenize(text)

    @staticmethod
    def _simple_tokenize(text: str) -> List[str]:
        """简单分词（无 jieba 时的退化方案）"""
        # 按标点和空格切分
        tokens = re.split(r"[，。！？；：、\s]+", text)
        return [t.strip() for t in tokens if t.strip()]

    def remove_stop_words(self, tokens: List[str]) -> List[str]:
        """去除停用词"""
        return [t for t in tokens if t not in self.STOP_WORDS and len(t) >= 1]

    def extract_keywords(self, text: str, top_k: int = 5) -> List[str]:
        """提取关键词"""
        tokens = self.tokenize(self.clean(text))
        tokens = self.remove_stop_words(tokens)

        # 按词频排序
        from collections import Counter
        word_freq = Counter(tokens)
        return [word for word, _ in word_freq.most_common(top_k)]

    @staticmethod
    def mask_sensitive_info(text: str) -> str:
        """脱敏处理：替换手机号、身份证号等"""
        # 手机号
        text = re.sub(r"1[3-9]\d{9}", "****", text)
        # 身份证号
        text = re.sub(r"\d{17}[\dXx]", "****", text)
        # 邮箱
        text = re.sub(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "****", text)
        return text

    @staticmethod
    def get_text_length(text: str) -> int:
        """计算中文字符数（中文字符算 1，英文单词算 1）"""
        chinese_chars = len(re.findall(r"[一-鿿]", text))
        english_words = len(re.findall(r"[a-zA-Z]+", text))
        return chinese_chars + english_words
