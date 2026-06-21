# ☁️ 云心伴（云端守望心理陪伴系统）

> 高校心理健康 SaaS 平台 — AI 陪伴 + 危机预警 + 心理测评 + 资源导航一体化

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org)

---

## 📖 项目简介

云心伴是一款面向高校的心理健康 SaaS 平台，融合 AI 智能陪伴、隐形危机预警、专业心理测评和校园资源导航四大核心能力，为大学生提供 7×24 小时心理支持，为辅导员和心理中心提供数据驱动的决策辅助。

### 核心价值

- **学生端**：随时随地的 AI 心理陪伴、情绪疏导、专业自评、资源导航
- **辅导员端**：实时危机预警、学生风险分级、干预工单管理
- **心理中心端**：群体心理健康趋势分析、咨询资源统筹

---

## 🏗️ 技术架构

```
┌──────────────┐  ┌──────────────┐
│  React Native │  │  React Admin │   前端层
│  (移动端)     │  │  (管理后台)   │
└──────┬───────┘  └──────┬───────┘
       └────────┬────────┘
                │ REST/WebSocket
       ┌────────▼────────┐
       │  API Gateway     │          网关层
       └────────┬────────┘
    ┌───────────┼───────────┐
┌───▼───┐ ┌────▼────┐ ┌───▼────┐
│Node.js│ │Python   │ │Redis   │   服务层
│主服务  │ │AI 微服务│ │缓存    │
└───┬───┘ └────┬────┘ └────────┘
┌───▼───┐ ┌───▼────┐
│PostgreSQL│ │MongoDB │             数据层
└─────────┘ └────────┘
```

| 层级 | 技术 | 说明 |
|------|------|------|
| 移动端 | React Native | 跨平台 iOS/Android |
| 管理后台 | React + TypeScript | 辅导员/管理员 Web 端 |
| 主服务 | Node.js + Express | REST API + WebSocket |
| AI 服务 | Python + FastAPI | LLM 对话 + 情感分析 + 危机检测 |
| 数据库 | PostgreSQL + MongoDB | 结构化数据 + 会话日志 |
| 缓存 | Redis | 会话缓存 + 限流 |
| 部署 | Docker + Kubernetes | 容器化弹性部署 |

---

## 🚀 快速开始

### 前置要求

- Node.js ≥ 20.x
- Python ≥ 3.10
- Docker & Docker Compose
- pnpm / npm

### 1. 克隆项目

```bash
git clone <repo-url>
cd 云心伴
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际配置（数据库密码、AI API Key 等）
```

### 3. 启动基础设施

```bash
docker-compose -f docker/docker-compose.yml up -d
# 启动 PostgreSQL + MongoDB + Redis
```

### 4. 启动 AI 服务

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. 启动后端服务

```bash
cd backend
pnpm install
pnpm dev
```

### 6. 启动管理后台

```bash
cd admin
pnpm install
pnpm dev
```

### 7. 启动移动端

```bash
cd mobile
pnpm install
npx react-native start
```

---

## 📁 项目结构

```
云心伴/
├── mobile/           # React Native 移动端
├── admin/            # React 管理后台
├── backend/          # Node.js 主服务
├── ai-service/       # Python AI 微服务
├── docker/           # Docker 部署配置
├── docs/             # 技术文档
├── .env.example      # 环境变量模板
└── README.md
```

---

## 🔒 安全与隐私

- **数据分级加密**：L3 核心数据 AES-256-GCM + KMS 双重保护
- **身份脱敏**：学号/手机号仅存储 SHA-256 哈希
- **隐私合规**：遵循《个人信息保护法》，首次启动隐私政策弹窗
- **审计日志**：全程记录敏感操作，不可篡改
- **TLS 1.3**：全链路传输加密

---

## 📋 开发优先级

| 优先级 | 模块 | 状态 |
|--------|------|------|
| P0 | AI 陪伴聊天 + 安全护栏 | 🚧 开发中 |
| P0 | 危机预警引擎 | 🚧 开发中 |
| P1 | 心理测评系统 | 📋 规划中 |
| P1 | 预约咨询功能 | 📋 规划中 |
| P2 | 数据可视化报告 | 📋 规划中 |
| P2 | 管理后台完整功能 | 📋 规划中 |

---

## 👥 目标用户

- **大学生**：AI 心理陪伴、情绪疏导、专业自评
- **辅导员**：危机预警接收、学生风险监控、干预追踪
- **心理中心老师**：全校心理健康趋势、咨询资源管理

---

## 📄 License

MIT © 2026 云心伴 Team
