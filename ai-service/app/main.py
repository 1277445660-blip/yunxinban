"""
云心伴 - AI 心理陪伴微服务入口
FastAPI 应用主文件
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .core.config import settings
from .api.chat import router as chat_router
from .api.analyze import router as analyze_router
from .api.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} 启动中...")
    logger.info(f"   LLM Provider: {settings.llm_provider}")
    logger.info(f"   监听端口: {settings.port}")

    # 启动时初始化
    try:
        from .api.dependencies import get_llm_provider
        provider = get_llm_provider()
        logger.info(f"   LLM 模型: {provider.get_model_name()}")
    except Exception as e:
        logger.warning(f"   LLM Provider 初始化警告: {e}")

    yield

    # 关闭时清理
    logger.info(f"👋 {settings.app_name} 正在关闭...")


app = FastAPI(
    title="云心伴 AI 服务",
    description="云端守望心理陪伴系统 - AI 微服务",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat_router)
app.include_router(analyze_router)
app.include_router(health_router)


# 启动入口
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level,
    )
