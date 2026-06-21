import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  sessionId: string | null;
  moodScore: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  isTyping: boolean;
  isCrisis: boolean;
  addMessage: (msg: Message) => void;
  setTyping: (v: boolean) => void;
  setSessionId: (id: string) => void;
  setMood: (score: number, trend: 'improving' | 'stable' | 'declining') => void;
  setCrisis: (v: boolean) => void;
}

// 模拟 AI 回复
const mockReplies: Record<string, string> = {
  academic: '我能理解你的感受，学业压力确实是大学生最常见的困扰之一 📚\n\n你愿意和我具体聊聊是哪方面让你觉得有压力吗？是考试、论文还是课程难度？有时候把问题说出来，本身就能让心里轻松一些。\n\n我也可以和你分享一些时间管理和缓解考试焦虑的小技巧 🌱',
  relationship: '人际关系中的矛盾确实会让人很消耗 💔\n\n首先我想说，你的感受是合理的，不需要否定它。关系中的摩擦其实也是一种沟通的机会。\n\n你愿意和我多说说是发生了什么事吗？把具体情况捋一捋，也许能帮你看到一些之前没注意到的角度 🌿',
  late_night: '深夜的情绪总是格外敏感，很多人都会有这种感觉 🌙\n\n你现在是一个人在宿舍吗？如果方便的话，可以试试这几个放松方法：\n\n🌬️ 做几次深呼吸，吸气4秒、屏息4秒、呼气6秒\n☕ 喝杯温水\n📱 听一首舒缓的音乐\n\n我在这里陪着你，你不是一个人 💙',
  future_anxiety: '对未来感到迷茫是非常正常的情绪，尤其是在大学这个阶段 🔮\n\n其实很少有人能在20岁左右就完全看清未来的方向。你可以试着把"未来"这个大问题拆成小问题：\n\n✨ 这学期你最想做的一件事是什么？\n✨ 什么事情做完了会让你有成就感？\n\n从小事开始，一步步来就好 🌱',
  family: '家庭问题往往是最复杂的，因为它们离我们的情感核心太近了 🏠\n\n在你觉得舒服的范围内，可以和我聊聊发生了什么。我会认真听，不会评判。\n\n有时候，把家庭的压力说出来而不是憋在心里，本身就是一种释放 🌿',
  self_esteem: '"总觉得自己不够好"——这种感受我特别能理解 🪞\n\n你知道吗，有研究表明，越优秀的人越容易产生这种"自我怀疑"。这不是你不够好，而是你的标准太高了。\n\n可以试着回忆一下，最近有什么事情是你做得还不错的？哪怕是很小的事 🌱',
  stress: '各种事情堆在一起的时候，确实会有喘不过气的感觉 😰\n\n先深呼吸一下 🫁 我们一起来梳理：\n\n1️⃣ 把所有让你焦虑的事情写下来\n2️⃣ 区分哪些是紧急的、哪些是重要的、哪些是可以放一放的\n3️⃣ 一次只专注一件事\n\n你现在最让你有压力的是哪件事呢？',
  loneliness: '孤独感是一种特别的感受——即使身边有人，还是觉得没人真正理解自己 🧩\n\n我想告诉你，感到孤独本身说明你在渴望真正的连接，这是人之常情。\n\n你平时有什么兴趣爱好吗？有时候从一个兴趣社团开始，更容易遇到志同道合的人 🌱',
  default: '谢谢你和我说这些 🌿\n\n我能感受到你此刻的心情。你愿意再多说一些吗？我在认真听。\n\n无论你想聊什么，这里都是一个安全的空间 💙',
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: null,
  moodScore: 0.5,
  moodTrend: 'stable',
  isTyping: false,
  isCrisis: false,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setTyping: (v) => set({ isTyping: v }),

  setSessionId: (id) => set({ sessionId: id }),

  setMood: (score, trend) => set({ moodScore: score, moodTrend: trend }),

  setCrisis: (v) => set({ isCrisis: v }),
}));

// 模拟发送消息并获取 AI 回复
export async function sendMockMessage(content: string, topicId?: string) {
  const store = useChatStore.getState();

  // 添加用户消息
  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
  store.addMessage(userMsg);

  // 判断情感（简单模拟）
  const negativeWords = ['难过', '伤心', '痛苦', '焦虑', '害怕', '孤独', '绝望', '活不下去', '想死'];
  const hasNegative = negativeWords.some((w) => content.includes(w));
  const hasCrisis = content.includes('想死') || content.includes('活不下去') || content.includes('自杀');

  if (hasNegative) {
    store.setMood(0.25, 'declining');
  }
  if (hasCrisis) {
    store.setCrisis(true);
  }

  // 模拟 AI 思考
  store.setTyping(true);
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1500));
  store.setTyping(false);

  // 选择回复
  let reply: string;
  if (hasCrisis) {
    reply = '我听到你说的了，我能感受到你现在非常痛苦。💙\n\n请记住，你不需要一个人面对这些。现在请你做一件事：\n拨打心理援助热线 **400-161-9995**\n\n电话那头是受过专业培训的咨询师，他们会倾听你、帮助你。你的生命非常珍贵，这个世界上有人在乎你。';
  } else {
    reply = mockReplies[topicId || ''] || mockReplies['default'];
  }

  const aiMsg: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: reply,
    timestamp: Date.now(),
  };
  store.addMessage(aiMsg);

  if (!hasCrisis) {
    store.setMood(0.55 + Math.random() * 0.2, 'improving');
  }

  return aiMsg;
}
