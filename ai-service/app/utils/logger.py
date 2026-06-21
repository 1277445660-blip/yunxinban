"""
云心伴 - 日志配置
基于 loguru 的结构化日志
"""
import sys
from loguru import logger
from ..core.config import settings


def setup_logger():
    """配置日志系统"""
    # 移除默认 handler
    logger.remove()

    # 控制台输出（彩色）
    logger.add(
        sys.stdout,
        level=settings.log_level.upper(),
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=True,
        diagnose=settings.debug,
    )

    # 文件输出（结构化）
    logger.add(
        "logs/ai-service_{time:YYYY-MM-DD}.log",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
        rotation="00:00",  # 每天轮转
        retention="30 days",
        compression="gz",
        encoding="utf-8",
        backtrace=True,
        diagnose=False,
    )

    # 错误日志单独存储
    logger.add(
        "logs/ai-service_error_{time:YYYY-MM-DD}.log",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
        rotation="00:00",
        retention="90 days",
        compression="gz",
        encoding="utf-8",
        backtrace=True,
        diagnose=True,
    )

    return logger


# 全局 logger 实例
log = logger
