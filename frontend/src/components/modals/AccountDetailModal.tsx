import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Account, AccountType, Transaction, AccountUpdatePayload } from '../../types';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';
import { getCategoryTheme } from '../../utils/categoryTheme';

export interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountUpdated?: (updatedAccount: Account) => void;
  onOpenEditAccount?: (account: Account) => void;
  onOpenAddTransaction?: (initialData?: any) => void;
  onRefresh?: () => void;
  initialEditMode?: boolean;
}

type PeriodType = 'DAY' | 'MONTH' | 'YEAR';

const Dong: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`underline underline-offset-2 ${className}`}>₫</span>
);

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return `Tháng ${Number(m)}/${y}`;
};

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
  onOpenEditAccount: _onOpenEditAccount,
  onOpenAddTransaction,
  onRefresh,
  initialEditMode = false,
}) => {
  // Current local account copy so edits update live
  const [currentAccount, setCurrentAccount] = useState<Account | null>(account);

  // Edit Account Box State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editAccountNumber, setEditAccountNumber] = useState<string>('');
  const [editCreditLimit, setEditCreditLimit] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Transactions & Filter State (Default: DAY)
  const [periodType, setPeriodType] = useState<PeriodType>('DAY');
  
  // Date values for filtering
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const thisMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const thisYearNum = useMemo(() => new Date().getFullYear(), []);

  const [selectedMonth, setSelectedMonth] = useState<string>(thisMonthStr);
  const [selectedYear, setSelectedYear] = useState<number>(thisYearNum);

  // Budget-style Month Picker Popover State
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = thisMonthStr.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Close month picker popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Sync pickerYear when selectedMonth changes
  useEffect(() => {
    const [y] = selectedMonth.split('-').map(Number);
    if (y) setPickerYear(y);
  }, [selectedMonth]);

  // Transactions list state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(false);
  const activeRequestIdRef = useRef<number>(0);
  const accountRef = useRef<Account | null>(account);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  // Cleanup on unmount to cancel in-flight requests
  useEffect(() => {
    return () => {
      activeRequestIdRef.current++;
    };
  }, []);

  // Sync state when account prop changes or modal opens
  useEffect(() => {
    // Invalidate any ongoing transaction fetch from previous account
    activeRequestIdRef.current++;

    if (!isOpen || !account) {
      setTransactions([]);
      setIsLoadingTx(false);
      return;
    }

    // Immediately reset transactions and set loading to prevent showing stale transactions
    setTransactions([]);
    setIsLoadingTx(true);
    setCurrentAccount(account);
    setIsEditing(initialEditMode || false);
    setEditError(null);
    setEditSuccessMessage(null);
    setEditName(account.name || '');
    setEditAccountNumber(account.accountNumber || '');
    setEditCreditLimit(account.creditLimit ? formatCurrencyInput(account.creditLimit) : '');
    setEditNote(account.note || '');
    setIsMonthPickerOpen(false);
  }, [isOpen, account?.id, initialEditMode]);

  // Compute startDate & endDate according to periodType
  const dateRange = useMemo<{ startDate?: string; endDate?: string }>(() => {
    // KHI CHỌN NGÀY: Bỏ lọc theo ngày, lấy toàn bộ lịch sử để hiển thị nhóm theo ngày ("kéo full")
    if (periodType === 'DAY') {
      return {};
    }

    if (periodType === 'MONTH') {
      const [y, m] = selectedMonth.split('-').map(Number);
      if (!y || !m) return {};
      const lastDay = new Date(y, m, 0).getDate();
      const padM = String(m).padStart(2, '0');
      return {
        startDate: `${y}-${padM}-01`,
        endDate: `${y}-${padM}-${String(lastDay).padStart(2, '0')}`,
      };
    }

    if (periodType === 'YEAR') {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }

    return {};
  }, [periodType, selectedMonth, selectedYear]);

  // Fetch transactions for the current account and period
  const loadAccountTransactions = useCallback(async () => {
    const targetAccountId = currentAccount?.id || account?.id;
    if (!targetAccountId || !isOpen) {
      setIsLoadingTx(false);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsLoadingTx(true);

    try {
      const txs = await transactionService.getTransactions({
        accountId: targetAccountId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        size: 500,
      });

      // Discard stale response if another request has started or account changed
      if (currentRequestId !== activeRequestIdRef.current) {
        return;
      }
      const activeId = currentAccount?.id || account?.id;
      if (activeId !== targetAccountId) {
        return;
      }

      // Filter locally to ensure transactions belong to THIS specific account
      const filtered = (txs || []).filter(
        (t) => t.account?.id === targetAccountId || t.toAccount?.id === targetAccountId
      );

      // Sort by transaction date descending, then id descending
      filtered.sort((a, b) => {
        const d1 = new Date(a.date).getTime();
        const d2 = new Date(b.date).getTime();
        if (d1 !== d2) return d2 - d1;
        return (b.id || 0) - (a.id || 0);
      });

      if (currentRequestId === activeRequestIdRef.current) {
        setTransactions(filtered);
      }
    } catch (err) {
      if (currentRequestId === activeRequestIdRef.current) {
        console.error('Error loading account transactions:', err);
        setTransactions([]);
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoadingTx(false);
      }
    }
  }, [currentAccount?.id, account?.id, isOpen, dateRange]);

  // Fetch whenever filters change
  useEffect(() => {
    loadAccountTransactions();
  }, [loadAccountTransactions]);

  // Listen to global transaction updates (e.g. after adding a transaction)
  useEffect(() => {
    const handleTxUpdated = async () => {
      if (isOpen && currentAccount?.id) {
        loadAccountTransactions();
        try {
          const refreshed = await accountService.getAccountById(currentAccount.id);
          if (refreshed) {
            setCurrentAccount(refreshed);
            onAccountUpdated?.(refreshed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('finman_transactions_updated', handleTxUpdated);
    window.addEventListener('finman_accounts_updated', handleTxUpdated);
    return () => {
      window.removeEventListener('finman_transactions_updated', handleTxUpdated);
      window.removeEventListener('finman_accounts_updated', handleTxUpdated);
    };
  }, [isOpen, currentAccount?.id, loadAccountTransactions, onAccountUpdated]);

  // Calculate overall stats for current period
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const targetId = currentAccount?.id || account?.id;
    if (!targetId) return { income: 0, expense: 0, net: 0, count: 0 };

    const safeTransactions = transactions.filter(
      (tx) => tx.account?.id === targetId || tx.toAccount?.id === targetId
    );

    safeTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        income += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        expense += tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.account?.id === targetId) {
          expense += tx.amount;
        } else if (tx.toAccount?.id === targetId) {
          income += tx.amount;
        }
      }
    });

    return {
      income,
      expense,
      net: income - expense,
      count: safeTransactions.length,
    };
  }, [transactions, currentAccount?.id, account?.id]);

  // Group transactions by Date chronologically (like DashboardPage.tsx)
  const groupedTransactions = useMemo(() => {
    const targetId = currentAccount?.id || account?.id;
    if (!targetId) return [];

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

    const safeTransactions = transactions.filter(
      (tx) => tx.account?.id === targetId || tx.toAccount?.id === targetId
    );

    safeTransactions.forEach((tx) => {
      let group = map.get(tx.date);
      if (!group) {
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

          formattedDate = `${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`;
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
      } else if (tx.type === 'EXPENSE') {
        group.dayExpense += tx.amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.account?.id === targetId) {
          group.dayExpense += tx.amount;
        } else if (tx.toAccount?.id === targetId) {
          group.dayIncome += tx.amount;
        }
      }
    });

    return Array.from(map.values());
  }, [transactions, todayStr, yesterdayStr, currentAccount?.id, account?.id]);

  // Handle Edit Account Form Submission
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Tên tài khoản không được để trống.');
      return;
    }

    const payload: AccountUpdatePayload = {
      name: trimmedName,
      accountNumber: editAccountNumber.trim() || undefined,
      note: editNote.trim() || undefined,
    };

    if (currentAccount.type === 'CREDIT_CARD') {
      const parsedCredit = parseCurrencyInput(editCreditLimit);
      payload.creditLimit = parsedCredit;
    }

    setIsUpdating(true);
    setEditError(null);
    setEditSuccessMessage(null);

    try {
      const updated = await accountService.updateAccount(currentAccount.id, payload);
      setCurrentAccount(updated);
      setEditSuccessMessage('Cập nhật tài khoản thành công!');
      setIsEditing(false);

      if (onAccountUpdated) {
        onAccountUpdated(updated);
      }
      if (onRefresh) {
        onRefresh();
      }

      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
      setTimeout(() => setEditSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Error updating account:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Không thể cập nhật thông tin tài khoản. Vui lòng thử lại.';
      setEditError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    const ym = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
  };

  // Year navigation
  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  if (!isOpen || !currentAccount) return null;

  // Account Type visuals
  const getTypeConfig = (type: AccountType) => {
    switch (type) {
      case 'BANK':
        return {
          title: 'Tài khoản Ngân hàng',
          icon: 'account_balance',
          bg: 'bg-tertiary-fixed text-tertiary',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'CASH':
        return {
          title: 'Tiền mặt',
          icon: 'payments',
          bg: 'bg-amber-100 text-amber-800',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'CREDIT_CARD':
        return {
          title: 'Thẻ tín dụng',
          icon: 'credit_card',
          bg: 'bg-rose-100 text-rose-800',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'INVESTMENT':
        return {
          title: 'Đầu tư',
          icon: 'trending_up',
          bg: 'bg-purple-100 text-purple-800',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      default:
        return {
          title: 'Khác',
          icon: 'category',
          bg: 'bg-slate-100 text-slate-800',
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const typeConfig = getTypeConfig(currentAccount.type);
  const isCredit = currentAccount.type === 'CREDIT_CARD';
  const currentBalance = currentAccount.currentBalance || 0;
  const creditLimit = currentAccount.creditLimit || 0;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container: Max width 4xl, High 94vh, flex layout so transaction list scrolls full height */}
      <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/20 flex flex-col h-[94vh] max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ========================================================= */}
        {/* 1. FIXED MODAL HEADER */}
        {/* ========================================================= */}
        <header className="px-5 sm:px-7 py-3 sm:py-3.5 border-b border-surface-container/80 flex items-center justify-between bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${typeConfig.bg}`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {typeConfig.icon}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-title-md text-base sm:text-lg text-on-surface font-bold truncate">
                  {currentAccount.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badge} shrink-0`}
                >
                  {typeConfig.title}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate mt-0.5">
                {currentAccount.accountNumber
                  ? `STK: ${currentAccount.accountNumber}`
                  : currentAccount.note || 'Tài khoản quản lý tài chính'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. TOP TOOLBAR SECTION (Balance, Action Buttons, Filter Bar) */}
        {/* ========================================================= */}
        <div className="px-5 sm:px-7 pt-3.5 pb-3 flex flex-col gap-3 shrink-0 border-b border-surface-container/80 bg-surface-container-lowest">
          
          {/* Notification Alerts */}
          {editSuccessMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">
                check_circle
              </span>
              <span>{editSuccessMessage}</span>
            </div>
          )}

          {/* BALANCE BAR & ACTIONS */}
          <div className={`p-3 sm:p-4 rounded-2xl ${isCredit ? 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40' : currentBalance < 0 ? 'bg-red-50/70 border border-red-200/90' : 'bg-surface-container-low border border-outline-variant/30'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs`}>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  {isCredit ? 'Dư nợ hiện tại' : 'Số dư hiện tại'}
                </span>
                {isCredit ? (
                  currentBalance > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                      Đang nợ thẻ
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Đã thanh toán hết nợ
                    </span>
                  )
                ) : currentBalance < 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 border border-red-200">
                    Số dư âm
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                <span
                  className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    isCredit
                      ? currentBalance > 0
                        ? 'text-error'
                        : 'text-secondary'
                      : currentBalance >= 0
                      ? 'text-on-surface font-currency-display'
                      : 'text-error'
                  }`}
                >
                  {currentBalance.toLocaleString('vi-VN')}
                </span>
                <Dong className="text-base font-bold text-on-surface-variant" />

                {isCredit && creditLimit > 0 && (
                  <span className="ml-2 text-xs text-on-surface-variant">
                    (Khả dụng: <strong className="text-secondary font-bold">{Math.max(0, creditLimit - currentBalance).toLocaleString('vi-VN')}</strong> <Dong /> / Hạn mức: {creditLimit.toLocaleString('vi-VN')} <Dong />)
                  </span>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS: + TẠO GIAO DỊCH & THANH TOÁN (CREDIT) / SỬA TÀI KHOẢN (NON-CREDIT) */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* + TẠO GIAO DỊCH */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenAddTransaction && currentAccount) {
                    onOpenAddTransaction({ account: currentAccount });
                  }
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-primary-container text-on-primary text-xs sm:text-sm font-semibold hover:opacity-95 active:scale-95 shadow-md shadow-primary-container/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Tạo giao dịch mới cho tài khoản này"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo giao dịch</span>
              </button>

              {/* THANH TOÁN (Chỉ hiển thị khi là thẻ tín dụng) */}
              {isCredit && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAddTransaction && currentAccount) {
                      const payAccId = currentAccount.paymentAccountId;
                      onOpenAddTransaction({
                        type: 'TRANSFER',
                        toAccount: currentAccount,
                        ...(payAccId ? { account: { id: payAccId } } : {}),
                        amount: currentBalance > 0 ? currentBalance : undefined,
                        note: `Thanh toán thẻ tín dụng ${currentAccount.name}`,
                      });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold hover:opacity-95 active:scale-95 shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Thanh toán dư nợ thẻ tín dụng"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Thanh toán</span>
                </button>
              )}
            </div>
          </div>

          {/* BOX SỬA CHỮA ACCOUNT (COLLAPSIBLE FORM) */}
          {isEditing && (
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-secondary/40 shadow-md flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-surface-container/80 pb-2">
                <div className="flex items-center gap-2 text-on-surface font-semibold text-xs sm:text-sm">
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    edit_square
                  </span>
                  <span>Chỉnh sửa thông tin tài khoản</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {editError && (
                <div className="p-2 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 border border-error/20">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface">
                    Tên tài khoản: <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ví dụ: Nuôi con, Quỹ tiết kiệm..."
                    className="w-full bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Số tài khoản / Thẻ:
                  </label>
                  <input
                    type="text"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    placeholder="Ví dụ: 1903456789..."
                    className="w-full bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Hạn mức tín dụng: {isCredit ? '(Bắt buộc)' : '(Tùy chọn)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editCreditLimit}
                      onChange={(e) => setEditCreditLimit(formatCurrencyInput(e.target.value))}
                      placeholder="0"
                      className="w-full bg-surface-container-low text-on-surface pl-3 pr-8 py-1.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30 font-currency-row"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                      ₫
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface">
                    Ghi chú mục đích tài khoản:
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Ví dụ: Dùng cho chi phí ăn uống và tiền học cho con..."
                    className="w-full bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1 border-t border-surface-container/60">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-1.5 rounded-xl bg-secondary text-on-secondary text-xs font-semibold hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isUpdating && (
                      <span className="material-symbols-outlined text-[15px] animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* BỘ LỌC THỜI GIAN: NGÀY / THÁNG / NĂM */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  receipt_long
                </span>
                <h4 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Lịch sử giao dịch của tài khoản
                </h4>
              </div>

              {/* 3 TABS: NGÀY / THÁNG / NĂM */}
              <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPeriodType('DAY')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodType === 'DAY'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('MONTH')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodType === 'MONTH'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('YEAR')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodType === 'YEAR'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Năm
                </button>
              </div>
            </div>

            {/* CONTROLLER SECTION */}
            {/* 1. KHI CHỌN NGÀY: BỎ LỌC ĐI THEO YÊU CẦU, CHỈ HIỆN TỔNG QUAN VÀ KÉO FULL DANH SÁCH NHÓM THEO NGÀY */}
            {periodType === 'DAY' && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    calendar_view_day
                  </span>
                  Danh sách giao dịch phân nhóm theo từng ngày
                </span>

                <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-end">
                  <span className="text-secondary font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    Thu: +{stats.income.toLocaleString('vi-VN')} <Dong />
                  </span>
                  <span className="text-error font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    Chi: -{stats.expense.toLocaleString('vi-VN')} <Dong />
                  </span>
                </div>
              </div>
            )}

            {/* 2. KHI CHỌN THÁNG: CSS GIỐNG HỆT BÊN TRANG BUDGET (POPOVER 12 THÁNG, NĂM SELECTOR, THÁNG HIỆN TẠI) */}
            {periodType === 'MONTH' && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="relative" ref={monthPickerRef}>
                  <div className="flex items-center bg-surface-container-lowest px-1 py-0.5 rounded-xl border border-outline-variant/30 shadow-2xs">
                    {/* Previous Month */}
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      title="Tháng trước"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>

                    {/* Month Picker Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-on-surface hover:bg-surface-container transition-all cursor-pointer font-bold text-xs sm:text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        calendar_month
                      </span>
                      <span>{formatMonthLabel(selectedMonth)}</span>
                      
                    </button>

                    {/* Next Month */}
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      title="Tháng sau"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>

                  {/* Year & 12 Month Grid Popover (Exact CSS from BudgetPage) */}
                  {isMonthPickerOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
                      {/* Year Selector Bar */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container-high/60">
                        <button
                          type="button"
                          onClick={() => setPickerYear((prev) => prev - 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
                          title="Năm trước"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>

                        <div className="flex items-center gap-1.5 font-bold text-on-surface text-sm sm:text-base">
                          <span>Năm</span>
                          <select
                            value={pickerYear}
                            onChange={(e) => setPickerYear(Number(e.target.value))}
                            className="bg-surface-container-low px-2 py-0.5 rounded-lg border border-outline-variant/40 font-bold text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm"
                          >
                            {Array.from({ length: 31 }, (_, i) => 2015 + i).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPickerYear((prev) => prev + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
                          title="Năm sau"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </div>

                      {/* 12 Months Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const mStr = `${pickerYear}-${String(m).padStart(2, '0')}`;
                          const isSelected = selectedMonth === mStr;
                          const now = new Date();
                          const isCurrentMonth = now.getFullYear() === pickerYear && now.getMonth() + 1 === m;

                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedMonth(mStr);
                                setIsMonthPickerOpen(false);
                              }}
                              className={`py-2 px-1 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'bg-primary text-white shadow-sm font-bold scale-105'
                                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              Tháng {m}
                              {isCurrentMonth && !isSelected && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer Quick Action */}
                      <div className="mt-3 pt-2 border-t border-surface-container-high/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            setPickerYear(now.getFullYear());
                            setSelectedMonth(cur);
                            setIsMonthPickerOpen(false);
                          }}
                          className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                        >
                          Tháng hiện tại
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMonthPickerOpen(false)}
                          className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thống kê tháng */}
                <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-end">
                  <span className="text-secondary font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    Thu: +{stats.income.toLocaleString('vi-VN')} <Dong />
                  </span>
                  <span className="text-error font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    Chi: -{stats.expense.toLocaleString('vi-VN')} <Dong />
                  </span>
                </div>
              </div>
            )}

            {/* 3. KHI CHỌN NĂM */}
            {periodType === 'YEAR' && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    className="w-7 h-7 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
                    title="Năm trước"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1 rounded-lg border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      event
                    </span>
                    <span className="text-xs font-bold text-on-surface">Năm {selectedYear}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="w-7 h-7 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
                    title="Năm sau"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  {selectedYear !== thisYearNum && (
                    <button
                      type="button"
                      onClick={() => setSelectedYear(thisYearNum)}
                      className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-medium text-[11px] hover:bg-surface-container cursor-pointer ml-1"
                    >
                      Năm nay
                    </button>
                  )}
                </div>

                {/* Thống kê năm */}
                <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-end">
                  <span className="text-secondary font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    Thu: +{stats.income.toLocaleString('vi-VN')} <Dong />
                  </span>
                  <span className="text-error font-medium flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    Chi: -{stats.expense.toLocaleString('vi-VN')} <Dong />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. DEDICATED FULL-HEIGHT SCROLLABLE TRANSACTIONS LEDGER */}
        {/*    (User kéo full toàn bộ danh sách, có sticky date headers) */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-4 sm:px-7 py-3 space-y-4">
          {isLoadingTx ? (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
                progress_activity
              </span>
              <span className="text-xs">Đang tải lịch sử giao dịch...</span>
            </div>
          ) : groupedTransactions.length === 0 ? (
            <div className="py-16 px-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              </div>
              <h5 className="font-semibold text-base text-on-surface mt-1">Chưa có giao dịch nào</h5>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Không tìm thấy giao dịch nào của tài khoản này trong khoảng thời gian đã chọn.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAddTransaction && currentAccount) {
                    onOpenAddTransaction(currentAccount);
                  }
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tạo giao dịch ngay</span>
              </button>
            </div>
          ) : (
            /* GROUPED BY DATE CHRONOLOGICALLY - EXACTLY LIKE DashboardPage */
            <div className="space-y-4 pb-4">
              {groupedTransactions.map((group) => {
                const netDay = group.dayIncome - group.dayExpense;
                return (
                  <div key={group.date} className="relative">
                    {/* Day Summary Banner (Sticky per day group inside scroll container) */}
                    <div className="sticky top-0 z-10 py-1.5 px-3 sm:px-4 rounded-xl backdrop-blur-md bg-surface-container-low/95 border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-2 transition-all mb-2">
                      {/* Left: Date info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                          <span className="material-symbols-outlined text-[15px]">
                            calendar_today
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                            {group.formattedDate}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium">
                            {group.dayOfWeek}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-surface-container text-on-surface-variant font-medium text-[10px] shrink-0">
                            {group.items.length} giao dịch
                          </span>
                        </div>
                      </div>

                      {/* Right: Day Totals (Thu, Chi, Ròng) */}
                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto font-label-sm text-label-sm">
                        {/* Thu */}
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant text-[11px] hidden md:inline">Thu:</span>
                          <span className="text-secondary font-bold font-currency-row text-xs sm:text-sm">
                            +{group.dayIncome.toLocaleString('vi-VN')} <Dong />
                          </span>
                        </div>

                        <div className="h-3.5 w-px bg-outline-variant/30"></div>

                        {/* Chi */}
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant text-[11px] hidden md:inline">Chi:</span>
                          <span className="text-error font-bold font-currency-row text-xs sm:text-sm">
                            -{group.dayExpense.toLocaleString('vi-VN')} <Dong />
                          </span>
                        </div>

                        <div className="h-3.5 w-px bg-outline-variant/30"></div>

                        {/* Ròng */}
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant text-[11px] hidden md:inline">Ròng:</span>
                          <span
                            className={`font-bold font-currency-row text-xs sm:text-sm ${
                              netDay >= 0 ? 'text-secondary' : 'text-error'
                            }`}
                          >
                            {netDay >= 0 ? '+' : ''}
                            {netDay.toLocaleString('vi-VN')} <Dong />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transactions list under this date */}
                    <div className="flex flex-col gap-1.5 px-0.5">
                      {group.items.map((tx) => {
                        const isTransfer = tx.type === 'TRANSFER';
                        const isRecipient = tx.toAccount?.id === currentAccount.id;

                        let isPositive = false;
                        let amountPrefix = '';
                        let amountColor = '';
                        let subLabel = '';

                        if (tx.type === 'INCOME') {
                          isPositive = true;
                          amountPrefix = '+';
                          amountColor = 'text-secondary';
                          subLabel = tx.category?.name || 'Thu nhập';
                        } else if (tx.type === 'EXPENSE') {
                          isPositive = false;
                          amountPrefix = '-';
                          amountColor = 'text-error';
                          subLabel = tx.category?.name || 'Chi tiêu';
                        } else if (isTransfer) {
                          if (isRecipient) {
                            isPositive = true;
                            amountPrefix = '+';
                            amountColor = 'text-secondary';
                            subLabel = `Nhận từ: ${tx.account?.name || 'Tài khoản khác'}`;
                          } else {
                            isPositive = false;
                            amountPrefix = '-';
                            amountColor = 'text-blue-600';
                            subLabel = `Chuyển đến: ${tx.toAccount?.name || 'Tài khoản khác'}`;
                          }
                        }

                        return (
                          <div
                            key={tx.id}
                            className="py-2 px-3 sm:px-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low/80 transition-all flex items-center justify-between group shadow-xs border border-outline-variant/15"
                          >
                            {/* Left: Icon + Category/Transfer Info + Note */}
                            <div className="flex items-center gap-3 min-w-0">
                              {isTransfer ? (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">
                                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                                    sync_alt
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor: getCategoryTheme(tx.category).hexBg,
                                    color: getCategoryTheme(tx.category).hexColor,
                                  }}
                                >
                                  <span className="text-base sm:text-lg leading-none select-none">
                                    {getCategoryTheme(tx.category).emoji}
                                  </span>
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm text-on-surface font-semibold truncate">
                                    {tx.note || (isTransfer ? subLabel : (tx.category?.name || 'Giao dịch'))}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                      isTransfer
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-surface-container text-on-surface'
                                    }`}
                                  >
                                    {isTransfer
                                      ? 'Chuyển khoản'
                                      : (tx.category?.name || 'Khác')}
                                  </span>
                                </div>

                                <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                  <span className="font-medium text-on-surface">
                                    {isTransfer
                                      ? subLabel
                                      : tx.category?.name || 'Chi tiêu'}
                                  </span>
                                  {tx.time && (
                                    <>
                                      <span>•</span>
                                      <span>{tx.time}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Amount & Badge */}
                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs sm:text-sm font-bold font-currency-row block ${amountColor}`}
                              >
                                {amountPrefix}
                                {tx.amount.toLocaleString('vi-VN')} <Dong />
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-medium">
                                {isTransfer
                                  ? isRecipient
                                    ? 'Chuyển đến'
                                    : 'Chuyển đi'
                                  : isPositive
                                  ? 'Thu nhập'
                                  : 'Chi tiêu'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. MODAL FOOTER */}
        {/* ========================================================= */}
        <footer className="px-5 sm:px-7 py-2.5 border-t border-surface-container/80 flex items-center justify-between bg-surface-container-low text-xs text-on-surface-variant shrink-0">
          <span>Tổng số giao dịch: {stats.count}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold hover:bg-surface-container transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
};
