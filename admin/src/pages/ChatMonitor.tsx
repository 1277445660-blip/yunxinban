import React, { useState } from 'react';
import { MessageSquareHeart, Eye, AlertTriangle, Phone, Wifi, WifiOff } from 'lucide-react';

const mockSessions = [
  { id: 'ses-001', userId: 'u***23', nickname: '张同学', status: 'active', messages: 24, moodTrend: 'declining', moodScore: 0.28, lastMessage: '最近真的很难受...', riskLevel: 'high', time: '进行中 · 15分钟' },
  { id: 'ses-002', userId: 'u***45', nickname: '李同学', status: 'active', messages: 8, moodTrend: 'stable', moodScore: 0.55, lastMessage: '谢谢你的建议', riskLevel: 'low', time: '进行中 · 5分钟' },
  { id: 'ses-003', userId: 'u***87', nickname: '王同学', status: 'active', messages: 35, moodTrend: 'declining', moodScore: 0.22, lastMessage: '我觉得没人理解我...', riskLevel: 'high', time: '进行中 · 28分钟' },
  { id: 'ses-004', userId: 'u***12', nickname: '陈同学', status: 'escalated', messages: 42, moodTrend: 'critical', moodScore: 0.12, lastMessage: '对不起...', riskLevel: 'critical', time: '已升级 · 10分钟前' },
  { id: 'ses-005', userId: 'u***56', nickname: '刘同学', status: 'active', messages: 5, moodTrend: 'improving', moodScore: 0.68, lastMessage: '感觉好多了', riskLevel: 'low', time: '进行中 · 3分钟' },
];

const moodConfig: Record<string, { color: string; icon: string }> = {
  improving: { color: 'text-green-500', icon: '📈' },
  stable: { color: 'text-gray-400', icon: '➡️' },
  declining: { color: 'text-orange-500', icon: '📉' },
  critical: { color: 'text-red-600', icon: '🚨' },
};

const riskBorder: Record<string, string> = {
  low: 'border-l-green-400',
  mild: 'border-l-yellow-400',
  moderate: 'border-l-orange-400',
  high: 'border-l-red-400',
  critical: 'border-l-red-700',
};

export default function ChatMonitor() {
  const [sessions] = useState(mockSessions);
  const [isConnected] = useState(true);

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const crisisCount = sessions.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">聊天监控</h2>
          <p className="text-sm text-gray-400 mt-1">实时监控 AI 陪伴会话</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> 实时连接
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> 已断开
            </span>
          )}
          <span className="text-xs text-gray-400">{activeCount} 个活跃会话</span>
          {crisisCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> {crisisCount} 个需关注
            </span>
          )}
        </div>
      </div>

      {/* 会话列表 */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const mood = moodConfig[session.moodTrend];
          return (
            <div
              key={session.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-50 border-l-4 hover:shadow-md transition-all ${riskBorder[session.riskLevel]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 头部信息 */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'active' ? 'bg-green-400 animate-pulse-dot' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">{session.nickname}</span>
                      <span className="text-xs text-gray-400 font-mono">{session.userId}</span>
                    </div>
                    <span className={`text-xs ${mood.color}`}>
                      {mood.icon} 情绪: {session.moodScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">{session.messages} 条消息</span>
                  </div>

                  {/* 最后消息 */}
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic mb-2">
                    "{session.lastMessage}"
                  </p>

                  {/* 底部信息 */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{session.time}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquareHeart className="w-3 h-3" />
                      会话 {session.id}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="查看详情">
                    <Eye className="w-4 h-4" />
                  </button>
                  {session.riskLevel === 'critical' && (
                    <button className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="紧急干预">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                  <div className="h-8 w-px bg-gray-100" />
                  <button className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    session.status === 'escalated'
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}>
                    {session.status === 'escalated' ? '已升级' : '查看干预'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 实时连接提示 */}
      <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
        <MessageSquareHeart className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          WebSocket 实时监听中...
        </p>
        <p className="text-xs text-gray-300 mt-1">
          新的高危会话将自动出现在此列表中
        </p>
      </div>
    </div>
  );
}
