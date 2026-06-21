import React, { useState } from 'react';
import { Users, Search, Shield, GraduationCap, UserX, MoreVertical } from 'lucide-react';

const mockUsers = [
  { id: 'u001', nickname: '张同学', role: 'student', grade: '大三', college: '计算机学院', riskLevel: 'low', sessions: 12, lastActive: '10分钟前' },
  { id: 'u002', nickname: '李同学', role: 'student', grade: '大二', college: '文学院', riskLevel: 'high', sessions: 45, lastActive: '5分钟前' },
  { id: 'u003', nickname: '王同学', role: 'student', grade: '大一', college: '经管学院', riskLevel: 'moderate', sessions: 28, lastActive: '1小时前' },
  { id: 'u004', nickname: '赵同学', role: 'student', grade: '大四', college: '法学院', riskLevel: 'critical', sessions: 67, lastActive: '刚刚' },
  { id: 'u005', nickname: '李老师', role: 'counselor', grade: '-', college: '心理中心', riskLevel: 'low', sessions: 0, lastActive: '昨天' },
  { id: 'u006', nickname: '王老师', role: 'counselor', grade: '-', college: '心理中心', riskLevel: 'low', sessions: 0, lastActive: '3小时前' },
  { id: 'u007', nickname: '陈同学', role: 'student', grade: '大三', college: '计算机学院', riskLevel: 'low', sessions: 8, lastActive: '2天前' },
  { id: 'u008', nickname: '刘同学', role: 'student', grade: '大二', college: '外语学院', riskLevel: 'mild', sessions: 22, lastActive: '30分钟前' },
];

const riskBadge: Record<string, string> = {
  low: 'bg-green-50 text-green-600 border-green-200',
  mild: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  moderate: 'bg-orange-50 text-orange-600 border-orange-200',
  high: 'bg-red-50 text-red-600 border-red-200',
  critical: 'bg-red-100 text-red-700 border-red-300',
};

const riskLabel: Record<string, string> = {
  low: '🟢 低风险',
  mild: '🟡 轻度',
  moderate: '🟠 中度',
  high: '🔴 高危',
  critical: '⚫ 极危',
};

export default function UserManagement() {
  const [users] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.nickname.includes(search) && !u.college.includes(search)) return false;
    return true;
  });

  const highRiskCount = users.filter((u) => u.riskLevel === 'high' || u.riskLevel === 'critical').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
          <p className="text-sm text-gray-400 mt-1">管理学生和咨询师账号</p>
        </div>
        <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
          {highRiskCount} 名高风险用户
        </span>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="搜索昵称或学院..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'student', 'counselor'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                roleFilter === r ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {r === 'all' ? '全部' : r === 'student' ? '学生' : '咨询师'}
            </button>
          ))}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">用户</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">角色</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">年级/学院</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">风险等级</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">会话数</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">最近活跃</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.role === 'counselor'
                          ? 'bg-calm-100 text-calm-600'
                          : 'bg-primary-100 text-primary-600'
                      }`}>
                        {user.nickname[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{user.nickname}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      user.role === 'counselor'
                        ? 'bg-calm-50 text-calm-600'
                        : 'bg-sand-200 text-sand-700'
                    }`}>
                      {user.role === 'counselor' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                      {user.role === 'counselor' ? '咨询师' : '学生'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.grade} · {user.college}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${riskBadge[user.riskLevel]}`}>
                      {riskLabel[user.riskLevel]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.sessions}</td>
                  <td className="px-6 py-4 text-xs text-gray-400">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
