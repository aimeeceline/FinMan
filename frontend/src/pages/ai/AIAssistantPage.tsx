import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService, type AiQuickAddResult, type AiQuickAddItem, type AiInsightsResult, type AiStatusResult } from '../../services/aiService';
import { transactionService } from '../../services/transactionService';
import { accountService } from '../../services/accountService';
import { categoryService } from '../../services/categoryService';
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
  insightsData?: AiInsightsResult;
  isError?: boolean;
}

interface AIAssistantPageProps {
  accounts?: Account[];
  categories?: Category[];
  onApplyAiTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onRefreshData?: () => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  accounts: propAccounts,
  categories: propCategories,
  onApplyAiTransaction,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>(propAccounts || []);
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [latestInsights, setLatestInsights] = useState<AiInsightsResult | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper render markdown bold text
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-on-surface">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào ${user?.fullName || 'bạn'}! Tôi là Trợ lý FinMan AI.\nTôi có thể giúp bạn:\n💬 **Hỏi đáp số liệu**\n⚡ **Nhập nhanh giao dịch**\n📊 **Phân tích tài chính**`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Load accounts and categories if not passed from parent
  useEffect(() => {
    if (propAccounts && propAccounts.length > 0) {
      setAccounts(propAccounts);
    } else {
      accountService.getAccounts().then(setAccounts).catch(console.error);
    }

    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    } else {
      categoryService.getCategories().then(setCategories).catch(console.error);
    }

    aiService.getStatus().then(setAiStatus).catch(console.error);
  }, [propAccounts, propCategories]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle User Send Command
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

    try {
      const chatRes = await aiService.chat(text);

      if (chatRes.responseType === 'INSIGHTS' && chatRes.insights) {
        setLatestInsights(chatRes.insights);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: chatRes.text || `Dưới đây là báo cáo phân tích tài chính chi tiêu cho tháng ${chatRes.insights.month} từ Gemini AI:`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          insightsData: chatRes.insights,
        };
        setMessages((prev) => [...prev, aiMsg]);

      } else if (chatRes.responseType === 'QUICK_ADD' && chatRes.items && chatRes.items.length > 0) {
        const isMultiple = chatRes.items.length > 1;
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
          text: chatRes.text || (isMultiple
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

      } else {
        // QUERY_ANSWER: Câu trả lời truy vấn số liệu / trợ lý tài chính trực tiếp
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: chatRes.text || 'Tôi đã tiếp nhận yêu cầu của bạn.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error('AI Processing Error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Không thể xử lý yêu cầu. Vui lòng thử lại.';

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

  // Quick Action: Fetch Monthly Insights
  const handleFetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const insights = await aiService.getMonthlyInsights(currentMonth);
      setLatestInsights(insights);

      const aiMsg: ChatMessage = {
        id: `ai-insights-${Date.now()}`,
        sender: 'ai',
        text: `Báo cáo phân tích dòng tiền và khuyến nghị tiết kiệm tháng ${insights.month}:`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        insightsData: insights,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Error fetching insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Voice Speech Recognition with Web Speech API & safe simulation fallback
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && !isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputPrompt(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed, falling back to simulation:', e);
      }
    }

    if (!isListening) {
      setIsListening(true);
      setInputPrompt('Đang lắng nghe giọng nói tiếng Việt...');
      setTimeout(() => {
        setInputPrompt('Ăn bún bò 45k bằng tiền mặt');
        setIsListening(false);
      }, 1600);
    } else {
      setIsListening(false);
    }
  };

  // Apply parsed AI transaction to Database
  const handleSaveTransaction = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.parsedTransaction || msg.parsedTransaction.isSaved) return;

    const pt = msg.parsedTransaction;
    const finalType: 'INCOME' | 'EXPENSE' = pt.editableType || pt.type || 'EXPENSE';
    const finalAmount = pt.editableAmount !== undefined ? pt.editableAmount : pt.amount;
    const finalNote = pt.editableNote !== undefined ? pt.editableNote : (pt.note || '');
    const finalDate = pt.editableDate || pt.transactionDate || new Date().toISOString().split('T')[0];

    // Match real account
    const matchedAccount =
      (pt.editableAccountId ? accounts.find((a) => a.id === pt.editableAccountId) : null) ||
      accounts.find((a) =>
        a.name.toLowerCase().includes((pt.editableAccountName || pt.accountName || '').toLowerCase())
      ) ||
      accounts[0];

    // Match real category
    const matchedCategory: Category =
      (pt.editableCategoryId ? categories.find((c) => c.id === pt.editableCategoryId) : null) ||
      categories.find(
        (c) =>
          c.name.toLowerCase() === (pt.editableCategoryName || pt.categoryName || '').toLowerCase() &&
          c.type === finalType
      ) ||
      categories.find((c) => c.name.toLowerCase().includes('khác') && c.type === finalType) ||
      categories.find((c) => c.type === finalType) || {
        id: pt.categoryId || 1,
        name: pt.editableCategoryName || pt.categoryName || 'Khác',
        type: finalType,
        icon: pt.editableCategoryIcon || pt.categoryIcon || 'category',
      };

