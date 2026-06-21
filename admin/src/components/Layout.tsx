import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, MessageSquareHeart, Menu, X, CloudSun, Heart,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '数据仪表盘' },
  { to: '/alerts', icon: Bell, label: '预警管理' },
  { to: '/users', icon: Users, label: '用户管理' },
  { to: '/monitor', icon: MessageSquareHeart, label: '聊天监控' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-calm-400 flex items-center justify-center">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">云心伴</h1>
            <p className="text-xs text-gray-400">云端守望心理陪伴系统</p>
          </div>
        </div>

        {/* 导航 */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 底部 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 px-3 py-3 bg-warm-50 rounded-xl">
            <Heart className="w-5 h-5 text-warm-400" />
            <div>
              <p className="text-xs font-medium text-warm-600">心理援助热线</p>
              <p className="text-sm font-bold text-warm-500">400-161-9995</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              <span className="text-xs text-gray-400">系统运行中</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-calm-300 flex items-center justify-center text-white text-xs font-bold">
                管
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
