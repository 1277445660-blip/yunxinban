import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Send, Mic, Cloud, CloudRain, Sun, CloudSun, MoreHorizontal } from 'lucide-react';
import { useChatStore, sendMockMessage } from '../store/chatStore';

// 情绪 → 天气图标映射
function MoodIndicator({ score }: { score: number }) {
  if (score >= 0.7) return <Sun className="w-5 h-5 text-amber-400" />;
  if (score >= 0.5) return <CloudSun className="w-5 h-5 text-blue-300" />;
  if (score >= 0.3) return <Cloud className="w-5 h-5 text-gray-400" />;
  return <CloudRain className="w-5 h-5 text-blue-500" />;
}

function MoodBar({ score }: { score: number }) {
  const colors = score >= 0.7 ? 'from-green-400 to-primary-400' :
                  score >= 0.5 ? 'from-primary-300 to-calm-300' :
                  score >= 0.3 ? 'from-yellow-300 to-orange-300' :
                  'from-orange-400 to-warm-400';
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-20">
      <div className={`h-full bg-gradient-to-r ${colors} rounded-full transition-all duration-700`}
           style={{ width: `${Math.max(score * 100, 5)}%` }} />
    </div>
  );
}

export default function ChatScreen() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { messages, isTyping, isCrisis, moodScore, moodTrend } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 首次进入自动发送话题引导消息
  useEffect(() => {
    if (messages.length === 0 && topicId) {
      const topicMap: Record<string, string> = {
        academic: '最近学习压力好大，感觉怎么努力都跟不上节奏',
        relationship: '最近和朋友/恋人之间有些矛盾，心情很不好',
        late_night: '深夜了，突然感觉好孤单，睡不着觉',
        future_anxiety: '对未来感到很迷茫，不知道毕业后该怎么办',
        family: '家里有些事情让我很困扰，不知道该怎么处理',
        self_esteem: '总觉得自己不够好，做什么都比不上别人',
        stress: '各种事情堆在一起，感觉快喘不过气了',
        loneliness: '虽然身边有人，但总觉得很孤独，没人真正理解我',
      };
      const msg = topicMap[topicId];
      if (msg) {
        sendMockMessage(msg, topicId);
      }
    }
  }, [topicId]);

  // 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    await sendMockMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const topicLabel = topicId ? {
    academic: '学业压力', relationship: '人际困扰', late_night: '深夜emo',
    future_anxiety: '未来迷茫', family: '家庭问题', self_esteem: '自我怀疑',
    stress: '日常压力', loneliness: '孤独感',
  }[topicId] : 'AI 心理陪伴';

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-white relative">
      {/* 顶部栏 */}
      <header className="bg-white border-b border-gray-50 px-4 pt-11 pb-3 flex items-center gap-3 z-10 shadow-sm">
        <button onClick={() => navigate('/')} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-50">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-calm-400 flex items-center justify-center shadow-sm flex-shrink-0">
            <CloudSun className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-800">小云</span>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                AI 心理陪伴师
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <MoodIndicator score={moodScore} />
              <MoodBar score={moodScore} />
              <span className="text-[10px] text-gray-400">
                {moodTrend === 'improving' ? '情绪在好转 🌱' :
                 moodTrend === 'declining' ? '需要关注 🫂' : '平稳中'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isCrisis && (
            <button
              onClick={() => navigate('/emergency')}
              className="px-3 py-1.5 bg-warm-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse-glow"
            >
              <Phone className="w-3 h-3" />
              SOS
            </button>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-50">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* 聊天消息区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f8fafc]">
        {/* 日期分隔 */}
        <div className="text-center">
          <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* 开场提示 */}
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-8 animate-fadeIn">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-sm text-gray-500 mb-1">我是小云，你的 AI 心理陪伴师</p>
            <p className="text-xs text-gray-400">在这里你可以安全地表达任何感受</p>
            <p className="text-xs text-gray-400">我会认真倾听，不评判 💙</p>
            {topicLabel && (
              <div className="mt-4 inline-block px-3 py-1.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">
                💬 话题：{topicLabel}
              </div>
            )}
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-300 to-calm-400 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <CloudSun className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[78%] ${msg.role === 'user' ? 'order-0' : ''}`}>
              <div className={
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-2xl rounded-tr-md px-4 py-2.5 shadow-sm shadow-primary-200'
                  : msg.content.includes('400-161-9995')
                    ? 'bg-warm-50 text-gray-700 rounded-2xl rounded-tl-md px-4 py-3 border border-warm-200 shadow-sm'
                    : 'bg-white text-gray-700 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm border border-gray-50'
              }>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className={`text-[10px] text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 mt-1">
                我
              </div>
            )}
          </div>
        ))}

        {/* 正在输入 */}
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-300 to-calm-400 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <CloudSun className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3 shadow-sm border border-gray-50">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-end gap-2" style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}>
        <button className="p-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
          <Mic className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么吧..."
            rows={1}
            className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 resize-none outline-none max-h-24"
            style={{ minHeight: '24px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${
            input.trim()
              ? 'bg-primary-500 text-white shadow-md shadow-primary-200 active:scale-95'
              : 'bg-gray-100 text-gray-300'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