    if (!matchedAccount) {
      alert('Vui lòng tạo ít nhất 1 tài khoản ví trước khi lưu giao dịch.');
      return;
    }

    const payload: Omit<Transaction, 'id'> = {
      amount: finalAmount,
      type: finalType,
      category: matchedCategory,
      account: matchedAccount,
      date: finalDate,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: finalNote,
    };

    try {
      if (onApplyAiTransaction) {
        onApplyAiTransaction(payload);
      } else {
        await transactionService.createTransaction({
          accountId: matchedAccount.id,
          categoryId: matchedCategory.id,
          type: finalType,
          amount: finalAmount,
          transactionDate: finalDate,
          note: finalNote,
        });
        if (onRefreshData) onRefreshData();
      }

      // Mark message as saved
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId && m.parsedTransaction) {
            return {
              ...m,
              parsedTransaction: {
                ...m.parsedTransaction,
                isSaved: true,
                isEditing: false,
              },
            };
          }
          return m;
        })
      );

      setSaveSuccessMessage(`Đã ghi nhận giao dịch: ${finalAmount.toLocaleString('vi-VN')} ₫ vào lịch sử giao dịch!`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving AI transaction:', err);
      alert(err.response?.data?.message || 'Không thể lưu giao dịch vào cơ sở dữ liệu');
    }
  };

  // Save a single item from a multi-item batch
  const handleSaveSingleItem = async (messageId: string, itemId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.parsedItems) return;
    const item = msg.parsedItems.find((it) => it.id === itemId);
    if (!item || item.isSaved) return;

    const finalType: 'INCOME' | 'EXPENSE' = item.editableType || item.type || 'EXPENSE';
    const finalAmount = item.editableAmount !== undefined ? item.editableAmount : item.amount;
    const finalNote = item.editableNote !== undefined ? item.editableNote : (item.note || '');
    const finalDate = item.editableDate || item.transactionDate || new Date().toISOString().split('T')[0];

    const matchedAccount =
      (item.editableAccountId ? accounts.find((a) => a.id === item.editableAccountId) : null) ||
      accounts.find((a) =>
        a.name.toLowerCase().includes((item.editableAccountName || item.accountName || '').toLowerCase())
      ) ||
      accounts[0];

    const matchedCategory: Category =
      (item.editableCategoryId ? categories.find((c) => c.id === item.editableCategoryId) : null) ||
      categories.find(
        (c) =>
          c.name.toLowerCase() === (item.editableCategoryName || item.categoryName || '').toLowerCase() &&
          c.type === finalType
      ) ||
      categories.find((c) => c.name.toLowerCase().includes('khác') && c.type === finalType) ||
      categories.find((c) => c.type === finalType) || {
        id: item.categoryId || 1,
        name: item.editableCategoryName || item.categoryName || 'Khác',
        type: finalType,
        icon: item.editableCategoryIcon || item.categoryIcon || 'category',
      };

    if (!matchedAccount) {
      alert('Vui lòng tạo ít nhất 1 tài khoản ví trước khi lưu giao dịch.');
      return;
    }

    try {
      if (onApplyAiTransaction) {
        onApplyAiTransaction({
          amount: finalAmount,
          type: finalType,
          category: matchedCategory,
          account: matchedAccount,
          date: finalDate,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          note: finalNote,
        });
      } else {
        await transactionService.createTransaction({
          accountId: matchedAccount.id,
          categoryId: matchedCategory.id,
          type: finalType,
          amount: finalAmount,
          transactionDate: finalDate,
          note: finalNote,
        });
        if (onRefreshData) onRefreshData();
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId && m.parsedItems) {
            const updatedItems = m.parsedItems.map((it) =>
              it.id === itemId ? { ...it, isSaved: true, isEditing: false } : it
            );
            const allSaved = updatedItems.every((it) => it.isSaved);
            return {
              ...m,
              parsedItems: updatedItems,
              parsedTransaction: m.parsedTransaction
                ? { ...m.parsedTransaction, isSaved: allSaved }
                : undefined,
            };
          }
          return m;
        })
      );

      setSaveSuccessMessage(`Đã ghi nhận: ${finalNote} (${finalAmount.toLocaleString('vi-VN')} ₫)!`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving item:', err);
      alert(err.response?.data?.message || 'Không thể lưu giao dịch vào cơ sở dữ liệu');
    }
  };

  // Save all items from a multi-item batch
  const handleSaveAllItems = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.parsedItems) return;
    const unsaved = msg.parsedItems.filter((it) => !it.isSaved);
    if (unsaved.length === 0) return;

    let savedCount = 0;
    for (const item of unsaved) {
      await handleSaveSingleItem(messageId, item.id);
      savedCount++;
    }

    setSaveSuccessMessage(`Đã lưu thành công toàn bộ ${savedCount} giao dịch vào lịch sử!`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Toggle edit for a single item in multi-item batch
  const toggleEditItem = (messageId: string, itemId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.parsedItems) {
          return {
            ...m,
            parsedItems: m.parsedItems.map((it) =>
              it.id === itemId ? { ...it, isEditing: !it.isEditing } : it
            ),
          };
        }
        return m;
      })
    );
  };

  // Update field for a single item in multi-item batch
  const updateItemField = (
    messageId: string,
    itemId: string,
    fieldOrUpdates: string | Record<string, any>,
    value?: any
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.parsedItems) {
          const updates =
            typeof fieldOrUpdates === 'string'
              ? { [fieldOrUpdates]: value }
              : fieldOrUpdates;
          return {
            ...m,
            parsedItems: m.parsedItems.map((it) =>
              it.id === itemId ? { ...it, ...updates } : it
            ),
          };
        }
        return m;
      })
    );
  };

  // Toggle inline editing in preview card
  const toggleEditTransaction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.parsedTransaction) {
          return {
            ...m,
            parsedTransaction: {
              ...m.parsedTransaction,
              isEditing: !m.parsedTransaction.isEditing,
            },
          };
        }
        return m;
      })
    );
  };

  // Update field for single transaction
  const updateTransactionField = (
    messageId: string,
    fieldOrUpdates: string | Record<string, any>,
    value?: any
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.parsedTransaction) {
          const updates =
            typeof fieldOrUpdates === 'string'
              ? { [fieldOrUpdates]: value }
              : fieldOrUpdates;
          return {
            ...m,
            parsedTransaction: {
              ...m.parsedTransaction,
              ...updates,
            },
          };
        }
        return m;
      })
    );
  };

  // Clear Chat History
  const handleClearChat = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với AI?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Cuộc hội thoại đã được làm mới. Tôi sẵn sàng hỗ trợ bạn nhập giao dịch hoặc tư vấn quản lý tài chính!`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const quickPrompts = [
    'Hôm nay tôi đã tiêu bao nhiêu?',
    'Số dư các ví hiện tại',
    'Uống cà phê 45k ví tiền mặt',
    'Nhận lương tháng 9 20 triệu vào tài khoản ngân hàng',
    'Phân tích chi tiêu và tư vấn tiết kiệm tháng 9',
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-gutter-desktop h-full max-h-full flex flex-col overflow-hidden py-3 select-none">
      {/* 1. Header Page Title & Model Indicator */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-3">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
            Trợ lý Tài chính FinMan AI
          </h1>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <div
            className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-bold flex items-center gap-1.5 shadow-sm border ${aiStatus?.geminiConnected
              ? 'bg-secondary-container text-on-secondary-container border-secondary/30'
              : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {aiStatus?.geminiConnected ? 'neurology' : 'cloud_off'}
            </span>
            <span>
              {aiStatus?.geminiConnected
                ? `Gemini ${aiStatus.model.replace('gemini-', '')} (Online)`
                : 'Local Fallback (Offline)'}
            </span>
          </div>

          <button
            onClick={handleFetchInsights}
            disabled={isLoadingInsights}
            className="px-4 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-tertiary font-label-md text-label-md font-bold border border-outline-variant/30 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Tạo báo cáo nhận xét chi tiêu tháng"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoadingInsights ? 'animate-spin' : ''}`}>
              analytics
            </span>
            <span>Nhận xét tháng này</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all cursor-pointer"
            title="Xóa lịch sử trò chuyện"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="shrink-0 mb-3 p-3 rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/30 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[22px] text-secondary">check_circle</span>
            <span className="font-label-lg text-label-lg font-bold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-on-secondary-container/70 hover:text-on-secondary-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* 2. Main Dual-Rail Content Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Column: Interactive Chat Stream (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">

          {/* Messages Stream Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 md:p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.sender === 'user' ? 'bg-primary text-white' : 'bg-tertiary text-on-tertiary'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {m.sender === 'user' ? 'person' : 'smart_toy'}
                  </span>
                </div>

                {/* Message Bubble & Cards */}
                <div
                  className={`max-w-xl md:max-w-2xl flex flex-col gap-2 ${m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                >
                  {/* Bubble Text */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${m.sender === 'user'
                      ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                      : m.isError
                        ? 'bg-error-container text-on-error-container rounded-tl-none border border-error/30'
                        : 'bg-surface-container-low text-on-surface rounded-tl-none border border-outline-variant/20'
                      }`}
                  >
                    <p className="font-body-md whitespace-pre-line">{renderFormattedText(m.text)}</p>
                    <span className="text-[10px] opacity-70 block text-right mt-1.5">{m.time}</span>
                  </div>

                  {/* EMBEDDED CARD 1: Multi-Item Batch Preview Cards OR Single Preview Card */}
                  {m.parsedItems && m.parsedItems.length > 1 ? (
                    <div className="w-full bg-surface-container-lowest border-2 border-tertiary/20 rounded-xl p-4 shadow-md transition-all hover:border-tertiary/40 animate-fadeIn space-y-3">
                      {/* Header with Save All button */}
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary text-[20px]">dynamic_feed</span>
                          <span className="font-label-lg font-bold text-on-surface">
                            Phát hiện {m.parsedItems.length} giao dịch
                          </span>
                          {m.parsedItems[0]?.source === 'GEMINI_2.5_FLASH' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">bolt</span>
                              Google Gemini 2.5 Flash
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">info</span>
                              Local Fallback
                            </span>
                          )}
                        </div>

                        {m.parsedItems.some((it) => !it.isSaved) ? (
                          <button
                            onClick={() => handleSaveAllItems(m.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-tertiary hover:opacity-90 active:scale-95 text-on-tertiary font-label-md text-label-md font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">done_all</span>
                            <span>Lưu tất cả ({m.parsedItems.filter((it) => !it.isSaved).length})</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-secondary-container text-secondary text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Đã lưu tất cả vào giao dịch
                          </span>
                        )}
                      </div>

                      {/* List of Transaction Cards */}
                      <div className="space-y-3">
                        {m.parsedItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all ${item.isSaved
                              ? 'bg-secondary-container/10 border-secondary/30'
                              : 'bg-surface-container-low/40 border-outline-variant/20 hover:border-tertiary/30'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary font-bold text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${(item.editableType || item.type) === 'INCOME'
                                    ? 'bg-secondary-container text-on-secondary-container'
                                    : 'bg-primary-container/20 text-primary'
                                    }`}
                                >
                                  {(item.editableType || item.type) === 'INCOME' ? 'Thu nhập (+)' : 'Chi tiêu (-)'}
                                </span>
                                <span className="font-bold text-sm text-on-surface">
                                  {(item.editableAmount !== undefined ? item.editableAmount : item.amount).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {item.isSaved ? (
                                  <span className="text-secondary text-xs font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Đã lưu
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => toggleEditItem(m.id, item.id)}
                                      className="text-xs text-tertiary hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">edit</span>
                                      {item.isEditing ? 'Đóng' : 'Sửa'}
                                    </button>
                                    <button
                                      onClick={() => handleSaveSingleItem(m.id, item.id)}
                                      className="px-2.5 py-1 rounded-lg bg-tertiary text-on-tertiary hover:opacity-90 active:scale-95 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">save</span>
                                      Lưu
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Details / Inline Editing */}
                            {item.isEditing ? (
                              <div className="space-y-3 pt-3 border-t border-outline-variant/15 text-xs animate-fadeIn">
                                {/* Type selector tabs */}
                                <div className="flex items-center gap-1.5 p-0.5 bg-surface-container-low rounded-lg border border-outline-variant/30 w-fit">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newType = 'EXPENSE';
                                      const defaultCat = categories.find((c) => c.type === newType);
                                      updateItemField(m.id, item.id, {
                                        editableType: newType,
                                        editableCategoryId: defaultCat?.id,
                                        editableCategoryName: defaultCat?.name,
                                        editableCategoryIcon: defaultCat?.icon,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${(item.editableType || item.type) === 'EXPENSE'
                                      ? 'bg-primary text-white shadow-xs'
                                      : 'text-on-surface-variant hover:text-on-surface'
                                      }`}
                                  >
                                    Chi tiêu (-)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newType = 'INCOME';
                                      const defaultCat = categories.find((c) => c.type === newType);
                                      updateItemField(m.id, item.id, {
                                        editableType: newType,
                                        editableCategoryId: defaultCat?.id,
                                        editableCategoryName: defaultCat?.name,
                                        editableCategoryIcon: defaultCat?.icon,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${(item.editableType || item.type) === 'INCOME'
                                      ? 'bg-secondary text-white shadow-xs'
                                      : 'text-on-surface-variant hover:text-on-surface'
                                      }`}
                                  >
                                    Thu nhập (+)
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                  {/* Amount */}
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant font-medium block">
                                      Số tiền (₫):
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1000"
                                      value={item.editableAmount !== undefined ? item.editableAmount : item.amount}
                                      onChange={(e) =>
                                        updateItemField(m.id, item.id, 'editableAmount', parseFloat(e.target.value) || 0)
                                      }
                                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 text-xs font-bold mt-0.5 focus:outline-none focus:ring-1 focus:ring-tertiary"
                                    />
                                  </div>

                                  {/* Category */}
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant font-medium block">
                                      Danh mục:
                                    </label>
                                    <select
                                      value={
                                        item.editableCategoryId ??
                                        categories.find(
                                          (c) =>
                                            c.name.toLowerCase() ===
                                            (item.editableCategoryName || item.categoryName || '').toLowerCase()
                                        )?.id ??
                                        ''
                                      }
                                      onChange={(e) => {
                                        const catId = Number(e.target.value);
                                        const selectedCat = categories.find((c) => c.id === catId);
                                        if (selectedCat) {
                                          updateItemField(m.id, item.id, {
                                            editableCategoryId: selectedCat.id,
                                            editableCategoryName: selectedCat.name,
                                            editableCategoryIcon: selectedCat.icon,
                                          });
                                        }
                                      }}
                                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 text-xs font-bold mt-0.5 focus:outline-none focus:ring-1 focus:ring-tertiary truncate"
                                    >
                                      {categories
                                        .filter((c) => c.type === (item.editableType || item.type || 'EXPENSE'))
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      {categories
                                        .filter((c) => c.type !== (item.editableType || item.type || 'EXPENSE'))
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name} ({c.type === 'INCOME' ? 'Thu' : 'Chi'})
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  {/* Account */}
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant font-medium block">
                                      Tài khoản ví:
                                    </label>
                                    <select
                                      value={
                                        item.editableAccountId ??
                                        accounts.find((a) =>
                                          a.name
                                            .toLowerCase()
                                            .includes((item.editableAccountName || item.accountName || '').toLowerCase())
                                        )?.id ??
                                        accounts[0]?.id ??
                                        ''
                                      }
                                      onChange={(e) => {
                                        const accId = Number(e.target.value);
                                        const selectedAcc = accounts.find((a) => a.id === accId);
                                        if (selectedAcc) {
                                          updateItemField(m.id, item.id, {
                                            editableAccountId: selectedAcc.id,
                                            editableAccountName: selectedAcc.name,
                                          });
                                        }
                                      }}
                                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 text-xs font-bold mt-0.5 focus:outline-none focus:ring-1 focus:ring-tertiary truncate"
                                    >
                                      {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                          {a.name} ({a.currentBalance.toLocaleString('vi-VN')} ₫)
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Date */}
                                  <div>
                                    <label className="text-[11px] text-on-surface-variant font-medium block">
                                      Ngày giao dịch:
                                    </label>
                                    <input
                                      type="date"
                                      value={
                                        item.editableDate ||
                                        item.transactionDate ||
                                        new Date().toISOString().split('T')[0]
                                      }
                                      onChange={(e) =>
                                        updateItemField(m.id, item.id, 'editableDate', e.target.value)
                                      }
                                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 text-xs font-bold mt-0.5 focus:outline-none focus:ring-1 focus:ring-tertiary"
                                    />
                                  </div>
                                </div>

                                {/* Note */}
                                <div>
                                  <label className="text-[11px] text-on-surface-variant font-medium block">
                                    Nội dung ghi chú:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Nhập ghi chú giao dịch..."
                                    value={item.editableNote !== undefined ? item.editableNote : (item.note || '')}
                                    onChange={(e) =>
                                      updateItemField(m.id, item.id, 'editableNote', e.target.value)
                                    }
                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 text-xs mt-0.5 focus:outline-none focus:ring-1 focus:ring-tertiary"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[14px] text-tertiary">
                                    {item.editableCategoryIcon || item.categoryIcon || 'category'}
                                  </span>
                                  {item.editableCategoryName || item.categoryName}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[14px] text-secondary">
                                    account_balance_wallet
                                  </span>
                                  {item.editableAccountName || item.accountName}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                                    calendar_today
                                  </span>
                                  {item.editableDate || item.transactionDate || 'Hôm nay'}
                                </span>
                                {(item.editableNote !== undefined ? item.editableNote : item.note) && (
                                  <>
                                    <span>•</span>
                                    <span className="italic truncate max-w-[200px]">
                                      "{item.editableNote !== undefined ? item.editableNote : item.note}"
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : m.parsedTransaction && (
                    <div className="w-full bg-surface-container-lowest border-2 border-tertiary/20 rounded-xl p-4 shadow-md transition-all hover:border-tertiary/40 animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {/* Type indicator or toggle buttons */}
                          {m.parsedTransaction.isEditing ? (
                            <div className="flex items-center gap-1 p-0.5 bg-surface-container-low rounded-lg border border-outline-variant/30">
                              <button
                                type="button"
                                onClick={() => {
                                  const newType = 'EXPENSE';
                                  const defaultCat = categories.find((c) => c.type === newType);
                                  updateTransactionField(m.id, {
                                    editableType: newType,
                                    editableCategoryId: defaultCat?.id,
                                    editableCategoryName: defaultCat?.name,
                                    editableCategoryIcon: defaultCat?.icon,
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${(m.parsedTransaction.editableType || m.parsedTransaction.type) === 'EXPENSE'
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'text-on-surface-variant hover:text-on-surface'
                                  }`}
                              >
                                Chi tiêu (-)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newType = 'INCOME';
                                  const defaultCat = categories.find((c) => c.type === newType);
                                  updateTransactionField(m.id, {
                                    editableType: newType,
                                    editableCategoryId: defaultCat?.id,
                                    editableCategoryName: defaultCat?.name,
                                    editableCategoryIcon: defaultCat?.icon,
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${(m.parsedTransaction.editableType || m.parsedTransaction.type) === 'INCOME'
                                  ? 'bg-secondary text-white shadow-xs'
                                  : 'text-on-surface-variant hover:text-on-surface'
                                  }`}
                              >
                                Thu nhập (+)
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${(m.parsedTransaction.editableType || m.parsedTransaction.type) === 'INCOME'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-primary-container/20 text-primary font-bold'
                                }`}
                            >
                              {(m.parsedTransaction.editableType || m.parsedTransaction.type) === 'INCOME'
                                ? 'Thu nhập (+)'
                                : 'Chi tiêu (-)'}
                            </span>
                          )}

                          {m.parsedTransaction.source === 'GEMINI_2.5_FLASH' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">bolt</span>
                              Google Gemini 2.5 Flash
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">info</span>
                              Local Fallback
                            </span>
                          )}
                        </div>

                        {m.parsedTransaction.isSaved ? (
                          <span className="px-2.5 py-1 rounded-lg bg-secondary-container text-secondary text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Đã lưu vào lịch sử
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleEditTransaction(m.id)}
                            className="text-xs text-tertiary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {m.parsedTransaction.isEditing ? 'check' : 'edit'}
                            </span>
                            {m.parsedTransaction.isEditing ? 'Xong chỉnh sửa' : 'Chỉnh sửa'}
                          </button>
                        )}
                      </div>

                      {/* Transaction Key Details: 4 Columns */}
                      <div className="py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* 1. Amount */}
                        <div className="flex flex-col gap-1 bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/10">
                          <span className="text-on-surface-variant font-medium">Số tiền:</span>
                          {m.parsedTransaction.isEditing ? (
                            <div>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                className="w-full font-bold text-sm bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tertiary"
                                value={
                                  m.parsedTransaction.editableAmount !== undefined
                                    ? m.parsedTransaction.editableAmount
                                    : m.parsedTransaction.amount
                                }
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateTransactionField(m.id, { editableAmount: val });
                                }}
                              />
                              <span className="text-[10px] text-tertiary font-bold block mt-0.5">
                                {(m.parsedTransaction.editableAmount !== undefined
                                  ? m.parsedTransaction.editableAmount
                                  : m.parsedTransaction.amount
                                ).toLocaleString('vi-VN')}{' '}
                                ₫
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`font-bold text-sm ${(m.parsedTransaction.editableType || m.parsedTransaction.type) === 'INCOME'
                                ? 'text-secondary'
                                : 'text-primary'
                                }`}
                            >
                              {(m.parsedTransaction.editableAmount !== undefined
                                ? m.parsedTransaction.editableAmount
                                : m.parsedTransaction.amount
                              ).toLocaleString('vi-VN')}{' '}
                              ₫
                            </span>
                          )}
                        </div>

                        {/* 2. Category */}
                        <div className="flex flex-col gap-1 bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/10">
                          <span className="text-on-surface-variant font-medium">Danh mục:</span>
                          {m.parsedTransaction.isEditing ? (
                            <select
                              className="w-full font-bold text-xs bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-tertiary truncate"
                              value={
                                m.parsedTransaction.editableCategoryId ??
                                categories.find(
                                  (c) =>
                                    c.name.toLowerCase() ===
                                    (m.parsedTransaction?.editableCategoryName || m.parsedTransaction?.categoryName || '').toLowerCase()
                                )?.id ??
                                ''
                              }
                              onChange={(e) => {
                                const catId = Number(e.target.value);
                                const selectedCat = categories.find((c) => c.id === catId);
                                if (selectedCat) {
                                  updateTransactionField(m.id, {
                                    editableCategoryId: selectedCat.id,
                                    editableCategoryName: selectedCat.name,
                                    editableCategoryIcon: selectedCat.icon,
                                  });
                                }
                              }}
                            >
                              {categories
                                .filter(
                                  (c) =>
                                    c.type ===
                                    (m.parsedTransaction?.editableType || m.parsedTransaction?.type || 'EXPENSE')
                                )
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              {categories
                                .filter(
                                  (c) =>
                                    c.type !==
                                    (m.parsedTransaction?.editableType || m.parsedTransaction?.type || 'EXPENSE')
                                )
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.type === 'INCOME' ? 'Thu' : 'Chi'})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="font-bold text-on-surface flex items-center gap-1 text-xs truncate">
                              <span className="material-symbols-outlined text-[15px] text-tertiary">
                                {m.parsedTransaction.editableCategoryIcon || m.parsedTransaction.categoryIcon || 'category'}
                              </span>
                              {m.parsedTransaction.editableCategoryName || m.parsedTransaction.categoryName}
                            </span>
                          )}
                        </div>

                        {/* 3. Account */}
                        <div className="flex flex-col gap-1 bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/10">
                          <span className="text-on-surface-variant font-medium">Tài khoản ví:</span>
                          {m.parsedTransaction.isEditing ? (
                            <select
                              className="w-full font-bold text-xs bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-tertiary truncate"
                              value={
                                m.parsedTransaction.editableAccountId ??
                                accounts.find((a) =>
                                  a.name
                                    .toLowerCase()
                                    .includes(
                                      (m.parsedTransaction?.editableAccountName || m.parsedTransaction?.accountName || '').toLowerCase()
                                    )
                                )?.id ??
                                accounts[0]?.id ??
                                ''
                              }
                              onChange={(e) => {
                                const accId = Number(e.target.value);
                                const selectedAcc = accounts.find((a) => a.id === accId);
                                if (selectedAcc) {
                                  updateTransactionField(m.id, {
                                    editableAccountId: selectedAcc.id,
                                    editableAccountName: selectedAcc.name,
                                  });
                                }
                              }}
                            >
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.currentBalance.toLocaleString('vi-VN')} ₫)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-bold text-on-surface flex items-center gap-1 text-xs truncate">
                              <span className="material-symbols-outlined text-[15px] text-secondary">
                                account_balance_wallet
                              </span>
                              {m.parsedTransaction.editableAccountName || m.parsedTransaction.accountName}
                            </span>
                          )}
                        </div>

                        {/* 4. Date */}
                        <div className="flex flex-col gap-1 bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/10">
                          <span className="text-on-surface-variant font-medium">Ngày ghi nhận:</span>
                          {m.parsedTransaction.isEditing ? (
                            <input
                              type="date"
                              className="w-full font-bold text-xs bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tertiary"
                              value={
                                m.parsedTransaction.editableDate ||
                                m.parsedTransaction.transactionDate ||
                                new Date().toISOString().split('T')[0]
                              }
                              onChange={(e) => {
                                updateTransactionField(m.id, { editableDate: e.target.value });
                              }}
                            />
                          ) : (
                            <span className="font-bold text-on-surface flex items-center gap-1 text-xs truncate">
                              <span className="material-symbols-outlined text-[15px] text-on-surface-variant">
                                calendar_today
                              </span>
                              {m.parsedTransaction.editableDate || m.parsedTransaction.transactionDate || 'Hôm nay'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 5. Note / Ghi chú */}
                      {m.parsedTransaction.isEditing ? (
                        <div className="bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/10 mb-3">
                          <label className="text-[11px] text-on-surface-variant font-medium block mb-1">
                            Nội dung ghi chú:
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập ghi chú giao dịch..."
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-tertiary"
                            value={
                              m.parsedTransaction.editableNote !== undefined
                                ? m.parsedTransaction.editableNote
                                : (m.parsedTransaction.note || '')
                            }
                            onChange={(e) => {
                              updateTransactionField(m.id, { editableNote: e.target.value });
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-on-surface-variant bg-surface-container-low/40 px-3 py-2 rounded-lg flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[15px] text-outline">notes</span>
                          <span className="truncate">
                            Nội dung: "
                            {m.parsedTransaction.editableNote !== undefined
                              ? m.parsedTransaction.editableNote
                              : m.parsedTransaction.note}
                            "
                          </span>
                        </div>
                      )}

                      {/* Action Button: Apply & Save */}
                      {!m.parsedTransaction.isSaved && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
                          {m.parsedTransaction.isEditing && (
                            <button
                              onClick={() => toggleEditTransaction(m.id)}
                              className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-bold transition-all cursor-pointer"
                              type="button"
                            >
                              Xong
                            </button>
                          )}
                          <button
                            onClick={() => handleSaveTransaction(m.id)}
                            className="px-4 py-2 rounded-xl bg-tertiary hover:opacity-90 active:scale-95 text-on-tertiary font-label-md text-label-md font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            <span>Áp dụng & Lưu vào lịch sử giao dịch</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EMBEDDED CARD 2: Monthly Insights Report Card */}
                  {m.insightsData && (
                    <div className="w-full bg-surface-container-lowest border-2 border-secondary/20 rounded-xl p-5 shadow-md animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">analytics</span>
                            Phân tích Tháng {m.insightsData.month}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          Tạo lúc {new Date(m.insightsData.generatedAt || Date.now()).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>

                      {/* 3 Metrics Pills */}
                      <div className="grid grid-cols-3 gap-2.5 py-3 text-center">
                        <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10">
                          <div className="text-[11px] text-on-surface-variant font-medium">Tổng thu</div>
                          <div className="font-bold text-secondary text-sm mt-0.5">
                            +{m.insightsData.totalIncome.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>

                        <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10">
                          <div className="text-[11px] text-on-surface-variant font-medium">Tổng chi</div>
                          <div className="font-bold text-primary text-sm mt-0.5">
                            -{m.insightsData.totalExpense.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>

                        <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/10">
                          <div className="text-[11px] text-on-surface-variant font-medium">Tiết kiệm ròng</div>
                          <div
                            className={`font-bold text-sm mt-0.5 ${m.insightsData.netSavings >= 0 ? 'text-secondary' : 'text-primary'
                              }`}
                          >
                            {m.insightsData.netSavings.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      </div>

                      {/* Overview Analysis */}
                      <div className="bg-surface-container-low/70 p-3.5 rounded-xl text-xs text-on-surface leading-relaxed mb-3 border border-outline-variant/15">
                        <div className="font-bold text-on-surface mb-1 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-tertiary text-[17px]">insights</span>
                          <span>Đánh giá từ Trợ lý Gemini AI:</span>
                        </div>
                        <p>{m.insightsData.overview}</p>
                      </div>

                      {/* Actionable Recommendations List */}
                      {m.insightsData.recommendations && m.insightsData.recommendations.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-500 text-[17px]">lightbulb</span>
                            <span>Khuyến nghị tối ưu ngân sách:</span>
                          </div>
                          <div className="space-y-1.5">
                            {m.insightsData.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-on-surface bg-surface-container-low/40 p-2 rounded-lg border border-outline-variant/10"
                              >
                                <span className="w-4 h-4 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 text-xs text-on-surface-variant animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-tertiary flex items-center justify-center text-on-tertiary shadow-sm">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                </div>
                <span>Gemini AI đang phân tích và bóc tách dữ liệu tài chính...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="shrink-0 px-5 py-2 bg-surface-container-lowest border-t border-surface-container-high flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider shrink-0">
              Gợi ý:
            </span>
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                disabled={isTyping}
                className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-xs text-on-surface font-medium whitespace-nowrap transition-colors cursor-pointer border border-outline-variant/20 disabled:opacity-50"
                type="button"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Smart Input Prompt Bar */}
          <div className="shrink-0 p-3 md:p-3.5 bg-surface-container-low border-t border-surface-container-high/60 flex items-center gap-3">
            <button
              onClick={toggleVoiceInput}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0 active:scale-95 ${isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-surface-container-lowest hover:bg-surface-container text-tertiary border border-outline-variant/30'
                }`}
              title="Nhập lệnh bằng giọng nói tiếng Việt"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>

            <input
              type="text"
              placeholder="Nhập câu tiếng Việt: ví dụ 'Ăn phở Thìn 65k ví tiền mặt' hoặc 'Tư vấn tiết kiệm'..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={isTyping}
              className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/40 disabled:opacity-60"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim() || isTyping}
              className="px-5 py-3 rounded-xl bg-tertiary text-on-tertiary font-label-md text-label-md font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              type="button"
            >
              <span>Gửi</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Financial Snapshot & Helper Panel (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col gap-3 overflow-y-auto custom-scroll pr-1 pb-1">
          {/* Card 1: Monthly Financial Health Snapshot */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">health_and_safety</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Sức khỏe tài chính</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary text-xs font-bold">
                Tháng này
              </span>
            </div>

            <p className="text-xs text-on-surface-variant mb-space-md leading-relaxed">
              Theo dõi thặng dư và đánh giá dòng tiền theo thời gian thực dựa trên các giao dịch thực tế đã ghi nhận.
            </p>

            {latestInsights ? (
              <div className="space-y-space-sm">
                <div className="p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/10">
                  <div className="text-[11px] text-on-surface-variant font-medium">Tiết kiệm ròng</div>
                  <div
                    className={`font-bold text-lg mt-0.5 ${latestInsights.netSavings >= 0 ? 'text-secondary' : 'text-primary'
                      }`}
                  >
                    {latestInsights.netSavings.toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                <div className="text-xs text-on-surface leading-relaxed p- space-sm bg-surface-container-low/50 rounded-xl">
                  {latestInsights.overview}
                </div>
              </div>
            ) : (
              <div className="p-space-md bg-surface-container-low/60 rounded-xl text-center border border-outline-variant/15 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[28px]">psychology</span>
                <span className="text-xs text-on-surface-variant">
                  Chưa có dữ liệu phân tích tháng này. Bấm nút bên dưới để tạo ngay!
                </span>
                <button
                  onClick={handleFetchInsights}
                  disabled={isLoadingInsights}
                  className="mt-1 px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer disabled:opacity-50"
                  type="button"
                >
                  {isLoadingInsights ? 'Đang phân tích...' : 'Phân tích tài chính AI'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
