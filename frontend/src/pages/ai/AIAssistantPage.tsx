import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  aiService,
  type AiQuickAddResult,
  type AiQuickAddItem,
} from '../../services/aiService';
import {
  aiChatService,
  type AiConversation,
  type AiMessageSource,
  type PersonalizedInsightResponse,
} from '../../services/aiChatService';
import { CitationChip } from '../../components/ai/CitationChip';
import { ConversationList } from '../../components/ai/ConversationList';
import { MacroScenarioModal } from '../../components/ai/MacroScenarioModal';
import { PersonalizedInsightCard } from '../../components/ai/PersonalizedInsightCard';
import type { Account, Category, Transaction } from '../../types';

export interface ParsedItemState extends AiQuickAddItem {
  id: string;
  isSaved?: boolean;
  isEditing?: boolean;
  editableType?: 'INCOME' | 'EXPENSE';
  editableAmount?: number;
  editableCategoryId?: number;
  editableCategoryName?: string;
  editableCategoryIcon?: string;
  editableAccountId?: number;
  editableAccountName?: string;
  editableDate?: string;
  editableNote?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  conversationId?: number;
  sources?: AiMessageSource[];
  parsedTransaction?: AiQuickAddResult & {
    isSaved?: boolean;
    isEditing?: boolean;
    editableType?: 'INCOME' | 'EXPENSE';
    editableAmount?: number;
    editableCategoryId?: number;
    editableCategoryName?: string;
    editableCategoryIcon?: string;
    editableAccountId?: number;
    editableAccountName?: string;
    editableDate?: string;
    editableNote?: string;
  };
  parsedItems?: ParsedItemState[];
  isError?: boolean;
}

