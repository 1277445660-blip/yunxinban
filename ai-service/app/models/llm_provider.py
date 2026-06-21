"""
云心伴 - LLM Provider 抽象基类
模型无关设计：所有 LLM 调用通过此接口，支持无缝切换模型
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class ChatMessage:
    """对话消息"""
    role: str  # system | user | assistant
    content: str


@dataclass
class ChatCompletionChunk:
    """流式响应的单个 chunk"""
    content: str
    finish_reason: Optional[str] = None  # stop | length | error


@dataclass
class LLMConfig:
    """LLM 通用配置"""
    model: str = ""
    max_tokens: int = 2048
    temperature: float = 0.7
    top_p: float = 0.9
    timeout: int = 30


class LLMProvider(ABC):
    """
    统一 LLM Provider 抽象基类

    所有 LLM 后端（通义千问、ChatGLM、OpenAI 等）都必须实现此接口，
    确保上层业务代码与具体模型解耦。
    """

    def __init__(self, config: LLMConfig):
        self.config = config

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        stream: bool = True,
    ) -> AsyncIterator[ChatCompletionChunk]:
        """
        发送对话请求，返回流式响应

        Args:
            messages: 对话历史
            system_prompt: 系统提示词（覆盖默认）
            stream: 是否流式返回

        Yields:
            ChatCompletionChunk: 流式响应块
        """
        ...

    @abstractmethod
    async def chat_complete(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        非流式对话，返回完整回复

        Args:
            messages: 对话历史
            system_prompt: 系统提示词

        Returns:
            完整的 AI 回复文本
        """
        ...

    @abstractmethod
    async def get_embeddings(self, text: str) -> List[float]:
        """
        获取文本向量（用于语义相似度检索）

        Args:
            text: 输入文本

        Returns:
            向量列表
        """
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        """返回当前模型名称"""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """检查模型服务是否可用"""
        ...
