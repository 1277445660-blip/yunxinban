import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Heart, AlertTriangle, Shield } from 'lucide-react';

export default function EmergencyScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-white">
      {/* 顶部栏 */}
      <header className="px-4 pt-11 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">紧急帮助</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
        {/* 图标 */}
        <div className="w-24 h-24 rounded-full bg-warm-50 flex items-center justify-center mb-6 shadow-lg shadow-warm-100">
          <Heart className="w-12 h-12 text-warm-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
          你不需要独自面对
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          如果你正在经历困难时刻，这些资源可以帮助你
        </p>

        {/* 热线按钮 */}
        <a
          href="tel:4001619995"
          className="w-full bg-gradient-to-r from-warm-400 to-warm-500 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-warm-200 active:scale-[0.98] transition-all mb-4"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">400-161-9995</p>
            <p className="text-white/70 text-xs">24小时心理援助热线 · 免费 · 保密</p>
          </div>
        </a>

        {/* 其他资源 */}
        <div className="w-full space-y-3">
          <div className="bg-calm-50 rounded-2xl p-4 border border-calm-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-calm-500" />
              <span className="text-sm font-semibold text-calm-700">学校心理咨询中心</span>
            </div>
            <p className="text-xs text-calm-600/70">工作日 9:00-17:00 · 大学生活动中心 302</p>
            <p className="text-xs text-calm-600/70">预约电话：010-XXXX-XXXX</p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">全国希望24热线</span>
            </div>
            <p className="text-xs text-amber-600/70">400-161-9995（24小时）</p>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-xs text-gray-400 text-center mt-8 px-6">
          请记住，寻求帮助是勇敢的表现。你值得被关心和支持 💙
        </p>
      </div>
    </div>
  );
}
