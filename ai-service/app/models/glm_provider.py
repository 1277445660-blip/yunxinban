"""
云心伴 - ChatGLM Provider 实现（预留）
用于私有化部署 ChatGLM-3/4 模型
"""
from typing import AsyncIterator, List, Optional
from loguru import logger

from .llm_provider import LLMProvider, ChatMessage, ChatCompletionChunk, LLMConfig


class GLMProvider(LLMProvider):
    """
    ChatGLM Provider（预留实现）

    通过本地 ChatGLM API 调用（需自行部署 ChatGLM 服务）
    常用部署方案：
    - vLLM + ChatGLM
    - FastChat + ChatGLM
    - 官方 ChatGLM API Server
    """

    SUPPORTED_MODELS = {
        "chatglm3-6b": "ChatGLM3-6B（轻量级）",
        "chatglm4-9b": "ChatGLM4-9B（推荐）",
    }

    def __init__(self, config: LLMConfig, api_url: str):
        super().__init__(config)
        self.api_url = api_url.rstrip("/")
        self._available = False

        # 延迟初始化：在首次调用时检查 API 可用性
        import httpx
        self._http = httpx.AsyncClient(timeout=config.timeout)

    async def _ensure_available(self):
        """确保服务可用"""
        if self._available:
            return
        try:
            resp = await self._http.get(f"{self.api_url}/health")
            self._available = resp.status_code == 200
        except Exception:
            self._available = False

    async def chat(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        stream: bool = True,
    ) -> AsyncIterator[ChatCompletionChunk]:
        """流式对话"""
        await self._ensure_available()

        if not self._available:
            yield ChatCompletionChunk(content="[GLM 服务不可用]", finish_reason="error")
            return

        # 构建请求体（兼容 OpenAI 格式）
        glm_messages = []
        if system_prompt:
            glm_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            glm_messages.append({"role": msg.role, "content": msg.content})

        payload = {
            "model": self.config.model or "chatglm3-6b",
            "messages": glm_messages,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "top_p": self.config.top_p,
            "stream": stream,
        }

        try:
            async with self._http.stream("POST", f"{self.api_url}/v1/chat/completions", json=payload) as response:
                if response.status_code != 200:
                    logger.error(f"GLM API 错误: {response.status_code}")
                    yield ChatCompletionChunk(content="[GLM 服务异常]", finish_reason="error")
                    return

                if stream:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            import json
                            try:
                                chunk = json.loads(data)
                                content = chunk["choices"][0]["delta"].get("content", "")
                                finish = chunk["choices"][0].get("finish_reason")
                                yield ChatCompletionChunk(content=content, finish_reason=finish)
                            except (json.JSONDecodeError, KeyError):
                                continue
                else:
                    import json
                    data = await response.aread()
                    result = json.loads(data)
                    content = result["choices"][0]["message"]["content"]
                    yield ChatCompletionChunk(content=content, finish_reason="stop")

        except Exception as e:
            logger.error(f"GLM 调用异常: {e}")
            yield ChatCompletionChunk(content="[服务异常，请稍后再试]", finish_reason="error")

    async def chat_complete(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
    ) -> str:
        full_text = ""
        async for chunk in self.chat(messages, system_prompt, stream=False):
            full_text += chunk.content
        return full_text

    async def get_embeddings(self, text: str) -> List[float]:
        """ChatGLM embedding（需要模型支持）"""
        await self._ensure_available()
        if not self._available:
            return []

        try:
            response = await self._http.post(
                f"{self.api_url}/v1/embeddings",
                json={"model": self.config.model, "input": text},
            )
            if response.status_code == 200:
                return response.json()["data"][0]["embedding"]
            return []
        except Exception as e:
            logger.error(f"GLM Embedding 异常: {e}")
            return []

    def get_model_name(self) -> str:
        return self.config.model or "chatglm3-6b"

    async def health_check(self) -> bool:
        await self._ensure_available()
        return self._available
