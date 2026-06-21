"""
云心伴 - 健康检查 API
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any

from ..services.companion import AICompanion
from .dependencies import get_companion

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health_check():
    """基础健康检查"""
    return {
        "status": "ok",
        "service": "yunxinban-ai-service",
        "version": "0.1.0",
    }


@router.get("/api/health/detailed")
async def health_check_detailed(
    companion: AICompanion = Depends(get_companion),
):
    """详细健康检查（含 LLM 可用性）"""
    companion_status = await companion.health_check()

    return {
        "status": "ok",
        "service": "yunxinban-ai-service",
        "version": "0.1.0",
        "components": {
            "companion": companion_status,
        },
    }


@router.get("/api/health/ready")
async def readiness_check():
    """就绪检查（Kubernetes readiness probe）"""
    return {"status": "ready"}


@router.get("/api/health/live")
async def liveness_check():
    """存活检查（Kubernetes liveness probe）"""
    return {"status": "alive"}
