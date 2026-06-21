"""
云心伴 - 通义千问 Provider 实现
基于阿里云 DashScope SDK
"""
from typing import AsyncIterator, List, Optional
from loguru import logger

from .llm_provider import LLMProvider, ChatMessage, ChatCompletionChunk, LLMConfig


class TongyiProvider(LLMProvider):
    """通义千问 (Qwen) 模型 Provider"""

    # 通义千问模型列表
    SUPPORTED_MODELS = {
        "qwen-turbo": "通义千问-Turbo（性价比推荐）",
        "qwen-plus": "通义千问-Plus（效果/速度均衡）",
        "qwen-max": "通义千问-Max（最强效果）",
        "qwen-long": "通义千问-Long（长上下文）",
    }

    def __init__(self, config: LLMConfig, api_key: str, base_url: Optional[str] = None):
        super().__init__(config)
        self.api_key = api_key
        self.base_url = base_url or "https://dashscope.aliyuncs.com/api/v1"

        # 初始化 DashScope SDK
        try:
            import dashscope
            dashscope.api_key = api_key
            self._client = dashscope
            self._available = True
        except ImportError:
            logger.warning("dashscope SDK 未安装，通义千问 Provider 将不可用")
            self._available = False
        except Exception as e:
            logger.error(f"初始化通义千问 Provider 失败: {e}")
            self._available = False

    async def chat(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        stream: bool = True,
    ) -> AsyncIterator[ChatCompletionChunk]:
        """流式对话"""
        if not self._available:
            yield ChatCompletionChunk(content="[服务暂时不可用，请稍后再试]", finish_reason="error")
            return

        # 构建消息列表
        dashscope_messages = []
        if system_prompt:
            dashscope_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            dashscope_messages.append({"role": msg.role, "content": msg.content})

        try:
            from dashscope.aigc.generation import Generation

            if stream:
                # 流式调用
                response = Generation.call(
                    model=self.config.model or "qwen-turbo",
                    messages=dashscope_messages,
                    result_format="message",
                    stream=True,
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                )

                for chunk in response:
                    if chunk.status_code == 200:
                        content = chunk.output.choices[0].message.content
                        finish_reason = chunk.output.choices[0].finish_reason
                        yield ChatCompletionChunk(content=content, finish_reason=finish_reason)
                    else:
                        logger.error(f"通义千问 API 错误: {chunk.code} - {chunk.message}")
                        yield ChatCompletionChunk(
                            content="[回复生成异常，请重试]",
                            finish_reason="error",
                        )
                        break
            else:
                # 非流式调用
                response = Generation.call(
                    model=self.config.model or "qwen-turbo",
                    messages=dashscope_messages,
                    result_format="message",
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                )

                if response.status_code == 200:
                    full_content = response.output.choices[0].message.content
                    yield ChatCompletionChunk(content=full_content, finish_reason="stop")
                else:
                    logger.error(f"通义千问 API 错误: {response.code} - {response.message}")
                    yield ChatCompletionChunk(
                        content="[回复生成异常，请重试]",
                        finish_reason="error",
                    )

        except Exception as e:
            logger.error(f"通义千问调用异常: {e}")
            yield ChatCompletionChunk(content="[服务异常，请稍后再试]", finish_reason="error")

    async def chat_complete(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> str:
        """非流式完整回复"""
        full_text = ""
        async for chunk in self.chat(messages, system_prompt, stream=False):
            full_text += chunk.content
        return full_text

    async def get_embeddings(self, text: str) -> List[float]:
        """获取文本向量"""
        if not self._available:
            return []

        try:
            from dashscope import TextEmbedding

            response = TextEmbedding.call(
                model="text-embedding-v2",
                input=text,
            )

            if response.status_code == 200:
                return response.output.embeddings[0].embedding
            else:
                logger.error(f"Embedding API 错误: {response.code}")
                return []
        except Exception as e:
            logger.error(f"Embedding 调用异常: {e}")
            return []

    def get_model_name(self) -> str:
        return self.config.model or "qwen-turbo"

    async def health_check(self) -> bool:
        """健康检查：简单 API 测试"""
        if not self._available:
            return False
        try:
            from dashscope.aigc.generation import Generation

            response = Generation.call(
                model=self.config.model or "qwen-turbo",
                messages=[{"role": "user", "content": "ping"}],
                result_format="message",
                max_tokens=10,
            )
            return response.status_code == 200
        except Exception:
            return False
