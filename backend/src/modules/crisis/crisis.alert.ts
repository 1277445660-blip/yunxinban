/**
 * 云心伴 - 分级预警推送
 * 根据风险等级执行不同的通知策略
 */
import { notificationService } from '../../services/notification.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export enum AlertLevel {
  YELLOW = 'yellow',   // 🟡 轻度
  ORANGE = 'orange',   // 🟠 中度
  RED = 'red',         // 🔴 高危
  BLACK = 'black',     // ⚫ 极危
}

interface AlertPayload {
  userId: string;
  level: AlertLevel;
  title: string;
  content: string;
  sessionId?: string;
}

/**
 * 分级预警推送处理
 */
export async function dispatchAlert(payload: AlertPayload): Promise<void> {
  const { userId, level, title, content, sessionId } = payload;

  logger.warn(`预警分发: ${level}`, { userId, title });

  switch (level) {
    case AlertLevel.YELLOW:
      // 🟡 轻度：推送自助资源通知
      await notificationService.send({
        userId,
        type: 'system',
        title: '💛 情绪关怀',
        content: '我们注意到你最近可能有些情绪波动。这里有一些自助调节资源，希望对你有帮助。',
      });
      break;

    case AlertLevel.ORANGE:
      // 🟠 中度：通知辅导员关注
      await notificationService.send({
        userId,
        type: 'crisis_alert',
        title: '🧡 需要关注',
        content: `你的情绪状态似乎需要一些关注。${content}`,
      });
      // TODO: 通知辅导员
      logger.info('中度预警：建议通知辅导员', { userId, sessionId });
      break;

    case AlertLevel.RED:
      // 🔴 高危：通知心理中心 + 触发干预工单
      await notificationService.send({
        userId,
        type: 'crisis_alert',
        title: '❤️ 紧急支持',
        content: `我们非常关心你现在的状态。请考虑联系心理中心获得专业帮助。紧急热线：${config.crisis.emergencyHotline}`,
      });
      logger.warn('高危预警：需要立即干预', { userId, sessionId });
      break;

    case AlertLevel.BLACK:
      // ⚫ 极危：紧急协议
      await notificationService.send({
        userId,
        type: 'crisis_alert',
        title: '🖤 紧急援助',
        content: `请立即拨打心理援助热线：${config.crisis.emergencyHotline}。你不需要独自面对，有人可以帮助你。`,
      });
      logger.error('极危预警：启动紧急协议', { userId, sessionId });
      // TODO: 自动拨打紧急联系人
      break;
  }
}
