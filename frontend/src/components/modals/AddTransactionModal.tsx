import React, { useState, useEffect, useMemo } from 'react';
import type { Account, Category, Transaction, AccountType, Budget } from '../../types';
import { categoryService } from '../../services/categoryService';
import { budgetService } from '../../services/budgetService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

export interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (id: number, transaction: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
  accounts?: Account[];
  categories?: Category[];
  transactions?: Transaction[];
  budgets?: Budget[];
  onCategoryCreated?: (newCategory: Category) => void;
}

// Preset Quick Amount Chips
const QUICK_AMOUNTS = [
  { label: '10.000đ', value: 10000 },
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '500.000đ', value: 500000 },
  { label: '1.000.000đ', value: 1000000 },
  { label: '2.000.000đ', value: 2000000 },
];

// Helper: Format VND
const formatVND = (num: number): string => {
  return `${num.toLocaleString('vi-VN')}đ`;
};

// Helper: Get Account Emoji Icon
const getAccountEmoji = (type: AccountType): string => {
  switch (type) {
    case 'CASH':
      return '💵';
    case 'BANK':
      return '🏛️';
    case 'CREDIT_CARD':
      return '💳';
    default:
      return '💰';
  }
};

// Preset category visual styling & icon fallback
const CATEGORY_STYLES: Record<
  string,
  { emoji: string; bg: string; text: string }
