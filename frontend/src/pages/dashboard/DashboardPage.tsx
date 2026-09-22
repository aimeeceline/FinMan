import React, { useState, useMemo } from 'react';
import type { Account, Category, Transaction } from '../../types';

interface DashboardPageProps {
  transactions: Transaction[];
  accounts?: Account[];
  categories?: Category[];
  onOpenAddModal: () => void;
  onNavigateToAccounts: () => void;
  onNavigateToReports: () => void;
  onDeleteTransaction?: (id: number) => void;
  onApplyAiTransaction?: (tx: Omit<Transaction, 'id'>) => void;
}

type TimeFilterTab = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  accounts,
  categories = [],
  onOpenAddModal,
  onNavigateToAccounts,
  onNavigateToReports,
  onDeleteTransaction,
  onApplyAiTransaction,
}) => {
  // Sync hide balance state with localStorage
  const [showBalance, setShowBalance] = useState<boolean>(() => {
    return localStorage.getItem('finman_hide_balance') !== 'true';
  });

  const toggleBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem('finman_hide_balance', String(!next));
      return next;
    });
  };

  // Filter States
  const [timeFilter, setTimeFilter] = useState<TimeFilterTab>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState<boolean>(true);

  // AI Prompt State
  const [aiText, setAiText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiParsed, setAiParsed] = useState<{
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryName: string;
    categoryIcon: string;
    accountName: string;
    note: string;
  } | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Real accounts from backend
  const displayAccounts = accounts || [];

  // Overall Financial Calculations
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = useMemo(() => {
    // If accounts have balances, sum them up
    if (displayAccounts.length > 0) {
      return displayAccounts.reduce((sum, acc) => {
        if (acc.type === 'CREDIT_CARD') {
          return sum - acc.currentBalance;
        }
        return sum + acc.currentBalance;
      }, 0);
    }
    return totalIncome - totalExpense;
  }, [displayAccounts, totalIncome, totalExpense]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const surplus = totalIncome - totalExpense;
    return Math.max(0, Math.round((surplus / totalIncome) * 100));
  }, [totalIncome, totalExpense]);

  // Filter transactions based on active filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Time Frame Filter
      const txDate = t.date; // format YYYY-MM-DD
      if (timeFilter === 'TODAY') {
        if (txDate !== '2026-09-16') return false;
      } else if (timeFilter === 'YESTERDAY') {
        if (txDate !== '2026-09-15') return false;
      } else if (timeFilter === 'WEEK') {
        if (txDate < '2026-09-14' || txDate > '2026-09-20') return false;
      } else if (timeFilter === 'MONTH') {
        if (!txDate.startsWith('2026-09')) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && t.category.name !== categoryFilter) {
        return false;
      }

      // 3. Account Filter
      if (accountFilter !== 'ALL' && t.account.name !== accountFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, timeFilter, categoryFilter, accountFilter]);

  // Distinct categories available in all transactions for filter pills
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category.name));
    return Array.from(set);
  }, [transactions]);

  // Group transactions by date chronologically (latest first)
  const groupedTransactions = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        formattedDate: string;
        dayOfWeek: string;
        items: Transaction[];
        dayIncome: number;
        dayExpense: number;
      }
    >();

    // Sort transactions latest first
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });

    sorted.forEach((tx) => {
      let group = map.get(tx.date);
      if (!group) {
        // Parse date for title
        let formattedDate = tx.date;
        let dayOfWeek = 'Thứ Tư';

        if (tx.date === '2026-09-16') {
          formattedDate = '16 Tháng 09, 2026';
          dayOfWeek = 'Thứ Tư';
        } else if (tx.date === '2026-09-15') {
          formattedDate = '15 Tháng 09, 2026';
          dayOfWeek = 'Thứ Ba';
        } else if (tx.date === '2026-09-14') {
          formattedDate = '14 Tháng 09, 2026';
          dayOfWeek = 'Thứ Hai';
        } else {
          try {
            const d = new Date(tx.date);
            formattedDate = `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            dayOfWeek = days[d.getDay()] || 'Giao dịch';
          } catch {
            formattedDate = tx.date;
          }
        }

        group = {
          date: tx.date,
          formattedDate,
          dayOfWeek,
          items: [],
          dayIncome: 0,
          dayExpense: 0,
        };
        map.set(tx.date, group);
      }

      group.items.push(tx);
      if (tx.type === 'INCOME') {
        group.dayIncome += tx.amount;
      } else {
        group.dayExpense += tx.amount;
      }
    });

    return Array.from(map.values());
  }, [filteredTransactions]);

  // Spending Breakdown for Right Rail
  const spendingBreakdown = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'EXPENSE');
    const totalExp = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const catMap = new Map<string, { amount: number; color: string; icon: string }>();

    expenseTx.forEach((t) => {
      const prev = catMap.get(t.category.name) || {
        amount: 0,
        color: t.category.color || '#dc2626',
        icon: t.category.icon || 'payments',
      };
      catMap.set(t.category.name, {
        ...prev,
        amount: prev.amount + t.amount,
      });
    });

    return Array.from(catMap.entries())
      .map(([name, val]) => ({
        name,
        amount: val.amount,
        percentage: totalExp > 0 ? Math.round((val.amount / totalExp) * 100) : 0,
        color: val.color,
        icon: val.icon,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [transactions]);

  // AI Parser Logic
  const handleAiParse = () => {
    if (!aiText.trim()) return;
    const lower = aiText.toLowerCase();

    // Parse amount
    let amount = 50000;
    const matchNumber = aiText.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu)?/i);
    if (matchNumber) {
      let rawNum = parseFloat(matchNumber[1].replace(',', '.'));
      const unit = (matchNumber[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngan') {
        amount = Math.round(rawNum * 1000);
      } else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu') {
        amount = Math.round(rawNum * 1000000);
      } else {
        amount = Math.round(rawNum);
      }
    }

    // Determine type
    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
    if (
      lower.includes('lương') ||
      lower.includes('thưởng') ||
      lower.includes('nhận') ||
      lower.includes('thu nhập') ||
      lower.includes('bán')
    ) {
      type = 'INCOME';
    }

    // Determine category with intelligent keyword mapping & fallback to "Khác"
    let categoryName = type === 'INCOME' ? 'Thu nhập khác' : 'Chi tiêu khác';
    let categoryIcon = type === 'INCOME' ? 'savings' : 'more_horiz';

    if (type === 'EXPENSE') {
      if (lower.includes('y tế') || lower.includes('thuốc') || lower.includes('bệnh') || lower.includes('khám') || lower.includes('viện') || lower.includes('sức khỏe')) {
        categoryName = 'Sức khỏe';
        categoryIcon = 'favorite';
      } else if (lower.includes('học') || lower.includes('sách') || lower.includes('học phí') || lower.includes('khóa học') || lower.includes('trường') || lower.includes('giáo dục')) {
        categoryName = 'Giáo dục';
        categoryIcon = 'school';
      } else if (lower.includes('phim') || lower.includes('game') || lower.includes('chơi') || lower.includes('du lịch') || lower.includes('karaoke') || lower.includes('giải trí')) {
        categoryName = 'Giải trí';
        categoryIcon = 'sports_esports';
      } else if (lower.includes('điện') || lower.includes('nước') || lower.includes('wifi') || lower.includes('internet') || lower.includes('nhà') || lower.includes('thuê') || lower.includes('phòng') || lower.includes('sinh hoạt')) {
        categoryName = 'Sinh hoạt';
        categoryIcon = 'home';
      } else if (lower.includes('áo') || lower.includes('quần') || lower.includes('giày') || lower.includes('dép') || lower.includes('váy') || lower.includes('túi')) {
        categoryName = 'Áo quần';
        categoryIcon = 'apparel';
      } else if (lower.includes('mua') || lower.includes('shopee') || lower.includes('tiki') || lower.includes('lazada') || lower.includes('siêu thị')) {
        categoryName = 'Mua sắm';
        categoryIcon = 'shopping_bag';
      } else if (lower.includes('xăng') || lower.includes('xe') || lower.includes('grab') || lower.includes('taxi') || lower.includes('giao thông') || lower.includes('vé') || lower.includes('gửi xe')) {
        categoryName = 'Giao thông';
        categoryIcon = 'directions_car';
      } else if (lower.includes('cà phê') || lower.includes('cafe') || lower.includes('ăn') || lower.includes('highland') || lower.includes('cơm') || lower.includes('phở') || lower.includes('trà') || lower.includes('bánh') || lower.includes('lẩu')) {
        categoryName = 'Ăn uống';
        categoryIcon = 'restaurant';
      }
    } else {
      if (lower.includes('lương')) {
        categoryName = 'Lương';
        categoryIcon = 'payments';
      } else if (lower.includes('thưởng') || lower.includes('quà')) {
        categoryName = 'Thưởng';
        categoryIcon = 'featured_seasonal_and_gifts';
      } else if (lower.includes('cổ phiếu') || lower.includes('lãi') || lower.includes('đầu tư') || lower.includes('crypto') || lower.includes('chứng khoán')) {
        categoryName = 'Đầu tư';
        categoryIcon = 'trending_up';
      } else if (lower.includes('freelance') || lower.includes('dự án') || lower.includes('part-time')) {
        categoryName = 'Freelance';
        categoryIcon = 'laptop_mac';
      }
    }

    // Determine account
    let accountName = 'Tiền mặt ví';
    if (lower.includes('vcb') || lower.includes('vietcombank') || lower.includes('ngân hàng') || lower.includes('chuyển khoản')) {
      accountName = 'Vietcombank Digital';
    } else if (lower.includes('thẻ') || lower.includes('credit') || lower.includes('techcombank')) {
      accountName = 'Thẻ tín dụng Techcombank';
    }

    // Clean note
    const note = aiText.trim();

    setAiParsed({
      amount,
      type,
      categoryName,
      categoryIcon,
      accountName,
      note,
    });
  };

  // Voice Speech simulation toggle
  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setAiText('Đang lắng nghe giọng nói...');
      setTimeout(() => {
        setAiText('Cà phê sáng cùng đồng nghiệp 65k tiền mặt');
        setIsListening(false);
        setAiParsed({
          amount: 65000,
          type: 'EXPENSE',
          categoryName: 'Ăn uống',
          categoryIcon: 'restaurant',
          accountName: 'Tiền mặt ví',
          note: 'Cà phê sáng cùng đồng nghiệp',
        });
      }, 1800);
    } else {
      setIsListening(false);
    }
  };

  // Apply parsed AI transaction
  const handleApplyAi = () => {
    if (!aiParsed) return;

    if (displayAccounts.length === 0) {
      alert('Bạn chưa có tài khoản nào. Vui lòng tạo tài khoản trước khi ghi nhận giao dịch.');
      return;
    }

    const matchedAccount = displayAccounts.find((a) =>
      a.name.toLowerCase().includes(aiParsed.accountName.toLowerCase())
    ) || displayAccounts[0];

    // Find category from real database categories
    const matchedCategory = categories.find((c) =>
      c.name.toLowerCase() === aiParsed.categoryName.toLowerCase() && c.type === aiParsed.type
    ) || categories.find((c) =>
      c.name.toLowerCase().includes('khác') && c.type === aiParsed.type
    ) || categories.find((c) => c.type === aiParsed.type) || {
      id: 1,
      name: aiParsed.categoryName,
      type: aiParsed.type,
      icon: aiParsed.categoryIcon,
      color: aiParsed.type === 'INCOME' ? '#006c4a' : '#dc2626',
      bgColor: aiParsed.type === 'INCOME' ? '#85f8c4' : '#ffdad6',
    };

    const newTx: Omit<Transaction, 'id'> = {
      amount: aiParsed.amount,
      type: aiParsed.type,
      category: matchedCategory,
      account: matchedAccount,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: aiParsed.note,
    };

    if (onApplyAiTransaction) {
      onApplyAiTransaction(newTx);
    }

    setAiStatusMessage('Đã ghi nhận giao dịch thành công!');
    setTimeout(() => {
      setAiStatusMessage(null);
      setAiParsed(null);
      setAiText('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. TOP LEVEL KPI METRICS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop mb-space-xl">
        {/* Card 1: Net Available Balance */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Tổng số dư khả dụng
              </span>
              <button
                onClick={toggleBalance}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showBalance ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
          </div>

          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs">
              <span className="font-currency-display text-currency-display text-on-surface font-extrabold tracking-tight">
                {showBalance ? netBalance.toLocaleString('vi-VN') : '••••••••'}
              </span>
              <span className="font-title-md text-title-md text-on-surface-variant font-bold">
                ₫
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>{' '}
              {displayAccounts.length} tài khoản đã đồng bộ Napas
            </p>
          </div>

          <div className="pt-space-xs border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tài sản ròng</span>
            <button
              onClick={onNavigateToAccounts}
              className="text-tertiary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Chi tiết ví <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Tổng Thu nhập T9
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-secondary">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                +{totalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-title-md text-title-md font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">trending_up</span> Khoản thu ghi nhận
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Lương thưởng và các nguồn thu nhập
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Tổng Chi tiêu T9
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/60 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-primary-container">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                -{totalExpense.toLocaleString('vi-VN')}
              </span>
              <span className="font-title-md text-title-md font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px] text-amber-500">info</span> Chi tiêu thực tế
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Sinh hoạt, mua sắm và ăn uống
          </div>
        </div>

        {/* Card 4: Savings Rate / Net Cash Flow */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/15 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Tỷ lệ tích lũy
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-tertiary">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                {savingsRate}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">verified</span>{' '}
              Dòng tiền ròng: {totalIncome - totalExpense >= 0 ? '+' : ''}
              {(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Báo cáo tài chính</span>
            <button
              onClick={onNavigateToReports}
              className="text-tertiary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Xem báo cáo <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SMART AI NATURAL LANGUAGE PARSING CARD (PRD 32.1) */}
      <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-highest/40 p-space-lg rounded-xl shadow-sm mb-space-xl relative overflow-hidden border border-outline-variant/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-xl bg-tertiary flex items-center justify-center text-on-tertiary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Nhập thông minh AI
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Gõ câu tự nhiên bằng tiếng Việt hoặc dùng giọng nói để FinMan tự động trích xuất hạng mục tài chính
              </p>
            </div>
          </div>
        </div>

        {/* AI Prompt Smart Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-space-xs shadow-md flex items-center gap-space-sm focus-within:ring-2 focus-within:ring-tertiary/40 transition-all border border-outline-variant/20">
          <span className="material-symbols-outlined text-tertiary pl-space-sm text-[22px]">
            neurology
          </span>
          <input
            className="flex-1 bg-transparent py-space-sm px-space-xs font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            placeholder="Ví dụ: 'Vừa đổ xăng 120k bằng VCB' hoặc 'Lương tháng 9 20 triệu'..."
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAiParse();
            }}
          />
          <button
            onClick={toggleVoiceInput}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-tertiary hover:opacity-90 text-on-tertiary'
            }`}
            title="Nhập liệu bằng giọng nói"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
          <button
            onClick={handleAiParse}
            className="px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-label-lg text-label-lg transition-all shadow-sm flex items-center gap-space-xs cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Bóc tách</span>
          </button>
        </div>

        {/* AI Parsed Result Drawer / Preview Container */}
        {aiParsed && (
          <div
            className="mt-space-md bg-surface-container-low/90 rounded-xl p-space-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-outline-variant/20 animate-fadeIn"
          >
            <div className="flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>AI đã bóc tách chính xác giao dịch</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs text-body-sm font-body-sm text-on-surface">
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Số tiền:</span>
                  <span
                    className={`font-currency-row text-currency-row font-bold ${
                      aiParsed.type === 'INCOME' ? 'text-secondary' : 'text-primary-container'
                    }`}
                  >
                    {aiParsed.type === 'INCOME' ? '+' : '-'}
                    {aiParsed.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Danh mục:</span>
                  <span className="px-space-xs py-0.5 rounded bg-error-container text-on-surface font-semibold flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      {aiParsed.categoryIcon}
                    </span>{' '}
                    {aiParsed.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Tài khoản:</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-semibold text-on-surface text-xs">
                    {aiParsed.accountName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Ghi chú:</span>
                  <span className="italic text-on-surface font-medium truncate max-w-xs">
                    "{aiParsed.note}"
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-space-xs shrink-0 self-end md:self-auto">
              <button
                onClick={onOpenAddModal}
                className="px-space-sm py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                type="button"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={handleApplyAi}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 ${
                  aiStatusMessage
                    ? 'bg-secondary text-white'
                    : 'bg-primary-container hover:bg-primary text-on-primary-container'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {aiStatusMessage ? 'check_circle' : 'done'}
                </span>
                <span>{aiStatusMessage || 'Áp dụng & Lưu'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN CONTENT SPLIT WORKSPACE (Desktop 65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
        {/* LEFT COLUMN: Transaction Ledger Stage (65% -> 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Main Transaction Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            {/* Filter Controls Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md pb-space-md border-b border-surface-container-high/60">
              {/* Time Frame Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-surface-container-low overflow-x-auto max-w-full">
                <button
                  onClick={() => setTimeFilter('TODAY')}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === 'TODAY'
                      ? 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Hôm nay (16/09)
                </button>
                <button
                  onClick={() => setTimeFilter('YESTERDAY')}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === 'YESTERDAY'
                      ? 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Hôm qua
                </button>
                <button
                  onClick={() => setTimeFilter('WEEK')}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === 'WEEK'
                      ? 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tuần này
                </button>
                <button
                  onClick={() => setTimeFilter('MONTH')}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === 'MONTH'
                      ? 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tháng 9/2026
                </button>
                <button
                  onClick={() => setTimeFilter('ALL')}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                    timeFilter === 'ALL'
                      ? 'bg-surface-container-lowest text-on-surface font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tất cả ({transactions.length})
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-space-xs w-full xl:w-auto justify-end">
                <button
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className={`flex items-center gap-1 px-space-sm py-space-xs rounded-xl font-label-md text-label-md transition-colors cursor-pointer ${
                    showAdvancedFilter
                      ? 'bg-surface-container text-on-surface font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Lọc nâng cao</span>
                </button>
                <button
                  onClick={() => alert('Đang trích xuất dữ liệu giao dịch định dạng Excel (.xlsx)...')}
                  className="flex items-center gap-1 px-space-md py-space-xs rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">file_download</span>
                  <span>Xuất XLSX</span>
                </button>
              </div>
            </div>

            {/* Sub-row: Category pills & Account dropdown */}
            {showAdvancedFilter && (
              <div className="flex flex-wrap items-center gap-space-xs py-space-sm bg-surface/50 -mx-space-lg px-space-lg border-b border-surface-container-high/40">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-space-xs">
                  Danh mục:
                </span>
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-space-xs py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                    categoryFilter === 'ALL'
                      ? 'bg-surface-container-high text-on-surface font-semibold'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Tất cả ({availableCategories.length})
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-space-xs py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-primary-container text-white font-semibold'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Nguồn tiền:
                  </span>
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="bg-surface-container-low text-on-surface font-label-sm text-label-sm rounded-lg px-space-xs py-1 focus:outline-none cursor-pointer border border-outline-variant/30"
                  >
                    <option value="ALL">Tất cả tài khoản</option>
                    {displayAccounts.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Empty State */}
            {groupedTransactions.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mb-1">
                  Không tìm thấy giao dịch nào
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-4">
                  Không có bản ghi phù hợp với bộ lọc hiện tại. Thử đổi bộ lọc hoặc thêm giao dịch mới.
                </p>
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                >
                  + Thêm giao dịch mới
                </button>
              </div>
            ) : (
              /* Chronological Grouped Transaction Ledger */
              groupedTransactions.map((group) => {
                const netDay = group.dayIncome - group.dayExpense;
                return (
                  <div key={group.date} className="mt-space-lg first:mt-space-md">
                    {/* Day Summary Banner */}
                    <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-space-xs border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface">
                          <span className="material-symbols-outlined text-[18px]">
                            calendar_today
                          </span>
                        </div>
                        <div>
                          <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            {group.formattedDate}
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            {group.dayOfWeek} • {group.items.length} giao dịch ghi nhận
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-space-md self-end md:self-auto font-label-md text-label-md">
                        <div className="text-right">
                          <div className="text-on-surface-variant font-body-sm text-body-sm">
                            Thu nhập
                          </div>
                          <div className="text-secondary font-bold font-currency-row text-currency-row">
                            +{group.dayIncome.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                        <div className="h-6 w-px bg-surface-container-highest"></div>
                        <div className="text-right">
                          <div className="text-on-surface-variant font-body-sm text-body-sm">
                            Chi tiêu
                          </div>
                          <div className="text-primary-container font-bold font-currency-row text-currency-row">
                            -{group.dayExpense.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                        <div className="h-6 w-px bg-surface-container-highest"></div>
                        <div className="text-right">
                          <div className="text-on-surface-variant font-body-sm text-body-sm">
                            Dòng tiền ròng
                          </div>
                          <div
                            className={`font-bold font-currency-row text-currency-row ${
                              netDay >= 0 ? 'text-secondary' : 'text-primary-container'
                            }`}
                          >
                            {netDay >= 0 ? '+' : ''}
                            {netDay.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transactions Ledger List for This Day */}
                    <div className="flex flex-col gap-space-xs mt-space-sm">
                      {group.items.map((tx) => {
                        const isIncome = tx.type === 'INCOME';
                        return (
                          <div
                            key={tx.id}
                            className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low/80 transition-all flex items-center justify-between group shadow-sm border border-outline-variant/15"
                          >
                            {/* Left Info */}
                            <div className="flex items-center gap-space-md min-w-0">
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isIncome ? '#85f8c4' : '#ffdad6',
                                  color: isIncome ? '#006c4a' : '#dc2626',
                                }}
                              >
                                <span className="material-symbols-outlined text-[24px]">
                                  {tx.category.icon || (isIncome ? 'account_balance' : 'payments')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-space-xs">
                                  <span className="font-title-md text-title-md text-on-surface font-bold truncate">
                                    {tx.note || tx.category.name}
                                  </span>
                                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
                                    {tx.category.name}
                                  </span>
                                </div>
                                <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs mt-0.5">
                                  <span className="font-medium text-on-surface">
                                    {tx.account.name}
                                  </span>
                                  {tx.time && (
                                    <>
                                      <span>•</span>
                                      <span>{tx.time}</span>
                                    </>
                                  )}
                                  {tx.note && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[200px] text-on-surface-variant italic">
                                        {tx.note}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Amount & Actions */}
                            <div className="flex items-center gap-space-lg shrink-0 pl-space-md">
                              <div className="text-right">
                                <div
                                  className={`font-currency-row text-currency-row font-bold ${
                                    isIncome ? 'text-secondary' : 'text-primary-container'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {tx.amount.toLocaleString('vi-VN')} ₫
                                </div>
                                <span
                                  className={`font-label-sm text-label-sm px-space-xs py-0.5 rounded font-semibold ${
                                    isIncome
                                      ? 'bg-secondary-fixed/40 text-on-secondary-fixed'
                                      : 'text-on-surface-variant'
                                  }`}
                                >
                                  {isIncome ? 'Hoàn tất' : 'Chi tiêu'}
                                </span>
                              </div>

                              {/* Hover Action Buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={onOpenAddModal}
                                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface cursor-pointer"
                                  title="Chỉnh sửa giao dịch"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    edit
                                  </span>
                                </button>
                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Bạn có chắc muốn xóa giao dịch "${tx.note || tx.category.name}"?`)) {
                                        onDeleteTransaction(tx.id);
                                      }
                                    }}
                                    className="p-1 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container cursor-pointer"
                                    title="Xóa giao dịch"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      delete
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Ledger Footer Summary */}
            <div className="mt-space-lg pt-space-md flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low/40 rounded-xl px-space-md py-space-sm border border-outline-variant/15">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                <span>
                  Hiển thị {filteredTransactions.length} trên {transactions.length} giao dịch ghi nhận
                </span>
              </div>
              <button
                onClick={onNavigateToReports}
                className="font-label-md text-label-md text-tertiary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem sao kê đầy đủ</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Financial Visual Flow: Cashflow Trajectory Chart */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">stacked_line_chart</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface font-bold">
                    Biểu đồ Dòng tiền Tuần 3 - Tháng 9
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Tương quan thu nhập vs chi tiêu thực tế
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span className="text-on-surface font-medium">
                    Thu (+{(totalIncome / 1000000).toFixed(1)}M)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                  <span className="text-on-surface font-medium">
                    Chi (-{(totalExpense / 1000000).toFixed(2)}M)
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Vector Chart matching Stitch design */}
            <div className="w-full h-44 flex items-end">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 700 160"
              >
                {/* Grid Lines */}
                <line
                  className="text-surface-container-highest stroke-current"
                  strokeWidth="1"
                  x1="0"
                  x2="700"
                  y1="140"
                  y2="140"
                />
                <line
                  className="text-surface-container-highest stroke-current"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                  x1="0"
                  x2="700"
                  y1="80"
                  y2="80"
                />
                <line
                  className="text-surface-container-highest stroke-current"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                  x1="0"
                  x2="700"
                  y1="20"
                  y2="20"
                />

                {/* Income Area Gradient Fill */}
                <defs>
                  <linearGradient id="incomeGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#006c4a" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#006c4a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,140 L100,140 L200,135 L350,130 L500,25 L650,25 L700,25 L700,140 Z"
                  fill="url(#incomeGrad)"
                />

                {/* Income Line */}
                <path
                  d="M0,140 L100,140 L200,135 L350,130 L500,25 L650,25 L700,25"
                  fill="none"
                  stroke="#006c4a"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <circle cx="500" cy="25" fill="#006c4a" r="5" className="ring-4 ring-white" />

                {/* Expense Line */}
                <path
                  d="M0,140 L100,130 L200,110 L350,105 L500,85 L650,92 L700,95"
                  fill="none"
                  stroke="#dc2626"
                  strokeDasharray="5,5"
                  strokeWidth="2.5"
                />
                <circle cx="500" cy="85" fill="#dc2626" r="4.5" />
              </svg>
            </div>

            {/* X-axis Days */}
            <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant pt-space-xs">
              <span>Thứ 6 (11/09)</span>
              <span>Thứ 7 (12/09)</span>
              <span>CN (13/09)</span>
              <span>Thứ 2 (14/09)</span>
              <span className="font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                Hôm nay (16/09)
              </span>
              <span>Thứ 5 (17/09)</span>
              <span>Thứ 6 (18/09)</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Intelligence, Goal Savings, & Fast Form (35% -> 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Card: Quick Accounts Breakdown */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  account_balance_wallet
                </span>
                <h4 className="font-title-md text-title-md font-bold text-on-surface">
                  Tài khoản của bạn
                </h4>
              </div>
              <button
                onClick={onNavigateToAccounts}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-3">
              {displayAccounts.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant text-xs">
                  Chưa có tài khoản nào trong cơ sở dữ liệu.
                </div>
              ) : (
                displayAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/20 hover:bg-surface-container transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        {acc.type === 'BANK'
                          ? 'account_balance'
                          : acc.type === 'CREDIT_CARD'
                          ? 'credit_card'
                          : 'payments'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface truncate max-w-[130px]">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {acc.accountNumber || 'Mặc định'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-on-surface font-currency-row">
                      {showBalance ? `${acc.currentBalance.toLocaleString('vi-VN')} ₫` : '••••••••'}
                    </div>
                    <div className="text-[10px] text-secondary font-semibold">Hoạt động</div>
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Card: Goal Piggy Banks (Hũ tích lũy mục tiêu) */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">savings</span>
                <h4 className="font-title-md text-title-md text-on-surface font-bold">
                  Hũ tích lũy mục tiêu
                </h4>
              </div>
              <button
                onClick={() => alert('Tính năng tạo Hũ tích lũy mục tiêu mới đang được phát triển!')}
                className="font-label-sm text-label-sm text-tertiary hover:underline font-semibold cursor-pointer"
              >
                + Thêm hũ
              </button>
            </div>

            <div className="flex flex-col gap-space-md">
              {/* Goal 1: Macbook M3 */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">laptop_mac</span>
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        MacBook Pro M3
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Hạn chót: 31/12/2026
                      </p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm font-bold text-secondary">66%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '66%' }}></div>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>
                    Đạt: <strong className="text-on-surface">16.500.000 ₫</strong>
                  </span>
                  <span>Mục tiêu: 25.000.000 ₫</span>
                </div>
              </div>

              {/* Goal 2: Emergency Fund */}
              <div className="flex flex-col gap-space-2xs pt-space-xs border-t border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">
                        health_and_safety
                      </span>
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        Quỹ khẩn cấp 3 tháng
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                        Dự phòng tài chính an sinh
                      </p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">25%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>
                    Đạt: <strong className="text-on-surface">2.500.000 ₫</strong>
                  </span>
                  <span>Mục tiêu: 10.000.000 ₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Phân bổ Chi tiêu nhanh */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">pie_chart</span>
                <h4 className="font-title-md text-title-md font-bold text-on-surface">
                  Phân bổ Chi tiêu
                </h4>
              </div>
              <button
                onClick={onNavigateToReports}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Chi tiết
              </button>
            </div>

            {spendingBreakdown.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-xs">
                Chưa có dữ liệu chi tiêu để phân bổ.
              </div>
            ) : (
              <div className="space-y-3">
                {spendingBreakdown.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-on-surface flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ color: item.color }}
                        >
                          {item.icon}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-bold text-on-surface">
                        {item.amount.toLocaleString('vi-VN')} ₫ ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
