import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, AlertTriangle, MessageCircle, Bell,
  TrendingUp, TrendingDown, Minus, Heart, Activity,
} from 'lucide-react';

// 模拟数据（实际应从 API 获取）
const mockStats = {
  totalUsers: 2847,
  activeUsersToday: 342,
  totalSessions: 12580,
  activeAlerts: 12,
  highRiskUsers: 47,
  avgMoodScore: 0.62,
  moodTrend: 'improving',
  weeklySessions: [120, 145, 132, 168, 156, 180, 142],
  alertDistribution: [
    { level: 'low', count: 85, color: 'bg-green-400' },
    { level: 'mild', count: 43, color: 'bg-yellow-400' },
    { level: 'moderate', count: 28, color: 'bg-orange-400' },
    { level: 'high', count: 10, color: 'bg-red-400' },
    { level: 'critical', count: 2, color: 'bg-red-700' },
  ],
  recentAlerts: [
    { id: '1', level: 'high', userId: 'u***23', time: '10分钟前', preview: '检测到高风险信号...' },
    { id: '2', level: 'moderate', userId: 'u***87', time: '25分钟前', preview: '情绪持续下降趋势...' },
    { id: '3', level: 'high', userId: 'u***45', time: '1小时前', preview: '自伤意图关键词触发...' },
  ],
};

const getMoodIcon = (trend: string) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const getRiskColor = (level: string) => {
  const map: Record<string, string> = {
    low: 'bg-green-50 text-green-700 border-green-200',
    mild: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    moderate: 'bg-orange-50 text-orange-700 border-orange-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };
  return map[level] || map.low;
};

export default function Dashboard() {
  const [stats] = useState(mockStats);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">数据仪表盘</h2>
        <p className="text-sm text-gray-400 mt-1">校园心理健康数据概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="总用户数"
          value={stats.totalUsers.toLocaleString()}
          sub={`今日活跃 ${stats.activeUsersToday}`}
          color="bg-primary-50 text-primary-600"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="总会话数"
          value={stats.totalSessions.toLocaleString()}
          sub="累计 AI 陪伴对话"
          color="bg-calm-50 text-calm-600"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="活跃预警"
          value={stats.activeAlerts.toString()}
          sub={`高风险用户 ${stats.highRiskUsers}`}
          color="bg-warm-50 text-warm-500"
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="平均情绪分"
          value={stats.avgMoodScore.toFixed(2)}
          sub={
            <span className="flex items-center gap-1">
              {getMoodIcon(stats.moodTrend)}
              趋势良好
            </span>
          }
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* 预警分布 + 近期预警 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 预警等级分布 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            本月预警等级分布
          </h3>
          <div className="space-y-3">
            {stats.alertDistribution.map((item) => (
              <div key={item.level} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-16">
                  {item.level === 'low' ? '🟢 低风险' :
                   item.level === 'mild' ? '🟡 轻度' :
                   item.level === 'moderate' ? '🟠 中度' :
                   item.level === 'high' ? '🔴 高危' : '⚫ 极危'}
                </span>
                <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${(item.count / 168) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-8">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 近期预警列表 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-warm-400" />
            近期预警
          </h3>
          <div className="space-y-3">
            {stats.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${getRiskColor(alert.level)}`}>
                  {alert.level === 'high' ? '高危' :
                   alert.level === 'moderate' ? '中度' :
                   alert.level === 'critical' ? '极危' : '关注'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{alert.preview}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    用户 {alert.userId} · {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 周会话趋势 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-calm-400" />
          本周会话量趋势
        </h3>
        <div className="flex items-end gap-3 h-32">
          {stats.weeklySessions.map((count, i) => {
            const days = ['一', '二', '三', '四', '五', '六', '日'];
            const maxCount = Math.max(...stats.weeklySessions);
            const height = (count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-500">{count}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary-400 to-calm-300 transition-all duration-300"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-400 mt-1">周{days[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
