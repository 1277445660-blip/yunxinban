# ============================================
# 云心伴 - AI 服务 Dockerfile
# ============================================

FROM python:3.11-slim

LABEL app="yunxinban-ai-service"
LABEL description="云心伴 AI 心理陪伴微服务"

WORKDIR /app

# 系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 应用代码
COPY . .

# 创建非 root 用户
RUN useradd -m -u 1000 yxb && chown -R yxb:yxb /app
USER yxb

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