> = {
  'Ăn uống': { emoji: '🍜', bg: 'bg-red-100', text: 'text-red-700' },
  'Áo quần': { emoji: '👕', bg: 'bg-blue-100', text: 'text-blue-700' },
  'Mua sắm': { emoji: '🛒', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Giao thông': { emoji: '🚕', bg: 'bg-amber-100', text: 'text-amber-700' },
  'Giải trí': { emoji: '🎮', bg: 'bg-purple-100', text: 'text-purple-700' },
  'Sinh hoạt': { emoji: '🏠', bg: 'bg-rose-100', text: 'text-rose-700' },
  'Sức khỏe': { emoji: '💊', bg: 'bg-pink-100', text: 'text-pink-700' },
  'Giáo dục': { emoji: '📚', bg: 'bg-teal-100', text: 'text-teal-700' },
  'Chi tiêu khác': { emoji: '📦', bg: 'bg-slate-100', text: 'text-slate-700' },
  'Lương': { emoji: '💼', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Thưởng': { emoji: '🎁', bg: 'bg-amber-100', text: 'text-amber-700' },
  'Đầu tư': { emoji: '📈', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Freelance': { emoji: '💻', bg: 'bg-sky-100', text: 'text-sky-700' },
  'Thu nhập khác': { emoji: '🪙', bg: 'bg-violet-100', text: 'text-violet-700' },
};

const PRESET_ICONS = [
  '🍜', '👕', '🛒', '🚕', '🎮', '🏠', '💊', '📚', '☕', '✈️',
  '🎬', '📱', '💻', '🎁', '📈', '📦', '⚽', '🛠️', '🪙', '💰'
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  accounts = [],
  categories,
  transactions: _transactions = [],
  budgets: externalBudgets,
  onCategoryCreated,
}) => {
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories || []);
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState<string>('');
  const [internalBudgets, setInternalBudgets] = useState<Budget[]>([]);

  // Fetch real budget data from backend for the transaction month
  useEffect(() => {
    if (!isOpen) return;
    const currentMonth = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    budgetService.getBudgets(currentMonth)
      .then((data) => {
        setInternalBudgets(data || []);
      })
      .catch((err) => {
        console.error('Error fetching real budgets in AddTransactionModal:', err);
        setInternalBudgets([]);
      });
  }, [isOpen, date]);

  // Combined active budgets
  const activeBudgets = externalBudgets && externalBudgets.length > 0 ? externalBudgets : internalBudgets;

  // Quick category creation modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('🍜');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  // Sync form state when editingTransaction or isOpen changes
  useEffect(() => {
    if (!isOpen) return;
    if (editingTransaction) {
      setType(editingTransaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setAmount(editingTransaction.amount);
      setDate(editingTransaction.date);
      if (editingTransaction.time) {
        setTime(editingTransaction.time);
      }
      setNote(editingTransaction.note || '');
      if (editingTransaction.account) {
        const matchedAcc = accounts.find((a) => a.id === editingTransaction.account.id);
        if (matchedAcc) setSelectedAccount(matchedAcc);
      }
      if (editingTransaction.category) {
        const matchedCat = categoriesList.find((c) => c.id === editingTransaction.category.id);
        if (matchedCat) setSelectedCategory(matchedCat);
      }
    } else {
      setType('EXPENSE');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setNote('');
    }
  }, [isOpen, editingTransaction]);

  // Sync categories prop
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    } else if (isOpen) {
      categoryService
        .getCategories()
        .then((data) => {
          setCategoriesList(data);
        })
        .catch((err) => console.error('Error fetching categories in modal:', err));
    }
  }, [categories, isOpen]);

  const filteredCategories = useMemo(() => {
    return categoriesList.filter((c) =>
      type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
    );
  }, [categoriesList, type]);

  // Sync selectedCategory when type or filteredCategories change
  useEffect(() => {
    if (filteredCategories.length > 0) {
      if (
        !selectedCategory ||
        selectedCategory.type !== type ||
        !filteredCategories.some((c) => c.id === selectedCategory.id)
      ) {
        setSelectedCategory(filteredCategories[0]);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [filteredCategories, type, selectedCategory]);

  // Sync selectedAccount
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccount || !accounts.some((a) => a.id === selectedAccount.id)) {
        setSelectedAccount(accounts[0]);
      }
    } else {
      setSelectedAccount(null);
    }
  }, [accounts, selectedAccount]);

  // Shortcuts: Escape to close, Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddCategoryModal) {
          setShowAddCategoryModal(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showAddCategoryModal, onClose]);

  // Calculate realtime category budget stats using REAL database budget data
  const budgetStats = useMemo(() => {
    if (type !== 'EXPENSE' || !selectedCategory) return null;

    const currentYearMonth = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const currentMonthNum = parseInt(currentYearMonth.slice(5, 7), 10);
    const currentYear = currentYearMonth.slice(0, 4);
    const monthLabel = `Tháng ${currentMonthNum}/${currentYear}`;

    // Find real budget in database for this category & month
    const realBudget = activeBudgets.find(
      (b) => b.category?.id === selectedCategory.id
    );

    if (!realBudget) {
      return {
        monthLabel,
        hasBudget: false,
        limit: 0,
        spent: 0,
        remaining: 0,
        percentage: 0,
        isOverBudget: false,
        isWarning: false,
      };
    }

    const limit = realBudget.amount ?? realBudget.allocatedAmount ?? 0;
    if (limit <= 0) {
      return {
        monthLabel,
        hasBudget: false,
        limit: 0,
        spent: 0,
        remaining: 0,
        percentage: 0,
        isOverBudget: false,
        isWarning: false,
      };
    }

    // Existing spent from real database
    let existingSpent = realBudget.spentAmount ?? 0;

    // If editing existing transaction, adjust base spent so we don't double count
    if (
      editingTransaction &&
      editingTransaction.category?.id === selectedCategory.id &&
      editingTransaction.date &&
      editingTransaction.date.startsWith(currentYearMonth) &&
      editingTransaction.type === 'EXPENSE'
    ) {
      existingSpent = Math.max(0, existingSpent - (editingTransaction.amount || 0));
    }

    const projectedSpent = existingSpent + (Number(amount) || 0);
    const remaining = limit - projectedSpent;
    const percentage = Math.round((projectedSpent / limit) * 100);

    return {
      monthLabel,
      hasBudget: true,
      spent: projectedSpent,
      limit,
      remaining,
      percentage,
      isOverBudget: projectedSpent > limit,
      isWarning: percentage >= 80 && percentage <= 100,
    };
  }, [type, selectedCategory, date, activeBudgets, amount, editingTransaction]);

  if (!isOpen) return null;

  const handleAddQuickAmount = (val: number) => {
    setAmount((prev) => prev + val);
  };

  const handleClearAmount = () => {
    setAmount(0);
  };

  const handleSetToday = () => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(yesterday.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday = date === yesterdayDate.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !selectedCategory || !selectedAccount) return;

    if (editingTransaction && onUpdateTransaction) {
      onUpdateTransaction(editingTransaction.id, {
        amount,
        type,
        category: selectedCategory,
        account: selectedAccount,
        date,
        time,
        note: note.trim() || undefined,
      });
    } else {
      onAddTransaction({
        amount,
        type,
        category: selectedCategory,
        account: selectedAccount,
        date,
        time,
        note: note.trim() || undefined,
      });
    }

    // Reset form & close
    setAmount(0);
    setNote('');
    onClose();
  };

  // Handle creating a new category on the fly
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setIsSavingCategory(true);
      const created = await categoryService.createCategory({
        name: newCatName.trim(),
        type,
        icon: newCatIcon,
      });

      setCategoriesList((prev) => [...prev, created]);
      setSelectedCategory(created);
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      setNewCatName('');
      setShowAddCategoryModal(false);
    } catch (err) {
      console.error('Lỗi khi tạo danh mục mới:', err);
      alert('Không thể tạo danh mục mới. Vui lòng thử lại!');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const hasNoAccounts = accounts.length === 0;

  // Render Category Icon (handles emoji vs material symbol)
  const renderCategoryIcon = (cat: Category, isSelected: boolean) => {
    const style = CATEGORY_STYLES[cat.name];
    const displayIcon = style?.emoji || cat.icon || '🏷️';

    // If icon is an emoji (length <= 4 and contains non-ascii)
    if (/\p{Extended_Pictographic}/u.test(displayIcon)) {
      return <span>{displayIcon}</span>;
    }

    // Material symbol name
    return (
      <span
        className={`material-symbols-outlined text-[20px] ${
          isSelected ? 'text-white' : style?.text || 'text-slate-700'
        }`}
      >
        {displayIcon}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 transition-all duration-300 select-none animate-fadeIn"
      data-purpose="modal-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="bg-white w-full max-w-4xl rounded-3xl shadow-modal border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <header
          className={`relative px-7 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between transition-colors duration-300 ${
            type === 'EXPENSE'
              ? 'bg-gradient-to-r from-red-50/70 via-white to-amber-50/30'
              : 'bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-full border p-0.5 flex items-center justify-center shadow-md transition-colors ${
                  type === 'EXPENSE'
                    ? 'border-amber-300/40 bg-amber-50 text-amber-600'
                    : 'border-emerald-300/40 bg-emerald-50 text-emerald-600'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {type === 'EXPENSE' ? 'payments' : 'savings'}
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    type === 'EXPENSE' ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${
                    type === 'EXPENSE' ? 'bg-red-600' : 'bg-emerald-600'
                  }`}
                ></span>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {editingTransaction
                  ? `Cập nhật thông tin giao dịch #${editingTransaction.id}`
                  : type === 'EXPENSE'
                  ? 'Ghi nhận chi phí sinh hoạt & dòng tiền ra'
                  : 'Ghi nhận nguồn thu nhập & tích lũy tài sản'}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </button>
        </header>

        {/* Scrollable Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scroll px-7 py-5 space-y-5 flex-1">
          {hasNoAccounts && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 shadow-sm">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              <span>
                Bạn chưa có tài khoản/ví nào. Vui lòng vào trang{' '}
                <strong>Tài khoản & Tài sản</strong> để tạo tài khoản trước khi ghi nhận giao dịch.
              </span>
            </div>
          )}

          {/* Transaction Type Switcher (Tabs) */}
          <div className="flex justify-center">
            <nav
              aria-label="Loại giao dịch"
              className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl gap-1 border border-slate-200/80 shadow-inner"
            >
              {/* Expense Tab */}
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-red-600 text-white shadow-glow-red'
                    : 'text-slate-600 hover:text-red-700 hover:bg-white/80'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
                <span>Khoản Chi tiêu</span>
              </button>

              {/* Income Tab */}
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-glow-emerald font-bold'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
                <span>Khoản Thu nhập</span>
              </button>
            </nav>
          </div>

          {/* Big Amount Hero Input */}
          <div
            className={`border rounded-2xl p-5 text-center shadow-sm transition-all ${
              type === 'EXPENSE'
                ? 'bg-gradient-to-b from-red-50/60 to-transparent border-red-100'
                : 'bg-gradient-to-b from-emerald-50/60 to-transparent border-emerald-100'
            }`}
          >
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                type === 'EXPENSE' ? 'text-red-600/80' : 'text-emerald-600/80'
              }`}
            >
              {type === 'EXPENSE' ? 'Số tiền chi tiêu' : 'Số tiền thu nhập'}
            </label>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {type === 'EXPENSE' ? '-' : '+'}
              </span>
              <input
                className={`w-52 sm:w-72 text-center text-3xl sm:text-4xl font-extrabold bg-transparent border-0 border-b-2 outline-none focus:outline-none focus:ring-0 p-0 pb-0.5 tracking-tight font-currency-display ${
                  type === 'EXPENSE'
                    ? 'text-red-600 border-red-300 focus:border-red-600'
                    : 'text-emerald-600 border-emerald-300 focus:border-emerald-600'
                }`}
                type="text"
                inputMode="numeric"
                autoFocus
                value={amount > 0 ? formatCurrencyInput(amount) : ''}
                onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
                placeholder="0"
              />
              <span
                className={`text-xl sm:text-2xl font-bold underline ${
                  type === 'EXPENSE'
                    ? 'text-red-600 decoration-red-300'
                    : 'text-emerald-600 decoration-emerald-300'
                }`}
              >
                đ
              </span>
            </div>

            {/* Quick Denomination Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => handleAddQuickAmount(q.value)}
                  className={`px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer ${
                    type === 'EXPENSE'
                      ? 'hover:border-red-400 hover:text-red-600 hover:bg-red-50/50'
                      : 'hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                  }`}
                >
                  +{q.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAmount}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                    : 'text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Xóa số tiền về 0"
              >
                Xóa (C)
              </button>
            </div>
          </div>

          {/* Main Form: Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
            {/* LEFT COLUMN: Categories Selection (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      type === 'EXPENSE' ? 'bg-red-600' : 'bg-emerald-600'
                    }`}
                  ></span>
                  Chọn Danh mục {type === 'EXPENSE' ? 'chi tiêu' : 'thu nhập'}
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredCategories.length} danh mục
                </span>
              </div>

              {/* Categories Grid (3 Columns) */}
              <div className="grid grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto custom-scroll pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  const style = CATEGORY_STYLES[cat.name];
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer text-center group ${
                        isSelected
                          ? type === 'EXPENSE'
                            ? 'bg-red-50/90 border-2 border-red-500 shadow-sm text-red-900 scale-[1.02]'
                            : 'bg-emerald-50/90 border-2 border-emerald-500 shadow-sm text-emerald-900 scale-[1.02]'
                          : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700 hover:scale-[1.02]'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2 text-xl transition-all shadow-sm ${
                          isSelected
                            ? type === 'EXPENSE'
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-emerald-600 text-white shadow-md'
                            : style?.bg || 'bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        {renderCategoryIcon(cat, isSelected)}
                      </div>
                      <span
                        className={`text-xs truncate w-full ${
                          isSelected ? 'font-bold' : 'font-semibold'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}

                {/* Button: Thêm mới danh mục */}
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-700 cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-slate-200/80 flex items-center justify-center mb-2 transition-colors">
                    <svg
                      className="w-6 h-6 text-slate-500 group-hover:text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 4v16m8-8H4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                  <span className="text-xs font-bold">Thêm mới</span>
                </button>
              </div>

              {/* Realtime Category Budget Status Bar (For Expense) */}
              {budgetStats && (
                budgetStats.hasBudget ? (
                  <div
                    className={`p-3.5 border rounded-2xl transition-all animate-fadeIn ${
                      budgetStats.isOverBudget
                        ? 'bg-red-50/70 border-red-200/80'
                        : budgetStats.isWarning
                        ? 'bg-amber-50/70 border-amber-200/80'
                        : 'bg-emerald-50/50 border-emerald-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          budgetStats.isOverBudget
                            ? 'text-red-900'
                            : budgetStats.isWarning
                            ? 'text-amber-900'
                            : 'text-emerald-900'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            budgetStats.isOverBudget
                              ? 'text-red-600'
                              : budgetStats.isWarning
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            fillRule="evenodd"
                          ></path>
                        </svg>
                        Ngân sách "{selectedCategory?.name}" {budgetStats.monthLabel}:
                      </span>
                      <span
                        className={`font-semibold font-currency-row ${
                          budgetStats.isOverBudget
                            ? 'text-red-800'
                            : budgetStats.isWarning
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        Đã chi {formatVND(budgetStats.spent)} / {formatVND(budgetStats.limit)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          budgetStats.isOverBudget
                            ? 'bg-red-500'
                            : budgetStats.isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(budgetStats.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] font-semibold mt-1 flex items-center justify-between">
                      <span
                        className={
                          budgetStats.remaining < 0 ? 'text-red-700' : 'text-emerald-700'
                        }
                      >
                        {budgetStats.remaining < 0
                          ? `Vượt ngân sách: ${formatVND(Math.abs(budgetStats.remaining))}`
                          : `Còn lại: ${formatVND(budgetStats.remaining)}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          budgetStats.isOverBudget
                            ? 'bg-red-100 text-red-800'
                            : budgetStats.isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {budgetStats.isOverBudget
                          ? `Vượt mức (${budgetStats.percentage}%)`
                          : budgetStats.isWarning
                          ? `Cảnh báo (${budgetStats.percentage}%)`
                          : `An toàn (${Math.max(0, 100 - budgetStats.percentage)}%)`}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 border border-slate-200/80 rounded-2xl bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 transition-all">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">info</span>
                      Chưa thiết lập ngân sách cho "{selectedCategory?.name}" ({budgetStats.monthLabel})
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Không giới hạn</span>
                  </div>
                )
              )}
            </div>

            {/* RIGHT COLUMN: Payment Account & Metadata (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              {/* Payment Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">
                    account_balance_wallet
                  </span>
                  Tài khoản thanh toán
                </label>
                <div className="relative">
                  <select
                    value={selectedAccount?.id || ''}
                    onChange={(e) => {
                      const acc = accounts.find((a) => a.id === Number(e.target.value));
                      if (acc) setSelectedAccount(acc);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {getAccountEmoji(a.type)} {a.name} (Khả dụng:{' '}
                        {a.currentBalance.toLocaleString('vi-VN')} đ)
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date & Time Picker Row */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">
                      schedule
                    </span>
                    Thời gian ghi nhận
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        isToday
                          ? type === 'EXPENSE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={handleSetYesterday}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        isYesterday
                          ? type === 'EXPENSE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hôm qua
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold py-2 px-3 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold py-2 px-3 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Note / Description Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">
                    edit_note
                  </span>
                  Ghi chú giao dịch
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Nhập nội dung chi tiết (ví dụ: Cà phê Highlands, Tiền xăng...)"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <footer className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[10px] font-mono text-slate-600">
                Enter
              </span>
              <span>để lưu</span>
              <span className="mx-1">•</span>
              <span className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[10px] font-mono text-slate-600">
                Esc
              </span>
              <span>để đóng</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/80 transition-colors shadow-sm cursor-pointer"
              >
                Hủy bỏ
              </button>

              {/* Save Primary CTA Button */}
              <button
                type="submit"
                disabled={amount <= 0 || hasNoAccounts || !selectedCategory || !selectedAccount}
                className={`px-7 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'EXPENSE'
                    ? 'bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-glow-red'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-glow-emerald'
                }`}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
                <span>{editingTransaction ? 'Lưu thay đổi (Enter)' : 'Lưu giao dịch (Enter)'}</span>
              </button>
            </div>
          </footer>
        </form>

        {/* Inline Quick Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  Thêm danh mục {type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'} mới
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Du lịch, Thú cưng, Bảo hiểm..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chọn biểu tượng icon
                  </label>
                  <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto custom-scroll p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCatIcon(icon)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                          newCatIcon === icon
                            ? 'bg-red-600 text-white shadow-md scale-105'
                            : 'bg-white hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!newCatName.trim() || isSavingCategory}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingCategory ? 'Đang tạo...' : 'Tạo danh mục'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
