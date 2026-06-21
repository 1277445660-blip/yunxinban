import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, FileText, Bell, Moon, HelpCircle, LogOut, ChevronRight, Heart, Phone, Trash2 } from 'lucide-react';

export default function ProfileScreen() {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: '隐私与安全',
      items: [
        { icon: Shield, label: '隐私设置', desc: '管理数据授权和加密', color: 'text-blue-500' },
        { icon: FileText, label: '隐私政策', desc: '了解我们如何保护你的数据', color: 'text-green-500' },
        { icon: Trash2, label: '数据清除', desc: '导出或彻底删除你的数据', color: 'text-gray-400' },
      ],
    },
    {
      title: '设置',
      items: [
        { icon: Bell, label: '通知设置', desc: '管理消息推送', color: 'text-orange-400' },
        { icon: Moon, label: '深色模式', desc: '切换界面主题', color: 'text-indigo-400' },
        { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题和意见反馈', color: 'text-gray-400' },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-[#f8fafc]">
      {/* 顶部栏 */}
      <header className="bg-white px-4 pt-11 pb-3 flex items-center gap-3 border-b border-gray-50">
        <button onClick={() => navigate('/')} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">个人中心</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 用户卡片 */}
        <div className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-300 to-calm-400 flex items-center justify-center shadow-md shadow-primary-200">
              <span className="text-2xl text-white font-bold">张</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">张同学</h2>
              <p className="text-xs text-gray-400 mt-0.5">大三 · 计算机学院</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">
                  🟢 情绪良好
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full font-medium">
                  已陪伴 12 天
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </div>

        {/* 紧急求助 */}
        <button
          onClick={() => navigate('/emergency')}
          className="mx-4 mt-4 bg-gradient-to-r from-warm-400 to-warm-500 rounded-2xl p-4 flex items-center gap-4 shadow-md shadow-warm-200 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-white font-semibold text-sm">紧急心理援助</p>
            <p className="text-white/70 text-xs">24小时热线：400-161-9995</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>

        {/* 菜单分组 */}
        {menuSections.map((section) => (
          <div key={section.title} className="mt-5 px-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-1 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                    i < section.items.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 退出登录 */}
        <div className="px-4 mt-5 mb-8">
          <button className="w-full py-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-warm-500 transition-colors">
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
