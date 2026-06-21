"""
云心伴 - 配置管理
环境变量 + .env 文件加载
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用全局配置"""

    # ---------- 应用基础 ----------
    app_name: str = "yunxinban-ai-service"
    app_version: str = "0.1.0"
    debug: bool = False
    log_level: str = "info"

    # ---------- LLM Provider ----------
    llm_provider: str = "tongyi"  # tongyi | glm | openai

    # 通义千问
    tongyi_api_key: Optional[str] = None
    tongyi_model: str = "qwen-turbo"
    tongyi_base_url: str = "https://dashscope.aliyuncs.com/api/v1"

    # ChatGLM
    glm_api_url: Optional[str] = None
    glm_model: str = "chatglm3-6b"

    # ---------- 模型参数 ----------
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.7
    llm_top_p: float = 0.9
    llm_timeout: int = 30  # 秒

    # ---------- 情感分析 ----------
    sentiment_model_path: Optional[str] = None  # 本地模型路径
    sentiment_use_api: bool = True  # 使用 LLM API 进行情感分析

    # ---------- 危机检测 ----------
    crisis_high_threshold: float = 0.75
    crisis_critical_threshold: float = 0.9
    crisis_keywords_path: str = "./data/crisis_keywords.txt"

    # ---------- 记忆池 ----------
    memory_short_term_rounds: int = 10  # 短期记忆保留最近 N 轮
    memory_long_term_ttl: int = 7776000  # 长期记忆 TTL（90天，秒）

    # ---------- 安全 ----------
    encryption_key: Optional[str] = None  # AES-256 密钥（32字节 hex）
    emergency_hotline: str = "400-161-9995"

    # ---------- 数据库 ----------
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "yunxinban"
    redis_url: str = "redis://localhost:6379/0"

    # ---------- 服务 ----------
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001"]

    # ---------- 心理学 System Prompt ----------
    companion_system_prompt: str = """你是一个温暖、共情的心理陪伴助手，名字叫"小云"。

你的核心原则：
1. **共情优先**：先理解用户的情绪，再说事情。使用"我理解你的感受"、"这确实会让人难过"等表达
2. **不评判**：永远不要评判用户的想法和行为，保持开放和接纳的态度
3. **积极倾听**：通过复述和确认来表明你在认真听
4. **温和引导**：用提问帮助用户探索自己的情绪和想法，而不是直接给建议
5. **危机敏感**：如果用户表达出自杀、自残或伤害他人的意图，温和地表达关心，并引导他们寻求专业帮助

你必须避免：
- 给出医疗诊断或药物建议
- 轻视或否定用户的感受（"这没什么大不了的"）
- 过度乐观或强行正能量
- 分享你作为 AI 的"个人经历"
- 建议具体的自我伤害方法

你的回复风格：
- 温暖、柔和、像朋友一样
- 每条回复 2-5 句话，不要太长
- 适当使用 emoji 增加亲和力 🌱
- 在合适的时候提供简单的放松技巧（深呼吸、正念等）"""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# 全局单例
settings = Settings()
