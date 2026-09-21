import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: `Xin chào ${user?.fullName || 'bạn'}! Tôi là Trợ lý FinMan AI được vận hành bởi Gemini 2.0 Flash. Tôi có thể hỗ trợ bạn phân loại giao dịch tài chính từ câu nói tiếng Việt và tư vấn quản lý ngân sách thông minh. Bạn cần hỗ trợ gì hôm nay?`,
      time: '09:00',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'Tôi đã tiếp nhận yêu cầu của bạn. Tôi có thể giúp bạn phân loại khoản chi, gợi ý ngân sách chi tiêu hợp lý hoặc phân tích dòng tiền.';
      const lower = text.toLowerCase();
      if (lower.includes('ăn uống') || lower.includes('chi tiêu')) {
        reply = 'Khoản chi cho ăn uống sinh hoạt nên được duy trì hợp lý trong hạn mức ngân sách để đảm bảo an toàn tài chính và tích lũy bền vững.';
      } else if (lower.includes('ngân sách') || lower.includes('tiết kiệm')) {
        reply = 'Quy tắc 50/30/20 là phương pháp quản lý tài chính phổ biến: 50% cho nhu cầu thiết yếu, 30% cho mong muốn cá nhân và 20% cho tiết kiệm/đầu tư.';
      }

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: reply,
        time: new Date().toTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const quickPrompts = [
    'Phân tích chi tiêu tháng 9 của tôi',
    'Tôi còn bao nhiêu tiền ăn uống trong tháng?',
    'Gợi ý cách phân bổ thặng dư tiết kiệm',
    'Vừa uống cafe Highland 45k tiền mặt',
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter-desktop py-space-lg select-none">
      <div className="flex flex-col mb-space-lg">
        <div className="flex items-center gap-space-xs mb-space-2xs">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-bold">
            Trí tuệ nhân tạo tài chính
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Trợ lý FinMan AI
          </h1>
          <span className="px-3.5 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-bold flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">neurology</span>
            Gemini 2.0 Flash
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col h-[650px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-tertiary text-on-tertiary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {m.sender === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : 'bg-surface-container-low text-on-surface rounded-tl-none border border-outline-variant/20'
                }`}
              >
                <p className="font-body-md">{m.text}</p>
                <span className="text-[10px] opacity-70 block text-right mt-1.5">
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant italic">
              <span className="material-symbols-outlined animate-spin text-[16px]">
                progress_activity
              </span>
              <span>FinMan AI đang phân tích dữ liệu sổ cái...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 bg-surface-container-lowest border-t border-surface-container-high flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-xs text-on-surface font-medium whitespace-nowrap transition-colors cursor-pointer border border-outline-variant/20"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container-high/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Hỏi FinMan AI về tài chính hoặc nhập câu giao dịch tự nhiên..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/40"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isTyping}
            className="px-5 py-3 rounded-xl bg-tertiary text-on-tertiary font-label-md text-label-md font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Gửi</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
