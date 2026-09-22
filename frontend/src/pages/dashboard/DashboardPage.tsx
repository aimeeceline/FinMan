import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  selectedYearMonth?: string;
  onSelectYearMonth?: (ym: string) => void;
  onMonthPrev?: () => void;
  onMonthNext?: () => void;
}

type TimeRangeOption = 'ALL' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'CUSTOM';

const PASTEL_PALETTES = [
  'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  'bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
];

const getCategoryPastelBg = (id?: number, name?: string): string => {
  if (typeof id === 'number' && id > 0) {
    return PASTEL_PALETTES[id % PASTEL_PALETTES.length];
  }
  const str = name || 'category';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return PASTEL_PALETTES[Math.abs(hash) % PASTEL_PALETTES.length];
};

const renderCategoryIcon = (icon?: string, type?: 'INCOME' | 'EXPENSE') => {
  if (!icon) {
    return (
      <span className="material-symbols-outlined text-[18px]">
        {type === 'INCOME' ? 'savings' : 'payments'}
      </span>
    );
  }
  const isEmoji = /\p{Extended_Pictographic}/u.test(icon) || icon.length <= 2;
  if (isEmoji) {
    return <span className="text-base leading-none">{icon}</span>;
  }
  return <span className="material-symbols-outlined text-[18px]">{icon}</span>;
};

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

  // Filter States (Dropdown based)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeOption>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Dynamic Date Range Helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Helper to calculate date N months ago in YYYY-MM-DD format
  const getPastDateStr = (monthsAgo: number) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsAgo);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = Math.min(new Date().getDate(), lastDay);
    d.setDate(day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

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

  // Filter transactions based on active dropdown filters
  const filteredTransactions = useMemo(() => {
    const oneMonthAgo = getPastDateStr(1);
    const threeMonthsAgo = getPastDateStr(3);
    const sixMonthsAgo = getPastDateStr(6);

    return transactions.filter((t) => {
      const txDate = t.date; // format YYYY-MM-DD
      if (!txDate) return false;

      // 1. Phân loại (Thu / Chi)
      if (typeFilter !== 'ALL' && t.type !== typeFilter) {
        return false;
      }

      // 2. Danh mục
      if (categoryFilter !== 'ALL' && t.category?.name !== categoryFilter) {
        return false;
      }

      // 3. Thời gian (1 tháng, 3 tháng, 6 tháng, tự chọn)
      if (timeRangeFilter === '1_MONTH') {
        if (txDate < oneMonthAgo) return false;
      } else if (timeRangeFilter === '3_MONTHS') {
        if (txDate < threeMonthsAgo) return false;
      } else if (timeRangeFilter === '6_MONTHS') {
        if (txDate < sixMonthsAgo) return false;
      } else if (timeRangeFilter === 'CUSTOM') {
        if (customStartDate && txDate < customStartDate) return false;
        if (customEndDate && txDate > customEndDate) return false;
      }

      // 4. Nguồn tiền
      if (accountFilter !== 'ALL' && t.account?.name !== accountFilter) {
        return false;
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    timeRangeFilter,
    accountFilter,
    customStartDate,
    customEndDate,
  ]);

  // Financial Calculations for the active filtered period
  const periodIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const periodExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const periodSurplus = periodIncome - periodExpense;

  const periodSavingsRate = useMemo(() => {
    if (periodIncome <= 0) return 0;
    return Math.max(0, Math.round((periodSurplus / periodIncome) * 100));
  }, [periodIncome, periodSurplus]);

  // Dynamic Period Label
  const periodLabel = useMemo(() => {
    if (timeRangeFilter === '1_MONTH') return '1 tháng';
    if (timeRangeFilter === '3_MONTHS') return '3 tháng';
    if (timeRangeFilter === '6_MONTHS') return '6 tháng';
    if (timeRangeFilter === 'CUSTOM') {
      if (customStartDate && customEndDate) {
        return `${customStartDate} → ${customEndDate}`;
      }
      if (customStartDate) return `Từ ${customStartDate}`;
      if (customEndDate) return `Đến ${customEndDate}`;
      return 'Tự chọn';
    }
    return 'Toàn bộ';
  }, [timeRangeFilter, customStartDate, customEndDate]);

  // Overall Total Balance from Accounts
  const netBalance = useMemo(() => {
    if (displayAccounts.length > 0) {
      return displayAccounts.reduce((sum, acc) => {
        if (acc.type === 'CREDIT_CARD') {
          return sum - acc.currentBalance;
        }
        return sum + acc.currentBalance;
      }, 0);
    }
    return periodIncome - periodExpense;
  }, [displayAccounts, periodIncome, periodExpense]);

  // Determine whether any filter is actively applied
  const isFiltered = useMemo(() => {
    return (
      typeFilter !== 'ALL' ||
      categoryFilter !== 'ALL' ||
      timeRangeFilter !== 'ALL' ||
      accountFilter !== 'ALL' ||
      Boolean(customStartDate) ||
      Boolean(customEndDate)
    );
  }, [typeFilter, categoryFilter, timeRangeFilter, accountFilter, customStartDate, customEndDate]);

  // Custom Category Dropdown State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [categorySearchText, setCategorySearchText] = useState<string>('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCategoryDropdownOpen]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setTimeRangeFilter('ALL');
    setAccountFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setCategorySearchText('');
    setIsCategoryDropdownOpen(false);
  };

  // Dynamic categories directly from database (via categories prop & active transactions)
  const { expenseCategories, incomeCategories } = useMemo(() => {
    const expMap = new Map<string, Category>();
    const incMap = new Map<string, Category>();

    // 1. From database categories prop
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        if (c.type === 'EXPENSE') {
          expMap.set(c.name, c);
        } else {
          incMap.set(c.name, c);
        }
      });
    }

    // 2. From actual transactions in database (in case any transaction has a category not in the initial list)
    transactions.forEach((t) => {
      if (t.category?.name) {
        if (t.type === 'EXPENSE' && !expMap.has(t.category.name)) {
          expMap.set(t.category.name, t.category);
        } else if (t.type === 'INCOME' && !incMap.has(t.category.name)) {
          incMap.set(t.category.name, t.category);
        }
      }
    });

    // Filter by search query in realtime
    const q = categorySearchText.toLowerCase().trim();
    const filterFn = (cat: Category) => !q || cat.name.toLowerCase().includes(q);

    return {
      expenseCategories: Array.from(expMap.values()).filter(filterFn),
      incomeCategories: Array.from(incMap.values()).filter(filterFn),
    };
  }, [categories, transactions, categorySearchText]);

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
        let dayOfWeek = 'Giao dịch';

        try {
          const [y, m, d] = tx.date.split('-').map(Number);
          const dObj = new Date(y, m - 1, d);
          const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          const dayName = days[dObj.getDay()] || 'Giao dịch';
          
          if (tx.date === todayStr) {
            dayOfWeek = `${dayName} (Hôm nay)`;
          } else if (tx.date === yesterdayStr) {
            dayOfWeek = `${dayName} (Hôm qua)`;
          } else {
            dayOfWeek = dayName;
          }

          formattedDate = `${d} Tháng ${m < 10 ? '0' + m : m}, ${y}`;
        } catch {
          formattedDate = tx.date;
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

  // Dynamic 7-Point Cashflow Trajectory Chart
  const chartData = useMemo(() => {
    const days: string[] = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // 7 active days ending today
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const points = days.map((dayStr) => {
      const dayTxs = transactions.filter((t) => t.date === dayStr);
      const inc = dayTxs
        .filter((t) => t.type === 'INCOME')
        .reduce((s, t) => s + t.amount, 0);
      const exp = dayTxs
        .filter((t) => t.type === 'EXPENSE')
        .reduce((s, t) => s + t.amount, 0);

      const [y, m, d] = dayStr.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      const label = `${dayNames[dObj.getDay()]} (${d}/${m})`;

      return {
        date: dayStr,
        label,
        isToday: dayStr === todayStr,
        income: inc,
        expense: exp,
      };
    });

    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.income, p.expense)),
      500000
    );

    const xCoords = [20, 130, 240, 350, 460, 570, 680];

    const incomeCoords = points.map((p, idx) => ({
      x: xCoords[idx],
      y: 140 - Math.round((p.income / maxVal) * 115),
      val: p.income,
    }));

    const expenseCoords = points.map((p, idx) => ({
      x: xCoords[idx],
      y: 140 - Math.round((p.expense / maxVal) * 115),
      val: p.expense,
    }));

    const incomePath = incomeCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`)
      .join(' ');
    const expensePath = expenseCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`)
      .join(' ');
    const incomeAreaPath = `${incomePath} L680,140 L20,140 Z`;

    return {
      points,
      incomePath,
      expensePath,
      incomeAreaPath,
      incomeCoords,
      expenseCoords,
    };
  }, [todayStr, transactions]);

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
              Tổng Thu nhập ({periodLabel})
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-secondary">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                +{periodIncome.toLocaleString('vi-VN')}
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
              Tổng Chi tiêu ({periodLabel})
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/60 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-primary-container">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                -{periodExpense.toLocaleString('vi-VN')}
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
                {periodSavingsRate}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">verified</span>{' '}
              Dòng tiền ròng: {periodSurplus >= 0 ? '+' : ''}
              {periodSurplus.toLocaleString('vi-VN')} ₫
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
            {/* Filter Toolbar with Dropdowns */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-sm pb-space-md border-b border-surface-container-high/60">
              {/* Dropdown Filters Group */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* 1. Dropdown Phân loại (Thu, Chi) */}
                <div className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs text-on-surface transition-colors shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">swap_vert</span>
                  <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Phân loại:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value as 'ALL' | 'EXPENSE' | 'INCOME');
                      setCategoryFilter('ALL');
                    }}
                    className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer text-xs pr-1"
                  >
                    <option value="ALL">Tất cả (Thu & Chi)</option>
                    <option value="EXPENSE">Chi tiêu (-)</option>
                    <option value="INCOME">Thu nhập (+)</option>
                  </select>
                </div>

                {/* 2. Custom Styled Dropdown Danh mục (Khớp giao diện Stitch/Screenshot) */}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs text-on-surface transition-all cursor-pointer shadow-2xs ${
                      isCategoryDropdownOpen || categoryFilter !== 'ALL'
                        ? 'bg-surface-container border-purple-400 dark:border-purple-500/50 text-on-surface font-semibold ring-2 ring-purple-500/15'
                        : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px] text-on-surface-variant">category</span>
                    <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Danh mục:</span>
                    <span className="font-semibold max-w-[140px] truncate">
                      {categoryFilter === 'ALL' ? 'Tất cả danh mục' : categoryFilter}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 ${
                        isCategoryDropdownOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu Modal Card */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 z-50 w-[320px] sm:w-[340px] bg-white dark:bg-surface-container-lowest rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-outline-variant/25 p-4 animate-fadeIn select-none">
                      {/* Top Header: Purple Badge + "Danh Mục" */}
                      <div className="flex items-center gap-2.5 pb-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-2xs">
                          <span className="material-symbols-outlined text-[19px]">segment</span>
                        </div>
                        <h3 className="font-bold text-base text-slate-800 dark:text-on-surface tracking-tight">
                          Danh Mục
                        </h3>
                      </div>

                      {/* Search Input */}
                      <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                          search
                        </span>
                        <input
                          type="text"
                          value={categorySearchText}
                          onChange={(e) => setCategorySearchText(e.target.value)}
                          placeholder="Tìm danh mục (Ăn uống, Lương...)"
                          className="w-full bg-slate-50/80 dark:bg-surface-container-low text-slate-800 dark:text-on-surface text-xs font-medium pl-9 pr-8 py-2.5 rounded-xl border border-slate-200/80 dark:border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-purple-400/25 focus:border-purple-500 transition-all placeholder:text-slate-400"
                          autoFocus
                        />
                        {categorySearchText && (
                          <button
                            type="button"
                            onClick={() => setCategorySearchText('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                          </button>
                        )}
                      </div>

                      {/* Options Container */}
                      <div className="max-h-[300px] overflow-y-auto custom-scroll pr-1 space-y-3">
                        {/* Section: TẤT CẢ */}
                        {(!categorySearchText.trim() || 'tất cả danh mục'.includes(categorySearchText.toLowerCase().trim())) && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                              TẤT CẢ
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter('ALL');
                                setIsCategoryDropdownOpen(false);
                                setCategorySearchText('');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all cursor-pointer ${
                                categoryFilter === 'ALL'
                                  ? 'bg-red-50/90 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/40 shadow-2xs'
                                  : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-amber-500 text-base">✨</span>
                                <span className="text-sm font-semibold">Tất cả danh mục</span>
                              </div>
                              {categoryFilter === 'ALL' && (
                                <span className="material-symbols-outlined text-[18px] text-red-500 font-bold">
                                  check
                                </span>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Section: CHI TIÊU */}
                        {(typeFilter === 'ALL' || typeFilter === 'EXPENSE') && expenseCategories.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                              CHI TIÊU
                            </div>
                            <div className="space-y-1">
                              {expenseCategories.map((cat) => {
                                const isSelected = categoryFilter === cat.name;
                                const pastelBg = getCategoryPastelBg(cat.id, cat.name);
                                return (
                                  <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => {
                                      setCategoryFilter(cat.name);
                                      setIsCategoryDropdownOpen(false);
                                      setCategorySearchText('');
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-2xl text-xs transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-red-50/90 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/40 shadow-2xs'
                                        : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 truncate">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${pastelBg}`}>
                                        {renderCategoryIcon(cat.icon, 'EXPENSE')}
                                      </div>
                                      <span className="text-sm truncate font-medium text-slate-800 dark:text-on-surface">
                                        {cat.name}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <span className="material-symbols-outlined text-[18px] text-red-500 font-bold ml-2">
                                        check
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Section: THU NHẬP */}
                        {(typeFilter === 'ALL' || typeFilter === 'INCOME') && incomeCategories.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                              THU NHẬP
                            </div>
                            <div className="space-y-1">
                              {incomeCategories.map((cat) => {
                                const isSelected = categoryFilter === cat.name;
                                const pastelBg = getCategoryPastelBg(cat.id, cat.name);
                                return (
                                  <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => {
                                      setCategoryFilter(cat.name);
                                      setIsCategoryDropdownOpen(false);
                                      setCategorySearchText('');
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-2xl text-xs transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-900/40 shadow-2xs'
                                        : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 truncate">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${pastelBg}`}>
                                        {renderCategoryIcon(cat.icon, 'INCOME')}
                                      </div>
                                      <span className="text-sm truncate font-medium text-slate-800 dark:text-on-surface">
                                        {cat.name}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <span className="material-symbols-outlined text-[18px] text-emerald-600 font-bold ml-2">
                                        check
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Empty search results */}
                        {expenseCategories.length === 0 && incomeCategories.length === 0 && (
                          <div className="py-6 text-center text-slate-400 text-xs font-medium">
                            Không tìm thấy danh mục nào khớp với "{categorySearchText}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Dropdown Thời gian (1 tháng, 3 tháng, 6 tháng, tự chọn) */}
                <div className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs text-on-surface transition-colors shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">calendar_today</span>
                  <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Thời gian:</span>
                  <select
                    value={timeRangeFilter}
                    onChange={(e) => setTimeRangeFilter(e.target.value as any)}
                    className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer text-xs pr-1"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="1_MONTH">1 tháng</option>
                    <option value="3_MONTHS">3 tháng</option>
                    <option value="6_MONTHS">6 tháng</option>
                    <option value="CUSTOM">Tự chọn</option>
                  </select>
                </div>

                {/* Tự chọn khoảng ngày (chỉ hiện khi chọn Tự chọn) */}
                {timeRangeFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-xl border border-outline-variant/30 text-xs shadow-2xs animate-fadeIn">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent text-on-surface font-medium focus:outline-none cursor-pointer text-xs"
                      title="Từ ngày"
                    />
                    <span className="text-on-surface-variant font-bold">-</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent text-on-surface font-medium focus:outline-none cursor-pointer text-xs"
                      title="Đến ngày"
                    />
                  </div>
                )}

                {/* 4. Dropdown Nguồn tiền */}
                <div className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs text-on-surface transition-colors shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">account_balance_wallet</span>
                  <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Nguồn tiền:</span>
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer text-xs pr-1 max-w-[150px] truncate"
                  >
                    <option value="ALL">Tất cả tài khoản</option>
                    {displayAccounts.map((acc) => (
                      <option key={acc.id} value={acc.name}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Nút Xóa bộ lọc */}
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-label-sm text-label-sm font-semibold transition-colors cursor-pointer border border-red-200 shadow-2xs animate-fadeIn"
                    title="Xóa toàn bộ bộ lọc về mặc định"
                  >
                    <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                    <span>Xóa bộ lọc</span>
                  </button>
                )}
              </div>

              {/* Quick Action: Xuất XLSX */}
              <div className="flex items-center gap-space-xs ml-auto shrink-0">
                <button
                  onClick={() => alert('Đang trích xuất dữ liệu giao dịch định dạng Excel (.xlsx)...')}
                  className="flex items-center gap-1 px-space-md py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors cursor-pointer shadow-2xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">file_download</span>
                  <span>Xuất XLSX</span>
                </button>
              </div>
            </div>

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
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {isFiltered && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-bold shadow-sm hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                      <span>Xóa bộ lọc ({transactions.length} giao dịch)</span>
                    </button>
                  )}
                  <button
                    onClick={onOpenAddModal}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                  >
                    + Thêm giao dịch mới
                  </button>
                </div>
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
                    Biểu đồ Dòng tiền ({periodLabel})
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
                    Thu (+{(periodIncome / 1000000).toFixed(1)}M)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                  <span className="text-on-surface font-medium">
                    Chi (-{(periodExpense / 1000000).toFixed(2)}M)
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
                  d={chartData.incomeAreaPath}
                  fill="url(#incomeGrad)"
                />

                {/* Income Line */}
                <path
                  d={chartData.incomePath}
                  fill="none"
                  stroke="#006c4a"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                {chartData.incomeCoords.map((c, i) => (
                  <circle key={`inc-${i}`} cx={c.x} cy={c.y} fill="#006c4a" r="4" className="ring-2 ring-white" />
                ))}

                {/* Expense Line */}
                <path
                  d={chartData.expensePath}
                  fill="none"
                  stroke="#dc2626"
                  strokeDasharray="5,5"
                  strokeWidth="2.5"
                />
                {chartData.expenseCoords.map((c, i) => (
                  <circle key={`exp-${i}`} cx={c.x} cy={c.y} fill="#dc2626" r="3.5" />
                ))}
              </svg>
            </div>

            {/* X-axis Days */}
            <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant pt-space-xs">
              {chartData.points.map((p, idx) => (
                <span
                  key={idx}
                  className={`text-xs ${
                    p.isToday
                      ? 'font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded'
                      : ''
                  }`}
                >
                  {p.label}
                </span>
              ))}
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
