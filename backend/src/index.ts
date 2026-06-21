/**
 * 云心伴 - Node.js 主服务入口
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { mongoClient } from './database/mongodb/client';

// 路由
import { authRoutes } from './modules/auth/auth.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { crisisRoutes } from './modules/crisis/crisis.routes';
import { userRoutes } from './modules/user/user.routes';

// WebSocket
import { chatGateway } from './modules/chat/chat.gateway';

// 中间件
import { apiLimiter } from './middleware/rateLimiter.middleware';

const app = express();
const server = http.createServer(app);

// ---------- 全局中间件 ----------
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('short'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 全局限流
app.use('/api/', apiLimiter);

// ---------- 路由注册 ----------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/crisis', crisisRoutes);
app.use('/api/v1/user', userRoutes);

// ---------- 健康检查 ----------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'yunxinban-backend', version: '0.1.0' });
});

// ---------- 404 ----------
app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ---------- 全局错误处理 ----------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('未捕获错误', { error: err.message, stack: err.stack });
  res.status(500).json({ error: '服务器内部错误' });
});

// ---------- 启动 ----------
async function start(): Promise<void> {
  try {
    // 连接 MongoDB
    await mongoClient.connect();
    logger.info('MongoDB 已连接');

    // 启动 WebSocket
    chatGateway.initialize(server);

    // 启动 HTTP
    server.listen(config.app.port, () => {
      logger.info(`🚀 ${config.app.name} 已启动: http://localhost:${config.app.port}`);
      logger.info(`   WebSocket: ws://localhost:${config.app.port}/ws/chat`);
      logger.info(`   环境: ${config.app.env}`);
    });

    // 优雅退出
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM 信号，正在关闭...');
      await mongoClient.close();
      server.close(() => process.exit(0));
    });
  } catch (error: any) {
    logger.error('启动失败', { error: error.message });
    process.exit(1);
  }
}

start();
