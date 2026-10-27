import React, { useState, useRef, useEffect } from 'react';
import { aiService, type AiQuickAddResult } from '../../services/aiService';
import type { Account, Category, Transaction } from '../../types';

interface AIAssistantChatBallProps {
  onOpenFullScreen?: () => void;
  accounts?: Account[];
  categories?: Category[];
  onApplyAiTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onRefreshData?: () => void;
}

interface MiniMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  parsedTransaction?: AiQuickAddResult;
}

export const AIAssistantChatBall: React.FC<AIAssistantChatBallProps> = ({
  onOpenFullScreen,
  accounts = [],
  categories = [],
  onApplyAiTransaction,
  onRefreshData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI FinMan 🤖. Bạn có thể nói "Vừa đổ xăng 50k", "Ăn trưa 40k ví tiền mặt" hoặc hỏi về tình hình chi tiêu của bạn.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isTyping) return;

    const userMsg: MiniMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      // 1. Thử phân tích giao dịch thông minh với quickAdd
      let hasParsed = false;
      try {
        const quickAddRes = await aiService.quickAdd(text);
        if (quickAddRes && quickAddRes.amount) {
          hasParsed = true;
          const aiMsg: MiniMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `Đã trích xuất thông tin: ${quickAddRes.type === 'EXPENSE' ? 'Khoản Chi' : 'Khoản Thu'} ${Number(quickAddRes.amount).toLocaleString('vi-VN')} ₫ (${quickAddRes.categoryName || 'Chung'})`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            parsedTransaction: quickAddRes,
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } catch {
        // Tiếp tục sang chat thông thường
      }

      // 2. Chat thông thường với AI nếu không phải dạng thêm giao dịch
      if (!hasParsed) {
        const chatRes = await aiService.chat(text);
        const replyText = chatRes.text || 'Tôi đã tiếp nhận thông tin của bạn.';

        const aiMsg: MiniMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Rất tiếc, tôi gặp sự cố kết nối. Bạn có thể mở toàn màn hình Trợ lý AI để xem chi tiết nhé!',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveTransaction = async (parsed: AiQuickAddResult, msgId: string) => {
    if (!onApplyAiTransaction) return;

    // Tìm account & category tương ứng
    const account =
      accounts.find((a) => a.id === parsed.accountId) ||
      accounts[0] || { id: 1, name: 'Tiền mặt', type: 'CASH', balance: 0 };

    const category = categories.find((c) => c.id === parsed.categoryId);

    await onApplyAiTransaction({
      account,
      category,
      type: parsed.type || 'EXPENSE',
      amount: parsed.amount || 0,
      date: parsed.transactionDate || new Date().toISOString().split('T')[0],
      note: parsed.note || 'Giao dịch qua Trợ lý FinMan',
    });

    onRefreshData?.();

    // Đánh dấu đã lưu
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              text: `✅ Đã lưu thành công: ${Number(parsed.amount).toLocaleString('vi-VN')} ₫ vào ${account.name}!`,
              parsedTransaction: undefined,
            }
          : m
      )
    );
  };

  const quickPrompts = [
    'Vừa ăn sáng 35k tiền mặt',
    'Đổ xăng 70k Techcombank',
    'Tháng này tôi đã chi bao nhiêu?',
  ];

  return (
    <>
      {/* 1. Floating AI Chat Ball (Góc phải dưới màn hình) */}
      <div className="fixed right-3.5 sm:right-5 bottom-20 md:bottom-6 z-50 select-none">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative group w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-neutral-800 text-white rotate-90 scale-95 shadow-neutral-900/40'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white hover:scale-105 active:scale-95 shadow-emerald-600/35 ring-4 ring-white/80 dark:ring-neutral-800/80 animate-bounce-subtle'
          }`}
          title="Trợ lý FinMan AI"
          aria-label="Mở Trợ lý FinMan AI"
        >
          {isOpen ? (
            <span className="material-symbols-outlined text-[28px]">close</span>
          ) : (
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src="/avtAI.png"
                alt="AI FinMan"
                className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-[30px] hidden only:block">
                smart_toy
              </span>
              {/* Online Pulse Badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white items-center justify-center text-[8px] font-extrabold text-white">
                  AI
                </span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Window / Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-36 md:bottom-24 md:inset-x-auto md:right-5 md:w-[410px] h-[520px] max-h-[calc(100vh-160px)] z-50 bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-fadeIn select-none">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 p-0.5 ring-1 ring-white/40 shrink-0">
                <img src="/avtAI.png" alt="FinMan AI" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight">Trợ lý FinMan</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-bold tracking-wider uppercase">
                    Gemini AI
                  </span>
                </div>
                <span className="text-[11px] text-white/85 leading-none">
                  Trực tuyến • Sẵn sàng hỗ trợ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút mở toàn màn hình trang AI */}
              {onOpenFullScreen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullScreen();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                  title="Mở toàn màn hình"
                >
                  <span className="material-symbols-outlined text-[19px]">open_in_full</span>
                </button>
              )}
              {/* Nút đóng */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                title="Đóng chat"
              >
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-surface-container-low/60 border-b border-outline-variant/20 flex items-center gap-1.5 overflow-x-auto custom-scroll shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container hover:bg-surface-container-high text-on-surface transition-all cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-surface-container-low text-on-surface rounded-tl-xs border border-outline-variant/20 shadow-2xs'
                        : 'bg-primary text-white rounded-tr-xs shadow-2xs font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Thẻ xác nhận lưu giao dịch nếu có parsedTransaction */}
                    {msg.parsedTransaction && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(msg.parsedTransaction.amount).toLocaleString('vi-VN')} ₫
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveTransaction(msg.parsedTransaction!, msg.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Lưu ngay</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-on-surface-variant/70 mt-0.5 px-1">
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low w-fit border border-outline-variant/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-on-surface-variant font-medium ml-1">
                  FinMan AI đang suy nghĩ...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-surface-container-lowest border-t border-outline-variant/25 flex items-center gap-1.5 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập yêu cầu hoặc giao dịch..."
              className="flex-1 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 px-3.5 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
              title="Gửi"
            >
              <span className="material-symbols-outlined text-[19px]">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
