import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, MessageCircle, Heart, User, Phone, ChevronRight, Sparkles, Moon, BookOpen, Users, Compass, Home, Zap, Puzzle } from 'lucide-react';

const quickTopics = [
  { id: 'academic', label: '学业压力', emoji: '📚', icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
  { id: 'relationship', label: '人际困扰', emoji: '💔', icon: Users, color: 'bg-rose-50 text-rose-500' },
  { id: 'late_night', label: '深夜emo', emoji: '🌙', icon: Moon, color: 'bg-indigo-50 text-indigo-500' },
  { id: 'future_anxiety', label: '未来迷茫', emoji: '🔮', icon: Compass, color: 'bg-purple-50 text-purple-500' },
  { id: 'family', label: '家庭问题', emoji: '🏠', icon: Home, color: 'bg-teal-50 text-teal-600' },
  { id: 'self_esteem', label: '自我怀疑', emoji: '🪞', icon: Sparkles, color: 'bg-pink-50 text-pink-500' },
  { id: 'stress', label: '日常压力', emoji: '😰', icon: Zap, color: 'bg-orange-50 text-orange-500' },
  { id: 'loneliness', label: '孤独感', emoji: '🧩', icon: Puzzle, color: 'bg-sky-50 text-sky-500' },
];

const recentChats = [
  { id: '1', title: '最近的情绪困扰', preview: '谢谢你的建议，我会试试...', time: '10分钟前', mood: 'declining', unread: 1 },
  { id: '2', title: '期末考试焦虑', preview: '今天按照你说的做了深呼吸...', time: '昨天', mood: 'improving', unread: 0 },
  { id: '3', title: '和室友的矛盾', preview: '后来我们好好谈了一次...', time: '2天前', mood: 'stable', unread: 0 },
];

const moodBadge: Record<string, string> = {
  improving: 'bg-green-100 text-green-600',
  stable: 'bg-gray-100 text-gray-500',
  declining: 'bg-orange-100 text-orange-600',
};

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-[#f8fafc]">
      {/* 顶部栏 */}
      <header className="bg-gradient-to-b from-calm-50 to-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-calm-400 flex items-center justify-center shadow-md shadow-primary-200">
              <CloudSun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">云心伴</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5">AI 心理陪伴助手</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/emergency')}
              className="px-3.5 py-2 bg-warm-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-warm-200 animate-pulse-glow hover:bg-warm-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              SOS
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            >
              <User className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 情绪问候卡片 */}
        <div className="bg-gradient-to-r from-primary-400 via-primary-500 to-calm-500 rounded-2xl p-4 text-white shadow-lg shadow-primary-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs mb-1">下午好 ☀️</p>
              <p className="text-sm font-medium">今天感觉怎么样？</p>
              <p className="text-white/60 text-xs mt-1">我在这里，随时可以陪你聊聊</p>
            </div>
            <div className="text-4xl">🌱</div>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* 快捷话题 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary-400" />
            选一个话题开始吧
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            {quickTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/chat/${topic.id}`)}
                className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150"
              >
                <span className="text-2xl">{topic.emoji}</span>
                <span className="text-[11px] text-gray-500 font-medium leading-tight text-center">
                  {topic.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 最近对话 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-calm-400" />
              最近对话
            </h2>
            <button className="text-xs text-primary-500 font-medium">查看全部</button>
          </div>
          <div className="space-y-2">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-all text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-calm-100 to-primary-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-700">{chat.title}</span>
                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${moodBadge[chat.mood]}`}>
                      {chat.mood === 'improving' ? '📈 改善中' : chat.mood === 'declining' ? '📉 需关注' : '➡️ 平稳'}
                    </span>
                    <p className="text-xs text-gray-400 truncate">{chat.preview}</p>
                  </div>
                </div>
                {chat.unread > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-warm-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* 底部安全区 */}
        <div className="h-20" />
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 px-6 py-2 flex items-center justify-around z-50" style={{ paddingBottom: 'calc(0.5rem + var(--safe-bottom))' }}>
        {[
          { icon: MessageCircle, label: '聊天', path: '/' },
          { icon: Heart, label: '陪伴', path: '/chat' },
          { icon: User, label: '我的', path: '/profile' },
        ].map((item) => {
          const isActive = (item.path === '/' && window.location.pathname === '/') ||
                          (item.path !== '/' && window.location.pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
                isActive ? 'text-primary-500' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