export interface AIAssistantPageProps {
  accounts?: Account[];
  categories?: Category[];
  onApplyAiTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onRefreshData?: () => void;
  initialPrompt?: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  accounts: _accounts = [],
  categories: _categories = [],
  onApplyAiTransaction: _onApplyAiTransaction,
  onRefreshData: _onRefreshData,
  initialPrompt,
}) => {
  const { user } = useAuth();
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Tab mode: 'CHAT' | 'INSIGHTS'
  const [viewMode, setViewMode] = useState<'CHAT' | 'INSIGHTS'>('CHAT');

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputPrompt(initialPrompt);
      setViewMode('CHAT');
    }
  }, [initialPrompt]);

  // Multi-conversation v2 states
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Macro what-if scenario modal
  const [showMacroModal, setShowMacroModal] = useState(false);

  // Personalized insights state
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsightResponse | null>(null);
  const [isLoadingPersonalizedInsights, setIsLoadingPersonalizedInsights] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingConversations(true);
    try {
      const list = await aiChatService.getConversations();
      setConversations(list);
    } catch (err) {
      console.warn('Could not load conversations from server:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load personalized insights when switching to INSIGHTS mode
  const loadPersonalizedInsights = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingPersonalizedInsights(true);
    try {
      const data = await aiChatService.getPersonalizedInsights();
      setPersonalizedInsights(data);
    } catch (err) {
      console.warn('Could not load personalized insights:', err);
    } finally {
      setIsLoadingPersonalizedInsights(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (viewMode === 'INSIGHTS' && !personalizedInsights) {
      loadPersonalizedInsights();
    }
  }, [viewMode, personalizedInsights, loadPersonalizedInsights]);

  // Detect Stat Highlight for messages
  const detectStatHighlight = (text: string) => {
    if (!text) return null;

    const todayExp =
      text.match(/hôm nay[^\n]*chi tiêu(?: tổng cộng)?[^\n]*\*\*([0-9.,]+(?:\s*₫)?)\*\*/i) ||
      text.match(/hôm nay[^\n]*chi tiêu tổng cộng\s*([0-9.,]+(?:\s*₫)?)/i);
    if (todayExp) {
      const amt = todayExp[1].trim().endsWith('₫') ? todayExp[1].trim() : `${todayExp[1].trim()} ₫`;
      return {
        label: 'Tổng chi tiêu hôm nay',
        amount: amt,
        icon: 'payments',
        containerClass:
          'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300',
        badge: 'Hôm nay',
      };
    }

    const todayInc = text.match(/hôm nay[^\n]*thu nhập[^\n]*\*\*([0-9.,]+(?:\s*₫)?)\*\*/i);
    if (todayInc) {
      const amt = todayInc[1].trim().endsWith('₫') ? todayInc[1].trim() : `${todayInc[1].trim()} ₫`;
      return {
        label: 'Tổng thu nhập hôm nay',
        amount: amt,
        icon: 'trending_up',
        containerClass:
          'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
        badge: 'Hôm nay',
      };
    }

    const yExp = text.match(/hôm qua[^\n]*chi tiêu(?: tổng cộng)?[^\n]*\*\*([0-9.,]+(?:\s*₫)?)\*\*/i);
    if (yExp) {
      const amt = yExp[1].trim().endsWith('₫') ? yExp[1].trim() : `${yExp[1].trim()} ₫`;
      return {
        label: 'Tổng chi tiêu hôm qua',
        amount: amt,
        icon: 'history',
        containerClass:
          'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
        badge: 'Hôm qua',
      };
    }

    return null;
  };

  // Helper render inline formatted text with Bold, Money highlight, and Citation Chips
  const renderInlineFormatted = (text: string, sources?: AiMessageSource[]) => {
    if (!text) return null;

    // Tokenize by bold (**...**) and citation syntax ([1], [2], [1, 2])
    const tokenRegex = /(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        const isMoney = inner.includes('₫') || /^[0-9.,]+\s*(?:k|tr|đ|vnđ)?$/i.test(inner.trim());
        if (isMoney) {
          return (
            <span
              key={i}
              className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 mx-0.5 shadow-2xs font-mono tracking-tight"
            >
              {inner}
            </span>
          );
        }
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {inner}
          </strong>
        );
      }

      // Match citation bracket pattern: [1] or [1, 2]
      const citationMatch = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/);
      if (citationMatch) {
        const indices = citationMatch[1]
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));
        return (
          <span key={i} className="inline-flex items-center">
            {indices.map((idx) => {
              const matchedSource = sources?.find((s) => s.citationIndex === idx);
              return <CitationChip key={idx} index={idx} source={matchedSource} />;
            })}
          </span>
        );
      }

      return part;
    });
  };

  // Render multi-line AI message
  const renderAiFormattedContent = (text: string, sources?: AiMessageSource[]) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.slice(2);
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs md:text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2"></span>
                <div className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {renderInlineFormatted(content, sources)}
                </div>
              </div>
            );
          }

          return (
            <p key={idx} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {renderInlineFormatted(line, sources)}
            </p>
          );
        })}
      </div>
    );
  };

  const getInitialMessages = useCallback((): ChatMessage[] => {
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Xin chào ${user?.fullName || 'bạn'}! Tôi là Trợ lý FinMan AI v2.\nTôi được trang bị hệ thống phân tích tài chính kết hợp dữ liệu thị trường vĩ mô và dẫn nguồn bài báo chính xác [1].\n\nBạn có thể:\n💬 **Hỏi đáp tình hình tài chính:** "Lãi suất tiền gửi tăng thì tôi nên làm gì?", "Quỹ khẩn cấp của tôi có an toàn không?"\n⚡ **Nhập nhanh giao dịch:** "Ăn phở Thìn 65k ví tiền mặt", "Thu tiền freelance 5tr vào ngân hàng"\n📊 **Báo cáo chi tiêu:** "Tổng hợp chi tiêu tháng này"`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  }, [user?.fullName]);

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);

  // Select a conversation from sidebar
  const handleSelectConversation = async (id: number) => {
    setActiveConversationId(id);
    setIsTyping(true);
    try {
      const conv = await aiChatService.getConversationDetail(id);
      if (conv && conv.messages && conv.messages.length > 0) {
        const mappedMessages: ChatMessage[] = conv.messages.map((m) => ({
          id: `msg-${m.id}`,
          sender: m.role === 'USER' ? 'user' : 'ai',
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          conversationId: conv.id,
          sources: m.sources,
        }));
        setMessages(mappedMessages);
      } else {
        setMessages(getInitialMessages());
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages(getInitialMessages());
  };

  // Toggle pin conversation
  const handleTogglePin = async (id: number) => {
    try {
      const updated = await aiChatService.togglePin(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: updated.isPinned } : c))
      );
    } catch (err) {
      console.error('Failed to pin conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: number) => {
    try {
      await aiChatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Scroll to bottom
  const scrollToBottomInstant = useCallback(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  useLayoutEffect(() => {
    scrollToBottomInstant();
  }, [scrollToBottomInstant]);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isTyping]);

  // Handle Send Message
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isTyping) return;

    const userMessageId = `user-${Date.now()}`;
    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text,
      time: currentTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    // Heuristic check: is this a transaction entry command? (e.g. "ăn bún bò 45k", "mua đồ 120k", "chi tiêu 500k")
    const isQuickAddPattern =
      /(ăn|uống|mua|tiêu|trả|đổ xăng|lương|tiền|chi|thu|nạp|chuyển)\s+.*[0-9]+(?:\s*(?:k|tr|đ|vnđ|nghìn|triệu))?/i.test(
        text
      ) && !/(lãi suất|lạm phát|thị trường|chứng khoán|vĩ mô|quỹ khẩn cấp|làm gì|tư vấn|nhận định)/i.test(text);

    try {
      if (isQuickAddPattern) {
        // Use classic transaction parser for quick ledger recording
        const historyDto = messages
          .filter((m) => m.id !== 'welcome' && !m.isError)
          .slice(-6)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        const chatRes = await aiService.chat(text, historyDto);

        if (chatRes.responseType === 'QUICK_ADD' && chatRes.items && chatRes.items.length > 0) {
          const parsedItems: ParsedItemState[] = chatRes.items.map((it, idx) => ({
            ...it,
            id: `item-${Date.now()}-${idx}`,
            isSaved: false,
            isEditing: false,
            editableType: it.type,
            editableAmount: it.amount,
            editableCategoryId: it.categoryId,
            editableCategoryName: it.categoryName,
            editableCategoryIcon: it.categoryIcon,
            editableAccountId: it.accountId,
            editableAccountName: it.accountName,
            editableDate: it.transactionDate || new Date().toISOString().split('T')[0],
            editableNote: it.note,
          }));

          const firstItem = chatRes.items[0];
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text:
              chatRes.text ||
              (parsedItems.length > 1
                ? `Tôi đã nhận diện được ${parsedItems.length} giao dịch của bạn. Bạn có thể kiểm tra từng giao dịch hoặc bấm "Lưu tất cả":`
                : `Tôi đã nhận diện được giao dịch của bạn. Vui lòng kiểm tra và bấm "Áp dụng & Lưu" để ghi vào lịch sử giao dịch:`),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            parsedItems,
            parsedTransaction: {
              type: firstItem.type,
              amount: firstItem.amount,
              categoryId: firstItem.categoryId,
              categoryName: firstItem.categoryName,
              categoryIcon: firstItem.categoryIcon,
              accountId: firstItem.accountId,
              accountName: firstItem.accountName,
              accountType: firstItem.accountType,
              transactionDate: firstItem.transactionDate,
              note: firstItem.note,
              rawText: text,
              source: chatRes.source,
              isSaved: false,
              isEditing: false,
              editableType: firstItem.type,
              editableAmount: firstItem.amount,
              editableCategoryId: firstItem.categoryId,
              editableCategoryName: firstItem.categoryName,
              editableCategoryIcon: firstItem.categoryIcon,
              editableAccountId: firstItem.accountId,
              editableAccountName: firstItem.accountName,
              editableDate: firstItem.transactionDate || new Date().toISOString().split('T')[0],
              editableNote: firstItem.note,
            },
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }

      // Default: Use Chat v2 with Hybrid Context & Citations
      const resMsg = await aiChatService.chatV2(text, activeConversationId || undefined);

      if (resMsg) {
        if (!activeConversationId && resMsg.conversationId) {
          setActiveConversationId(resMsg.conversationId);
          loadConversations();
        }

        const aiMsg: ChatMessage = {
          id: `ai-${resMsg.id || Date.now()}`,
          sender: 'ai',
          text: resMsg.content,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          conversationId: resMsg.conversationId,
          sources: resMsg.sources,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error('AI Processing Error:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.';

      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: errorMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputPrompt(transcript);
          }
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed:', e);
      }
    }

    if (!isListening) {
      setIsListening(true);
      setInputPrompt('Đang lắng nghe giọng nói tiếng Việt...');
      setTimeout(() => {
        setInputPrompt('Lãi suất tiền gửi tăng thì tôi nên cơ cấu tiền tiết kiệm thế nào?');
        setIsListening(false);
      }, 1500);
    } else {
      setIsListening(false);
    }
  };

  // Quick prompt pills
  const QUICK_PROMPTS = [
    'Lãi suất ngân hàng tăng thì tôi nên làm gì?',
    'Đánh giá quỹ dự phòng khẩn cấp của tôi',
    'Nếu giá xăng tăng 8%, chi tiêu của tôi tăng bao nhiêu?',
    'Ăn trưa bún chả 50k bằng tiền mặt',
    'Tổng chi tiêu tháng này của tôi',
  ];

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Top Header & Navigation Strip */}
      <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle sidebar button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng / mở danh sách cuộc trò chuyện"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarOpen ? 'vertical_split' : 'menu_open'}
            </span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>FinMan AI Assistant v2</span>
              </h2>
            </div>
          </div>
        </div>

        {/* View mode switcher & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('CHAT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'CHAT'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Trò chuyện</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('INSIGHTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'INSIGHTS'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">insights</span>
              <span>Báo cáo Vĩ mô</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowMacroModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            <span className="hidden sm:inline">Mô phỏng Vĩ mô</span>
          </button>
        </div>
      </div>

      {/* Main Body Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar: Conversation List */}
        {isSidebarOpen && viewMode === 'CHAT' && (
          <div className="w-72 sm:w-80 shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onTogglePin={handleTogglePin}
              onDeleteConversation={handleDeleteConversation}
              isLoading={isLoadingConversations}
            />
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
          {viewMode === 'INSIGHTS' ? (
            /* Tab 2: Personalized Insights Full Canvas */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
              {isLoadingPersonalizedInsights ? (
                <div className="p-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-3xl animate-spin text-emerald-500">
                    progress_activity
                  </span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Đang đối chiếu dữ liệu tài chính nội bộ với tin tức vĩ mô mới nhất...
                  </p>
                </div>
              ) : personalizedInsights ? (
                <PersonalizedInsightCard
                  data={personalizedInsights}
                  onRefresh={loadPersonalizedInsights}
                  isLoading={isLoadingPersonalizedInsights}
                />
              ) : (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-300">analytics</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Chưa có báo cáo phân tích vĩ mô
                  </h3>
                  <button
                    type="button"
                    onClick={loadPersonalizedInsights}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-emerald-700"
                  >
                    Tạo báo cáo phân tích ngay
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tab 1: Chat Stream Canvas */
            <>
              <div
                ref={chatScrollContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll"
              >
                {messages.map((m) => {
                  const statHighlight = m.sender === 'ai' ? detectStatHighlight(m.text) : null;

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 animate-in fade-in duration-150 ${
                        m.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {m.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        </div>
                      )}

                      <div
                        className={`max-w-xl md:max-w-2xl flex flex-col gap-2 ${
                          m.sender === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        {m.sender === 'user' ? (
                          <div className="p-3.5 px-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-xs bg-emerald-600 text-white font-medium">
                            <p className="whitespace-pre-line">{m.text}</p>
                            <span className="text-[10px] text-white/70 block text-right mt-1">
                              {m.time}
                            </span>
                          </div>
                        ) : m.isError ? (
                          <div className="p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-xs bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900">
                            <p className="whitespace-pre-line">{m.text}</p>
                            <span className="text-[10px] opacity-70 block text-right mt-1">{m.time}</span>
                          </div>
                        ) : (
                          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs transition-all">
                            {/* Stat highlight if present */}
                            {statHighlight && (
                              <div
                                className={`mb-3.5 p-3 rounded-xl border flex items-center justify-between gap-3 ${statHighlight.containerClass}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statHighlight.iconBg}`}
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      {statHighlight.icon}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                      {statHighlight.label}
                                    </div>
                                    <div className="text-lg font-bold font-mono tracking-tight">
                                      {statHighlight.amount}
                                    </div>
                                  </div>
                                </div>
                                {statHighlight.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-black/5">
                                    {statHighlight.badge}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Message content */}
                            <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                              {renderAiFormattedContent(m.text, m.sources)}
                            </div>

                            {/* Citations footer if sources present */}
                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                  <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">
                                    verified
                                  </span>
                                  <span>Nguồn tin tức tham khảo đã kiểm chứng:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.sources.map((s) => (
                                    <CitationChip key={s.id || s.citationIndex} index={s.citationIndex} source={s} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {m.sender === 'user' && (
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-xs mt-1 font-bold text-xs">
                          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="p-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                      <span className="text-xs text-slate-400 font-medium pl-1">
                        Gemini AI đang tổng hợp dữ liệu...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions pills */}
              <div className="shrink-0 px-4 py-2 bg-white dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto custom-scroll">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Gợi ý:</span>
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(p)}
                    disabled={isTyping}
                    className="px-3 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 transition-colors disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Nhập bằng giọng nói"
                >
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>

                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  disabled={isTyping}
                  placeholder="Đặt câu hỏi tài chính hoặc nhập giao dịch: 'Lãi suất tăng tôi nên làm gì?'..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputPrompt.trim() || isTyping}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>Gửi</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* What-If Macro Scenario Modal */}
      <MacroScenarioModal isOpen={showMacroModal} onClose={() => setShowMacroModal(false)} />
    </div>
  );
};
