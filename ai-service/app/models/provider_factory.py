"""
云心伴 - Provider 工厂
根据配置创建对应的 LLM Provider 实例
"""
from typing import Dict, Any
from loguru import logger

from .llm_provider import LLMProvider, LLMConfig
from .tongyi_provider import TongyiProvider
from .glm_provider import GLMProvider


class ProviderFactory:
    """LLM Provider 工厂"""

    # 注册的 Provider 类型
    _registry: Dict[str, type] = {
        "tongyi": TongyiProvider,
        "glm": GLMProvider,
    }

    @classmethod
    def register(cls, name: str, provider_cls: type):
        """注册新的 Provider 类型"""
        cls._registry[name] = provider_cls
        logger.info(f"注册 LLM Provider: {name}")

    @classmethod
    def create(cls, provider_name: str, **kwargs) -> LLMProvider:
        """
        创建 Provider 实例

        Args:
            provider_name: Provider 名称（tongyi | glm | ...）
            **kwargs: Provider 特定参数

        Returns:
            LLMProvider 实例

        Raises:
            ValueError: 不支持的 Provider 类型
        """
        if provider_name not in cls._registry:
            available = ", ".join(cls._registry.keys())
            raise ValueError(
                f"不支持的 LLM Provider: {provider_name}，可用选项: {available}"
            )

        provider_cls = cls._registry[provider_name]
        config = LLMConfig(
            model=kwargs.get("model", ""),
            max_tokens=kwargs.get("max_tokens", 2048),
            temperature=kwargs.get("temperature", 0.7),
            top_p=kwargs.get("top_p", 0.9),
            timeout=kwargs.get("timeout", 30),
        )

        if provider_name == "tongyi":
            api_key = kwargs.get("api_key")
            if not api_key:
                raise ValueError("通义千问 Provider 需要 api_key")
            return provider_cls(
                config=config,
                api_key=api_key,
                base_url=kwargs.get("base_url"),
            )

        elif provider_name == "glm":
            api_url = kwargs.get("api_url")
            if not api_url:
                raise ValueError("ChatGLM Provider 需要 api_url")
            return provider_cls(config=config, api_url=api_url)

        else:
            # 自定义 Provider：尝试实例化
            return provider_cls(config=config, **kwargs)

    @classmethod
    def available_providers(cls) -> Dict[str, str]:
        """列出所有可用的 Provider"""
        return {
            name: pcls.__doc__ or pcls.__name__
            for name, pcls in cls._registry.items()
        }
