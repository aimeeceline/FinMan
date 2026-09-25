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
  onEditTransaction?: (tx: Transaction) => void;
  onApplyAiTransaction?: (tx: Omit<Transaction, 'id'>) => void;
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

// Format YYYY-MM-DD to DD/MM/YYYY
const formatVNDate = (isoDate?: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  accounts,
  categories = [],
  onOpenAddModal,
  onNavigateToAccounts,
  onNavigateToReports,
  onDeleteTransaction,
  onEditTransaction,
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

  // Pagination State (100 giao dịch/trang)
  const PAGE_SIZE = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        return `${formatVNDate(customStartDate)} – ${formatVNDate(customEndDate)}`;
      }
      if (customStartDate) return `Từ ${formatVNDate(customStartDate)}`;
      if (customEndDate) return `Đến ${formatVNDate(customEndDate)}`;
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

  // Type Dropdown State (Phân loại: Tất cả, Chi tiêu, Thu nhập)
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Category Dropdown State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [categorySearchText, setCategorySearchText] = useState<string>('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Date Picker Modal State (Tự chọn khoảng thời gian popup)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [showCalendarView, setShowCalendarView] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9);
  const [tempStartDate, setTempStartDate] = useState<string>('2026-09-01');
  const [tempEndDate, setTempEndDate] = useState<string>('2026-09-16');
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Account Dropdown State (Nguồn tiền)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
        setShowCalendarView(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTypeDropdownOpen(false);
        setIsCategoryDropdownOpen(false);
        setIsDatePickerOpen(false);
        setShowCalendarView(false);
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Calendar Days Computation for current month & year
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth - 1, 0).getDate();
    const firstDayDow = new Date(calendarYear, calendarMonth - 1, 1).getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = firstDayDow === 0 ? 6 : firstDayDow - 1;

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayOfWeekIndex: number;
    }[] = [];

    // 1. Previous month padding days
    const prevMonth = calendarMonth === 1 ? 12 : calendarMonth - 1;
    const prevYear = calendarMonth === 1 ? calendarYear - 1 : calendarYear;
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeekIndex: cells.length % 7,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeekIndex: cells.length % 7,
      });
    }

    // 3. Next month padding days to reach full weeks (target 35 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    const targetTotal = cells.length + remaining < 35 ? 35 : cells.length + remaining;
    const nextPadCount = targetTotal - cells.length;
    const nextMonth = calendarMonth === 12 ? 1 : calendarMonth + 1;
    const nextYear = calendarMonth === 12 ? calendarYear + 1 : calendarYear;
    for (let d = 1; d <= nextPadCount; d++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeekIndex: cells.length % 7,
      });
    }

    return cells;
  }, [calendarYear, calendarMonth]);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 1) {
        setCalendarYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 12) {
        setCalendarYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  const handleDayClick = (dateStr: string) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else {
      if (dateStr < tempStartDate) {
        setTempStartDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
    } else if (tempStartDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempStartDate);
    }
    setTimeRangeFilter('CUSTOM');
    setIsDatePickerOpen(false);
    setShowCalendarView(false);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setTimeRangeFilter('ALL');
    setAccountFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setTempStartDate('2026-09-01');
    setTempEndDate('2026-09-16');
    setIsTypeDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setShowCalendarView(false);
    setIsAccountDropdownOpen(false);
    setCurrentPage(1);
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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, timeRangeFilter, accountFilter, customStartDate, customEndDate]);

  // Sort transactions latest first
  const sortedFilteredTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [filteredTransactions]);

  // Total pages (100 transactions/page)
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedFilteredTransactions.length / PAGE_SIZE));
  }, [sortedFilteredTransactions.length, PAGE_SIZE]);

  // Paginated slice for current page
  const currentPageTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedFilteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedFilteredTransactions, currentPage, PAGE_SIZE]);

  // Group current page transactions by date chronologically (latest first)
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

    currentPageTransactions.forEach((tx) => {
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
  }, [currentPageTransactions, todayStr, yesterdayStr]);

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

      {/* 3. MAIN TRANSACTION LEDGER WORKSPACE */}
      <div className="w-full flex flex-col gap-space-lg">
        {/* Main Transaction Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/15">
            {/* Filter Toolbar with Dropdowns */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-sm pb-space-md border-b border-surface-container-high/60">
              {/* Dropdown Filters Group */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* 1. Custom Styled Dropdown Phân loại (Thu, Chi) */}
                <div className="relative" ref={typeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all cursor-pointer select-none shadow-2xs ${
                      isTypeDropdownOpen || typeFilter !== 'ALL'
                        ? 'border-2 border-blue-400 dark:border-blue-500/50 bg-surface-container text-on-surface font-semibold ring-2 ring-blue-500/15'
                        : 'border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                      PHÂN LOẠI:
                    </span>
                    <span className="font-bold text-xs text-slate-800 dark:text-on-surface">
                      {typeFilter === 'ALL' && 'Tất cả (Thu & Chi)'}
                      {typeFilter === 'EXPENSE' && 'Chi tiêu (-)'}
                      {typeFilter === 'INCOME' && 'Thu nhập (+)'}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-on-surface-variant transition-transform duration-200 ${
                        isTypeDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu Modal Card Phân loại */}
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 z-50 w-64 bg-white dark:bg-surface-container-lowest rounded-2xl shadow-xl border border-slate-100 dark:border-outline-variant/30 p-2.5 animate-fadeIn select-none">
                      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 dark:border-outline-variant/20 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
                          <span className="material-symbols-outlined text-[15px]">swap_vert</span>
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-on-surface uppercase tracking-wider">
                          Phân loại giao dịch
                        </span>
                      </div>

                      <div className="space-y-1">
                        {/* Tất cả */}
                        <button
                          type="button"
                          onClick={() => {
                            setTypeFilter('ALL');
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            typeFilter === 'ALL'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-900/40 shadow-2xs'
                              : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="material-symbols-outlined text-[17px]">sync_alt</span>
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-slate-800 dark:text-on-surface">Tất cả</div>
                              <div className="text-[10px] text-slate-400 dark:text-on-surface-variant font-medium">Bao gồm cả Thu & Chi</div>
                            </div>
                          </div>
                          {typeFilter === 'ALL' && (
                            <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400 font-bold">
                              check
                            </span>
                          )}
                        </button>

                        {/* Chi tiêu (-) */}
                        <button
                          type="button"
                          onClick={() => {
                            setTypeFilter('EXPENSE');
                            setCategoryFilter('ALL');
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            typeFilter === 'EXPENSE'
                              ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/40 shadow-2xs'
                              : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="material-symbols-outlined text-[17px]">arrow_downward</span>
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-slate-800 dark:text-on-surface">Chi tiêu (-)</div>
                              <div className="text-[10px] text-red-500/80 dark:text-red-400 font-medium">Chỉ xem khoản chi ra</div>
                            </div>
                          </div>
                          {typeFilter === 'EXPENSE' && (
                            <span className="material-symbols-outlined text-[18px] text-red-600 dark:text-red-400 font-bold">
                              check
                            </span>
                          )}
                        </button>

                        {/* Thu nhập (+) */}
                        <button
                          type="button"
                          onClick={() => {
                            setTypeFilter('INCOME');
                            setCategoryFilter('ALL');
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            typeFilter === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/40 shadow-2xs'
                              : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="material-symbols-outlined text-[17px]">arrow_upward</span>
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-slate-800 dark:text-on-surface">Thu nhập (+)</div>
                              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">Chỉ xem khoản thu vào</div>
                            </div>
                          </div>
                          {typeFilter === 'INCOME' && (
                            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400 font-bold">
                              check
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Custom Styled Dropdown Danh mục (Khớp giao diện Stitch/Screenshot) */}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs text-on-surface transition-all cursor-pointer select-none shadow-2xs ${
                      isCategoryDropdownOpen || categoryFilter !== 'ALL'
                        ? 'border-2 border-purple-400 dark:border-purple-500/50 bg-surface-container text-on-surface font-semibold ring-2 ring-purple-500/15'
                        : 'border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">category</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-[11px] uppercase tracking-wider">
                      DANH MỤC:
                    </span>
                    <span className="font-bold text-xs max-w-[140px] truncate text-slate-800 dark:text-on-surface">
                      {categoryFilter === 'ALL' ? 'Tất cả' : categoryFilter}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-on-surface-variant transition-transform duration-200 ${
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

                {/* 3. Dropdown Thời gian duy nhất (Gộp mốc thời gian & Lịch tự chọn) */}
                <div className="relative" ref={datePickerRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen((prev) => !prev);
                      setShowCalendarView(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all cursor-pointer select-none shadow-2xs ${
                      timeRangeFilter === 'CUSTOM'
                        ? 'border-2 border-red-500 bg-white dark:bg-surface-container-lowest text-slate-800 dark:text-on-surface hover:bg-red-50/40'
                        : isDatePickerOpen || timeRangeFilter !== 'ALL'
                        ? 'border-2 border-red-400 dark:border-red-500/50 bg-surface-container text-on-surface font-semibold ring-2 ring-red-500/15'
                        : 'border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${
                        timeRangeFilter === 'CUSTOM'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider">
                      THỜI GIAN:
                    </span>
                    <span className="font-bold text-xs text-slate-800 dark:text-on-surface">
                      {timeRangeFilter === 'ALL' && 'Tất cả'}
                      {timeRangeFilter === '1_MONTH' && '1 tháng'}
                      {timeRangeFilter === '3_MONTHS' && '3 tháng'}
                      {timeRangeFilter === '6_MONTHS' && '6 tháng'}
                      {timeRangeFilter === 'CUSTOM' &&
                        `${formatVNDate(customStartDate || '2026-09-01')} – ${formatVNDate(
                          customEndDate || '2026-09-16'
                        )}`}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-on-surface-variant transition-transform duration-200 ${
                        isDatePickerOpen ? 'rotate-180 text-red-600' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu hoặc Popover Lịch */}
                  {isDatePickerOpen && (
                    !showCalendarView ? (
                      /* 1. MENU CHỌN MỐC THỜI GIAN (Hiển thị đầu tiên khi bấm vào dropbox) */
                      <div className="absolute top-full mt-2 left-0 z-50 w-56 bg-white dark:bg-surface-container-lowest rounded-2xl shadow-xl border border-slate-100 dark:border-outline-variant/30 p-2 animate-fadeIn select-none">
                        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 dark:border-outline-variant/20 mb-1">
                          <span className="material-symbols-outlined text-[17px] text-red-600">calendar_today</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-on-surface uppercase tracking-wider">
                            Thời gian
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {[
                            { id: 'ALL', label: 'Tất cả' },
                            { id: '1_MONTH', label: '1 tháng' },
                            { id: '3_MONTHS', label: '3 tháng' },
                            { id: '6_MONTHS', label: '6 tháng' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setTimeRangeFilter(opt.id as TimeRangeOption);
                                setIsDatePickerOpen(false);
                                setShowCalendarView(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                timeRangeFilter === opt.id
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold'
                                  : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {timeRangeFilter === opt.id && (
                                <span className="material-symbols-outlined text-[18px] text-red-600">check</span>
                              )}
                            </button>
                          ))}

                          <div className="my-1 border-t border-slate-100 dark:border-outline-variant/20" />

                          {/* Bấm vào "Tự chọn" -> MỚI HIỆN LỊCH */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempStartDate) setTempStartDate(customStartDate || '2026-09-01');
                              if (!tempEndDate) setTempEndDate(customEndDate || '2026-09-16');
                              setShowCalendarView(true);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              timeRangeFilter === 'CUSTOM'
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold'
                                : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-red-600">date_range</span>
                              <span>Tự chọn</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {timeRangeFilter === 'CUSTOM' && (
                                <span className="material-symbols-outlined text-[18px] text-red-600">check</span>
                              )}
                              <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 2. CARD LỊCH CHỌN KHOẢNG THỜI GIAN TRA CỨU (Chỉ hiện khi bấm vào Tự chọn) */
                      <div className="absolute top-full mt-2.5 left-0 sm:left-auto sm:right-0 md:left-0 z-50 w-[350px] sm:w-[440px] bg-white dark:bg-surface-container-lowest rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] border border-slate-100 dark:border-outline-variant/30 p-5 sm:p-6 animate-fadeIn select-none">
                        {/* Tiêu đề & Năm tài chính & Nút quay lại */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-outline-variant/20">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowCalendarView(false)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-container cursor-pointer transition-colors flex items-center"
                              title="Quay lại danh sách mốc thời gian"
                            >
                              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            </button>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-on-surface uppercase tracking-wide">
                              CHỌN KHOẢNG THỜI GIAN TRA CỨU
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 dark:text-on-surface-variant font-medium">
                              Năm tài chính {calendarYear}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDatePickerOpen(false);
                                setShowCalendarView(false);
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-container cursor-pointer transition-colors"
                              title="Đóng"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>

                        {/* 2 Khối hiển thị: Từ ngày bắt đầu - Đến ngày kết thúc */}
                        <div className="grid grid-cols-2 gap-2.5 my-3.5">
                          <div className="bg-slate-50/90 dark:bg-surface-container-low border border-slate-200/80 dark:border-outline-variant/30 rounded-2xl p-2.5 sm:p-3">
                            <div className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider mb-1">
                              TỪ NGÀY BẮT ĐẦU
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-on-surface-variant">
                                calendar_today
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-on-surface">
                                {tempStartDate ? formatVNDate(tempStartDate) : '01/09/2026'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50/90 dark:bg-surface-container-low border border-slate-200/80 dark:border-outline-variant/30 rounded-2xl p-2.5 sm:p-3">
                            <div className="text-[10px] font-bold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider mb-1">
                              ĐẾN NGÀY KẾT THÚC
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-on-surface-variant">
                                calendar_today
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-on-surface">
                                {tempEndDate ? formatVNDate(tempEndDate) : '16/09/2026'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Thanh chuyển tháng: < Tháng 9, 2026 > */}
                        <div className="flex items-center justify-between py-1 px-1 mb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-on-surface-variant dark:hover:bg-surface-container transition-colors cursor-pointer"
                            title="Tháng trước"
                          >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                          </button>
                          <span className="font-bold text-sm text-slate-800 dark:text-on-surface">
                            Tháng {calendarMonth}, {calendarYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-on-surface-variant dark:hover:bg-surface-container transition-colors cursor-pointer"
                            title="Tháng sau"
                          >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                          </button>
                        </div>

                        {/* Header các ngày trong tuần: T2 -> CN */}
                        <div className="grid grid-cols-7 mb-1 text-center">
                          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                            <div
                              key={d}
                              className="text-xs font-semibold text-slate-400 dark:text-on-surface-variant py-1"
                            >
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Lưới lịch các ngày với dải hồng pastel range & nút tròn đỏ */}
                        <div className="grid grid-cols-7 gap-y-1">
                          {calendarDays.map((cell, idx) => {
                            const isStart = tempStartDate === cell.dateStr;
                            const isEnd = tempEndDate === cell.dateStr;
                            const isRangeActive = Boolean(
                              tempStartDate && tempEndDate && tempStartDate < tempEndDate
                            );
                            const isInRange =
                              isRangeActive &&
                              cell.dateStr > tempStartDate &&
                              cell.dateStr < tempEndDate;

                            return (
                              <div key={idx} className="relative h-9 sm:h-10 flex items-center justify-center">
                                {/* Dải nền đỏ nhạt peach kết nối các ngày trong khoảng */}
                                {isInRange && (
                                  <div
                                    className={`absolute inset-y-1 inset-x-0 bg-red-50/90 dark:bg-red-950/40 ${
                                      cell.dayOfWeekIndex === 0 ? 'rounded-l-full' : ''
                                    } ${cell.dayOfWeekIndex === 6 ? 'rounded-r-full' : ''}`}
                                  />
                                )}
                                {/* Nửa dải bên phải nối từ ngày bắt đầu sang ngày kế tiếp */}
                                {isStart && isRangeActive && (
                                  <div className="absolute inset-y-1 right-0 left-1/2 bg-red-50/90 dark:bg-red-950/40" />
                                )}
                                {/* Nửa dải bên trái nối từ ngày trước đến ngày kết thúc */}
                                {isEnd && isRangeActive && (
                                  <div className="absolute inset-y-1 left-0 right-1/2 bg-red-50/90 dark:bg-red-950/40" />
                                )}

                                {/* Nút bấm ngày */}
                                <button
                                  type="button"
                                  onClick={() => handleDayClick(cell.dateStr)}
                                  className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                                    isStart || isEnd
                                      ? 'bg-red-600 text-white font-extrabold shadow-md hover:bg-red-700 active:scale-95'
                                      : isInRange
                                      ? 'text-slate-800 dark:text-on-surface font-semibold hover:bg-red-100/60'
                                      : cell.isCurrentMonth
                                      ? 'text-slate-700 dark:text-on-surface hover:bg-slate-100 dark:hover:bg-surface-container'
                                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-surface-container-low'
                                  }`}
                                >
                                  {cell.dayNumber}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Nút hành động "Áp dụng khoảng ngày" */}
                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              handleApplyDateRange();
                              setShowCalendarView(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-2xl shadow-lg shadow-red-500/25 transition-all cursor-pointer"
                          >
                            Áp dụng khoảng ngày
                          </button>
                          {(tempStartDate || tempEndDate) && (
                            <button
                              type="button"
                              onClick={() => {
                                setTempStartDate('');
                                setTempEndDate('');
                              }}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-on-surface font-medium transition-colors cursor-pointer px-2 py-1"
                            >
                              Đặt lại
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* 4. Custom Styled Dropdown Nguồn tiền */}
                <div className="relative" ref={accountDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all cursor-pointer select-none shadow-2xs ${
                      isAccountDropdownOpen || accountFilter !== 'ALL'
                        ? 'border-2 border-amber-400 dark:border-amber-500/50 bg-surface-container text-on-surface font-semibold ring-2 ring-amber-500/15'
                        : 'border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                    </div>
                    <span className="text-amber-700 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                      NGUỒN TIỀN:
                    </span>
                    <span className="font-bold text-xs max-w-[150px] truncate text-slate-800 dark:text-on-surface">
                      {accountFilter === 'ALL' ? 'Tất cả tài khoản' : accountFilter}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-on-surface-variant transition-transform duration-200 ${
                        isAccountDropdownOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu Modal Card Nguồn tiền */}
                  {isAccountDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 md:left-0 z-50 w-72 bg-white dark:bg-surface-container-lowest rounded-2xl shadow-xl border border-slate-100 dark:border-outline-variant/30 p-2.5 animate-fadeIn select-none">
                      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 dark:border-outline-variant/20 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-2xs">
                          <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-on-surface uppercase tracking-wider">
                          Nguồn tiền & Tài khoản
                        </span>
                      </div>

                      <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll pr-0.5">
                        {/* Tất cả tài khoản */}
                        <button
                          type="button"
                          onClick={() => {
                            setAccountFilter('ALL');
                            setIsAccountDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            accountFilter === 'ALL'
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold border border-amber-100 dark:border-amber-900/40 shadow-2xs'
                              : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-slate-800 dark:text-on-surface">Tất cả tài khoản</div>
                              <div className="text-[10px] text-slate-400 dark:text-on-surface-variant font-medium">Toàn bộ các ví & tài khoản</div>
                            </div>
                          </div>
                          {accountFilter === 'ALL' && (
                            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 font-bold">
                              check
                            </span>
                          )}
                        </button>

                        {displayAccounts.length > 0 && (
                          <div className="my-1 border-t border-slate-100 dark:border-outline-variant/20" />
                        )}

                        {/* Danh sách từng tài khoản */}
                        {displayAccounts.map((acc) => {
                          const isSelected = accountFilter === acc.name;
                          let iconName = 'account_balance_wallet';
                          let iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                          let typeLabel = 'Tài khoản';

                          if (acc.type === 'CASH') {
                            iconName = 'payments';
                            iconBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
                            typeLabel = 'Tiền mặt ví';
                          } else if (acc.type === 'BANK') {
                            iconName = 'account_balance';
                            iconBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400';
                            typeLabel = acc.bankName || 'Ngân hàng';
                          } else if (acc.type === 'CREDIT_CARD') {
                            iconName = 'credit_card';
                            iconBg = 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400';
                            typeLabel = 'Thẻ tín dụng';
                          }

                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setAccountFilter(acc.name);
                                setIsAccountDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold border border-amber-100 dark:border-amber-900/40 shadow-2xs'
                                  : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}>
                                  <span className="material-symbols-outlined text-[17px]">{iconName}</span>
                                </div>
                                <div className="text-left truncate">
                                  <div className="text-xs font-semibold text-slate-800 dark:text-on-surface truncate">
                                    {acc.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-on-surface-variant flex items-center gap-1 font-medium">
                                    <span>{typeLabel}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-600 dark:text-on-surface">
                                      {acc.currentBalance.toLocaleString('vi-VN')} ₫
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 font-bold ml-2">
                                  check
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                                  onClick={() => {
                                    if (onEditTransaction) {
                                      onEditTransaction(tx);
                                    } else {
                                      onOpenAddModal();
                                    }
                                  }}
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

            {/* Pagination Controls (100 giao dịch/trang) */}
            {totalPages > 1 && (
              <div className="mt-space-lg flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-outline-variant/15 select-none">
                <div className="text-xs font-medium text-on-surface-variant">
                  Trang <span className="font-bold text-on-surface">{currentPage}</span> /{' '}
                  <span className="font-bold text-on-surface">{totalPages}</span> ({sortedFilteredTransactions.length} giao dịch)
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Trang trước */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    <span>Trước</span>
                  </button>

                  {/* Danh sách trang */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const hasGap = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === page
                                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  {/* Trang sau */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sau</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
