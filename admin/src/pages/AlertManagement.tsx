import React, { useState } from 'react';
import {
  Bell, Search, Filter, ChevronDown, Phone, UserCheck, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';

const mockAlerts = [
  { id: 'ALT-001', userId: 'u***23', riskLevel: 'critical', type: 'suicide', score: 0.92, status: 'pending', time: '5分钟前', trigger: '我不想活了...', counselor: null },
  { id: 'ALT-002', userId: 'u***45', riskLevel: 'high', type: 'self_harm', score: 0.83, status: 'acknowledged', time: '30分钟前', trigger: '我想伤害自己...', counselor: '李老师' },
  { id: 'ALT-003', userId: 'u***87', riskLevel: 'high', type: 'severe_depression', score: 0.78, status: 'pending', time: '1小时前', trigger: '对一切都失去兴趣...', counselor: null },
  { id: 'ALT-004', userId: 'u***12', riskLevel: 'moderate', type: 'other', score: 0.62, status: 'escalated', time: '2小时前', trigger: '感觉快崩溃了...', counselor: '王老师' },
  { id: 'ALT-005', userId: 'u***56', riskLevel: 'moderate', type: 'panic_attack', score: 0.58, status: 'resolved', time: '昨天', trigger: '突然心慌...', counselor: '张老师' },
  { id: 'ALT-006', userId: 'u***34', riskLevel: 'high', type: 'suicide', score: 0.81, status: 'acknowledged', time: '昨天', trigger: '活着好累...', counselor: '李老师' },
  { id: 'ALT-007', userId: 'u***90', riskLevel: 'mild', type: 'other', score: 0.42, status: 'pending', time: '2天前', trigger: '最近压力很大...', counselor: null },
];

const riskConfig: Record<string, { color: string; label: string; bg: string }> = {
  critical: { color: 'text-red-700', label: '⚫ 极危', bg: 'bg-red-50 border-red-200' },
  high: { color: 'text-red-600', label: '🔴 高危', bg: 'bg-red-50 border-red-200' },
  moderate: { color: 'text-orange-600', label: '🟠 中度', bg: 'bg-orange-50 border-orange-200' },
  mild: { color: 'text-yellow-600', label: '🟡 轻度', bg: 'bg-yellow-50 border-yellow-200' },
};

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-red-100 text-red-700', label: '待处理', icon: <Clock className="w-3 h-3" /> },
  acknowledged: { color: 'bg-blue-100 text-blue-700', label: '已确认', icon: <UserCheck className="w-3 h-3" /> },
  escalated: { color: 'bg-orange-100 text-orange-700', label: '已升级', icon: <AlertTriangle className="w-3 h-3" /> },
  resolved: { color: 'bg-green-100 text-green-700', label: '已解决', icon: <CheckCircle className="w-3 h-3" /> },
};

export default function AlertManagement() {
  const [alerts] = useState(mockAlerts);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = alerts.filter((a) => {
    if (filter !== 'all' && a.riskLevel !== filter) return false;
    if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.trigger.includes(search)) return false;
    return true;
  });

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const criticalCount = alerts.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">预警管理</h2>
          <p className="text-sm text-gray-400 mt-1">实时监控和管理危机预警</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {pendingCount} 条待处理
          </span>
          <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
            {criticalCount} 条高危
          </span>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="搜索预警ID或内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'moderate', 'mild'].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === level
                  ? 'bg-primary-100 text-primary-700 shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {level === 'all' ? '全部' :
               level === 'critical' ? '极危' :
               level === 'high' ? '高危' :
               level === 'moderate' ? '中度' : '轻度'}
            </button>
          ))}
        </div>
      </div>

      {/* 预警列表 */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const risk = riskConfig[alert.riskLevel];
          const status = statusConfig[alert.status];
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-all ${risk.bg.split(' ')[1]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${risk.color}`}>{risk.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">评分: {alert.score.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    用户 <span className="font-mono text-gray-400">{alert.userId}</span>
                  </p>
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">
                    "{alert.trigger}"
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                    <span>类型: {alert.type}</span>
                    {alert.counselor && <span>👤 已分配: {alert.counselor}</span>}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2">
                  {alert.status === 'pending' && (
                    <>
                      <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        接警
                      </button>
                      <button className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        紧急联系
                      </button>
                    </>
                  )}
                  {alert.status === 'acknowledged' && (
                    <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors">
                      升级处理
                    </button>
                  )}
                  {alert.status === 'escalated' && (
                    <button className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      标记解决
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
