/**
 * 云心伴 - WebSocket 聊天网关
 * 基于 Socket.IO 的实时通信
 */
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { chatService } from './chat.service';
import { aiClient } from '../../services/aiClient.service';
import { crisisService } from '../crisis/crisis.service';
import { notificationService } from '../../services/notification.service';
import { logger } from '../../utils/logger';

class ChatGateway {
  private io: Server | null = null;
  // 用户 ID → Socket ID 映射
  private userSockets: Map<string, Set<string>> = new Map();
  // Socket ID → 用户信息
  private socketUsers: Map<string, { userId: string; role: string }> = new Map();

  /**
   * 初始化 WebSocket 服务器
   */
  initialize(server: HttpServer): void {
    this.io = new Server(server, {
      path: '/ws/chat',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // 认证中间件
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('未提供认证令牌'));
      }
      try {
        const decoded = jwt.verify(token as string, config.jwt.secret) as any;
        (socket as any).userId = decoded.userId;
        (socket as any).userRole = decoded.role;
        next();
      } catch {
        next(new Error('认证令牌无效'));
      }
    });

    this.io.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket 聊天网关已启动');
  }

  /**
   * 处理新连接
   */
  private handleConnection(socket: Socket): void {
    const userId = (socket as any).userId;
    const role = (socket as any).userRole;

    logger.info('用户已连接', { userId, socketId: socket.id });

    // 记录映射
    this.socketUsers.set(socket.id, { userId, role });
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // 加入个人房间
    socket.join(`user:${userId}`);

    // 如果是辅导员，加入预警监控房间
    if (role === 'counselor' || role === 'admin') {
      socket.join('counselor:alerts');
      logger.info('辅导员加入预警监控', { userId });
    }

    // ---------- 事件处理 ----------

    // 发送聊天消息
    socket.on('chat:message', (data) => this.handleChatMessage(socket, data));

    // 正在输入
    socket.on('chat:typing', (data) => this.handleTyping(socket, data));

    // 开始新会话
    socket.on('chat:start_session', (data) => this.handleStartSession(socket, data));

    // 断开连接
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * 处理聊天消息
   */
  private async handleChatMessage(socket: Socket, data: { sessionId: string; message: string }): Promise<void> {
    const userId = (socket as any).userId;

    if (!data.sessionId || !data.message) {
      socket.emit('chat:error', { message: '参数不完整' });
      return;
    }

    try {
      // 向客户端确认收到消息
      socket.emit('chat:message_sent', {
        sessionId: data.sessionId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      // 调用 AI 服务（流式）
      let fullResponse = '';
      let isCrisis = false;
      let alertId = '';

      await aiClient.chatStream(
        {
          user_id: userId,
          session_id: data.sessionId,
          message: data.message,
          stream: true,
        },
        (chunk) => {
          fullResponse += chunk;
          socket.emit('chat:response', {
            sessionId: data.sessionId,
            content: chunk,
            isStreaming: true,
          });
        },
        (crisisAlertId) => {
          isCrisis = true;
          alertId = crisisAlertId;
        },
      );

      // 流式完成
      socket.emit('chat:response_complete', {
        sessionId: data.sessionId,
        content: fullResponse,
        isCrisis,
        alertId,
      });

      // 如果检测到危机，推送给辅导员
      if (isCrisis) {
        this.sendCrisisAlert(userId, data.sessionId, data.message, fullResponse);
      }

      // 异步保存消息 + 更新记忆
      chatService.sendMessage(userId, data.sessionId, data.message).catch((err) => {
        logger.error('消息保存失败', { error: err.message });
      });

    } catch (error: any) {
      logger.error('聊天消息处理失败', { error: error.message });
      socket.emit('chat:error', { message: '消息处理失败，请重试' });
    }
  }

  /**
   * 推送危机预警给辅导员
   */
  private async sendCrisisAlert(
    userId: string,
    sessionId: string,
    triggerText: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      // 创建预警记录
      const alert = await crisisService.createAlert({
        userId,
        sessionId,
        riskLevel: 'high',
        sentimentScore: 0.2,
        triggerText,
      });

      // 推送给辅导员房间
      this.io?.to('counselor:alerts').emit('crisis:alert', {
        alertId: alert.id,
        userId,
        riskLevel: alert.risk_level,
        triggerTextPreview: triggerText.substring(0, 50),
        timestamp: new Date().toISOString(),
      });

      // 创建通知
      await notificationService.send({
        userId,
        type: 'crisis_alert',
        title: '⚠️ 危机预警',
        content: `系统检测到高风险信号，已通知心理中心。如需立即帮助，请拨打 ${config.crisis.emergencyHotline}`,
      });

      logger.warn('危机预警已推送', { userId, alertId: alert.id });
    } catch (error: any) {
      logger.error('危机预警推送失败', { error: error.message });
    }
  }

  /**
   * 处理正在输入
   */
  private handleTyping(socket: Socket, data: { sessionId: string }): void {
    const userId = (socket as any).userId;
    socket.to(`user:${userId}`).emit('chat:typing', {
      userId,
      sessionId: data.sessionId,
    });
  }

  /**
   * 开始新会话
   */
  private async handleStartSession(socket: Socket, _data: any): Promise<void> {
    const userId = (socket as any).userId;
    try {
      const session = await chatService.createSession(userId);
      socket.emit('chat:session_created', session);
    } catch (error: any) {
      socket.emit('chat:error', { message: '创建会话失败' });
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(socket: Socket): void {
    const userInfo = this.socketUsers.get(socket.id);
    if (userInfo) {
      const sockets = this.userSockets.get(userInfo.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userInfo.userId);
        }
      }
      this.socketUsers.delete(socket.id);
    }
    logger.debug('用户已断开', { socketId: socket.id });
  }

  /**
   * 向指定用户发送消息
   */
  sendToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  /**
   * 向所有辅导员广播预警
   */
  broadcastAlert(data: any): void {
    this.io?.to('counselor:alerts').emit('crisis:alert', data);
  }
}

export const chatGateway = new ChatGateway();
