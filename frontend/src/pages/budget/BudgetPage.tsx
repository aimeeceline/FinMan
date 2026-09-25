import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { categoryService } from '../../services/categoryService';
import { budgetService } from '../../services/budgetService';
import type { BudgetSummary } from '../../services/budgetService';
import { transactionService } from '../../services/transactionService';
import type { Budget, Category, Transaction } from '../../types';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';
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

const renderCategoryIcon = (icon?: string, sizeClass = 'text-[18px]') => {
  if (!icon) {
    return <span className={`material-symbols-outlined ${sizeClass}`}>payments</span>;
  }
  const isEmoji = /\p{Extended_Pictographic}/u.test(icon) || icon.length <= 2;
  if (isEmoji) {
    return <span className="text-base leading-none">{icon}</span>;
  }
  return <span className={`material-symbols-outlined ${sizeClass}`}>{icon}</span>;
};

export const BudgetPage: React.FC = () => {
  // State: Month Selection (Defaults to September 2026 or current month)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = '2026-09'.split('-').map(Number);
    return y || 2026;
  });
  const pickerRef = useRef<HTMLDivElement>(null);
  const [formMonth, setFormMonth] = useState<string>('2026-09');

  // State: Core Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State: Filter Tabs for Category List ('ALL' | 'WARNING' | 'SAFE')
  const [filterTab, setFilterTab] = useState<'ALL' | 'WARNING' | 'SAFE'>('ALL');

  // State: Calendar Interactive Selection
  const [selectedDay, setSelectedDay] = useState<number>(16);

  // State: Modal for Adding / Editing Budget
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<number>(0);
  const [isFormCategoryDropdownOpen, setIsFormCategoryDropdownOpen] = useState<boolean>(false);
  const [formCategorySearch, setFormCategorySearch] = useState<string>('');
  const formCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State: Toast Notification
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const showToast = useCallback((title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Close picker popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
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

  // Close form category dropdown popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        formCategoryDropdownRef.current &&
        !formCategoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFormCategoryDropdownOpen(false);
      }
    };
    if (isFormCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFormCategoryDropdownOpen]);

  // Selected category in modal
  const selectedFormCategory = useMemo(() => {
    return categories.find((c) => c.id === formCategoryId) || categories[0];
  }, [categories, formCategoryId]);

  // Filtered categories in modal search
  const filteredFormCategories = useMemo(() => {
    const q = formCategorySearch.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, formCategorySearch]);

  // Sync pickerYear when selectedMonth changes
  useEffect(() => {
    const [y] = selectedMonth.split('-').map(Number);
    if (y) setPickerYear(y);
  }, [selectedMonth]);

  // Quick navigation between months
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

  // 1. Load Categories
  useEffect(() => {
    categoryService.getCategories('EXPENSE')
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0 && !formCategoryId) {
          setFormCategoryId(cats[0].id);
        }
      })
      .catch((err) => console.error('Error loading expense categories:', err));
  }, []);

  // 2. Load Budgets, Summary, and Month Transactions when selectedMonth changes
  const loadBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [budgetList, summaryData, txns] = await Promise.all([
        budgetService.getBudgets(selectedMonth),
        budgetService.getBudgetSummary(selectedMonth).catch(() => null),
        transactionService.getTransactions({ month: selectedMonth }).catch(() => []),
      ]);
      setBudgets(budgetList);
      setSummary(summaryData);
      setMonthTransactions(txns);
    } catch (err) {
      console.error('Error loading budget data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  // Derived Metrics
  const totalAllocated = useMemo(() => {
    if (summary?.totalBudget != null) return summary.totalBudget;
    return budgets.reduce((acc, b) => acc + (b.amount ?? b.allocatedAmount), 0);
  }, [summary, budgets]);

  const totalSpent = useMemo(() => {
    if (summary?.totalSpent != null) return summary.totalSpent;
    return budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  }, [summary, budgets]);

  const totalRemaining = useMemo(() => {
    if (summary?.totalRemaining != null) return summary.totalRemaining;
    return Math.max(0, totalAllocated - totalSpent);
  }, [summary, totalAllocated, totalSpent]);

  const spentPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const safePercent = Math.max(0, 100 - spentPercent);

  // Category counts by alert status
  const categoryStats = useMemo(() => {
    let overbudget = 0;
    let warning = 0;
    let safe = 0;

    budgets.forEach((b) => {
      const allocated = b.amount ?? b.allocatedAmount;
      const pct = allocated > 0 ? (b.spentAmount / allocated) * 100 : 0;
      if (pct > 100 || b.status === 'OVERBUDGET') {
        overbudget++;
      } else if (pct >= 80 || b.status === 'WARNING') {
        warning++;
      } else {
        safe++;
      }
    });

    return { overbudget, warning, safe, total: budgets.length };
  }, [budgets]);

  // Daily budget projection calculation & Calendar parameters
  const [calendarYear, calendarMonth] = useMemo(() => {
    const parts = selectedMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 0).getDate();
  }, [calendarYear, calendarMonth]);

  // Weekday offset for the 1st of month (0 = Mon, 6 = Sun)
  const startDayOfWeek = useMemo(() => {
    const day = new Date(calendarYear, calendarMonth - 1, 1).getDay(); // 0 is Sun, 1 is Mon...
    return (day + 6) % 7;
  }, [calendarYear, calendarMonth]);

  const remainingDays = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() === calendarYear && today.getMonth() + 1 === calendarMonth) {
      return Math.max(1, daysInMonth - today.getDate());
    }
    return Math.max(1, daysInMonth - 16); // default midpoint
  }, [calendarYear, calendarMonth, daysInMonth]);

  const dailyAllowedRate = useMemo(() => {
    return Math.round(totalRemaining / remainingDays);
  }, [totalRemaining, remainingDays]);

  // Daily aggregate map for Calendar heatmap
  const dailyCashflows = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; list: Transaction[] }>();
    monthTransactions.forEach((txn) => {
      if (!txn.date) return;
      const day = parseInt(txn.date.split('-')[2], 10);
      if (!map.has(day)) {
        map.set(day, { income: 0, expense: 0, list: [] });
      }
      const item = map.get(day)!;
      if (txn.type === 'INCOME') {
        item.income += txn.amount;
      } else if (txn.type === 'EXPENSE') {
        item.expense += txn.amount;
      }
      item.list.push(txn);
    });
    return map;
  }, [monthTransactions]);

  // Selected Day Transactions
  const selectedDayTransactions = useMemo(() => {
    return dailyCashflows.get(selectedDay)?.list || [];
  }, [dailyCashflows, selectedDay]);

  // Filtered detailed budget list
  const filteredBudgets = useMemo(() => {
    if (filterTab === 'WARNING') {
      return budgets.filter((b) => {
        const allocated = b.amount ?? b.allocatedAmount;
        const pct = allocated > 0 ? (b.spentAmount / allocated) * 100 : 0;
        return pct >= 80 || b.status === 'WARNING' || b.status === 'OVERBUDGET';
      });
    }
    if (filterTab === 'SAFE') {
      return budgets.filter((b) => {
        const allocated = b.amount ?? b.allocatedAmount;
        const pct = allocated > 0 ? (b.spentAmount / allocated) * 100 : 0;
        return pct < 80 && b.status !== 'OVERBUDGET' && b.status !== 'WARNING';
      });
    }
    return budgets;
  }, [budgets, filterTab]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setFormCategoryId(categories[0]?.id || 0);
    setFormMonth(selectedMonth);
    setFormAmount('');
    setFormError(null);
    setIsFormCategoryDropdownOpen(false);
    setFormCategorySearch('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (b: Budget) => {
    setEditingBudget(b);
    setFormCategoryId(b.category.id);
    setFormMonth(b.month);
    setFormAmount(formatCurrencyInput(b.amount ?? b.allocatedAmount));
    setFormError(null);
    setIsFormCategoryDropdownOpen(false);
    setFormCategorySearch('');
    setIsModalOpen(true);
  };

  // Submit Add / Update Budget
  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = parseCurrencyInput(formAmount);
    if (!formCategoryId) {
      setFormError('Vui lòng chọn danh mục chi tiêu');
      return;
    }
    if (parsed <= 0) {
      setFormError('Hạn mức ngân sách phải lớn hơn 0 ₫');
      return;
    }

    try {
      setIsSubmitting(true);
      await budgetService.setBudget({
        categoryId: formCategoryId,
        month: formMonth,
        amount: parsed,
      });

      const cat = categories.find((c) => c.id === formCategoryId);
      showToast(
        editingBudget ? 'Cập nhật ngân sách thành công' : 'Thiết lập ngân sách thành công',
        `Đã lưu hạn mức ${parsed.toLocaleString('vi-VN')} ₫ cho danh mục ${cat?.name || ''} (${formatMonthLabel(formMonth)}).`
      );

      setIsModalOpen(false);
      if (formMonth !== selectedMonth) {
        setSelectedMonth(formMonth);
      } else {
        await loadBudgetData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể lưu ngân sách. Vui lòng thử lại!';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Boost (+500k when approaching or overbudget)
  const handleQuickBoost = async (b: Budget, increment = 500_000) => {
    try {
      const current = b.amount ?? b.allocatedAmount;
      const newAmount = current + increment;
      await budgetService.setBudget({
        categoryId: b.category.id,
        month: selectedMonth,
        amount: newAmount,
      });

      showToast(
        'Nâng hạn mức thành công',
        `Đã tăng thêm +${increment.toLocaleString('vi-VN')} ₫ cho danh mục ${b.category.name}.`
      );
      await loadBudgetData();
    } catch (err: any) {
      console.error('Error boosting budget:', err);
      showToast('Lỗi nâng ngân sách', 'Không thể tăng hạn mức lúc này.');
    }
  };

  // Delete Budget
  const handleDeleteBudget = async (b: Budget) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy hạn mức ngân sách cho danh mục "${b.category.name}"?`)) {
      return;
    }
    try {
      await budgetService.deleteBudget(b.id);
      showToast('Xóa ngân sách thành công', `Đã hủy hạn mức của danh mục ${b.category.name}.`);
      await loadBudgetData();
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      showToast('Lỗi thao tác', 'Không thể xóa ngân sách này.');
    }
  };

  // Format month label (e.g., '2026-09' -> 'Th 9/2026')
  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    return `Th ${parseInt(m, 10)}/${y}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Top Command Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-space-2xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
              Kiểm soát rủi ro dòng tiền
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
              Quản lý Ngân sách chi tiêu
            </h2>

            {/* Interactive Month & Year Navigator */}
            <div className="flex items-center gap-1 bg-surface-container-high rounded-xl p-1 relative" ref={pickerRef}>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center gap-space-xs px-2.5 py-1 rounded-lg text-on-surface hover:bg-surface-container-highest transition-all cursor-pointer font-bold text-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                <span>{formatMonthLabel(selectedMonth)}</span>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>

              {/* Year & Month Popover */}
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

                    <div className="flex items-center gap-1.5 font-bold text-on-surface text-base">
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
          </div>
        </div>

        {/* Quick CTA Button */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            id="create-budget-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Thiết lập ngân sách mới</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Budget Health Dashboard & VIP Metric Stack */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
        {/* Main Aggregate Spend Gauge (8 Cols) */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-secondary-fixed/20 pointer-events-none blur-2xl"></div>
          <div>
            <div className="flex items-start justify-between mb-space-md">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                  Hạn mức chi tiêu tổng thể
                </span>
                <span className="font-display-lg text-display-lg text-on-surface mt-0.5 font-extrabold tracking-tight">
                  {totalAllocated.toLocaleString('vi-VN')}{' '}
                  <span className="text-headline-sm font-normal text-on-surface-variant">đ</span>
                </span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Mức độ an toàn: {safePercent.toFixed(1)}%</span>
              </div>
            </div>

            {/* Big Visual Multi-Segment Progress Indicator */}
            <div className="space-y-space-xs mb-space-md">
              <div className="flex items-center justify-between font-label-md text-label-md">
                <span className="text-primary font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                  Đã sử dụng {spentPercent.toFixed(1)}% ({totalSpent.toLocaleString('vi-VN')} đ)
                </span>
                <span className="text-secondary font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span>
                  Khả dụng {totalRemaining.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="w-full h-3.5 bg-surface-container rounded-full overflow-hidden flex p-0.5">
                <div
                  className="h-full bg-primary rounded-l-full transition-all duration-700"
                  style={{ width: `${Math.min(100, spentPercent)}%` }}
                ></div>
                <div className="h-full bg-secondary/30 rounded-r-full flex-1"></div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-md bg-surface-container-low/60 rounded-xl px-space-md pb-space-sm border border-outline-variant/10">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Đã giải ngân tháng này</span>
              <span className="font-currency-row text-currency-row text-primary mt-0.5 font-bold">
                -{totalSpent.toLocaleString('vi-VN')} đ
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {selectedMonth === '2026-09' ? '16 Tháng 09, 2026' : `Chu kỳ ${selectedMonth}`}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Chi tiêu dự kiến/ngày còn lại</span>
              <span className="font-currency-row text-currency-row text-on-surface mt-0.5 font-bold">
                ~ {dailyAllowedRate.toLocaleString('vi-VN')} đ/ngày
              </span>
              <span className="font-body-sm text-body-sm text-secondary font-medium">
                {remainingDays} ngày còn lại
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Tình trạng danh mục</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {categoryStats.overbudget > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                    {categoryStats.overbudget} Chạm trần
                  </span>
                )}
                {categoryStats.warning > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-label-sm text-label-sm font-bold">
                    {categoryStats.warning} Cảnh báo
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                  {categoryStats.safe} An toàn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Speed & Projections Card (4 Cols) */}
        <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Định mức chi tiêu hàng ngày
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">auto_graph</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 text-on-surface">
              <span className="font-currency-display text-2xl font-extrabold">
                {dailyAllowedRate.toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-on-surface-variant">đ / ngày</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Bạn có thể chi tiêu tối đa định mức này mỗi ngày để đảm bảo hoàn thành mục tiêu kỷ luật tài chính trong chu kỳ {formatMonthLabel(selectedMonth)}.
            </p>
          </div>

          <div className="mt-4">
            {categoryStats.overbudget > 0 ? (
              <div className="p-3 rounded-xl bg-error-container/60 text-on-error-container flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl text-error shrink-0">error</span>
                <div className="text-xs font-semibold">
                  Có {categoryStats.overbudget} danh mục đã vượt trần hạn mức! Cần cân nhắc tái phân bổ.
                </div>
              </div>
            ) : categoryStats.warning > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl text-amber-600 shrink-0">warning</span>
                <div className="text-xs font-semibold">
                  Có {categoryStats.warning} danh mục chạm ngưỡng 80%. Hãy chú ý chi tiêu!
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl shrink-0">check_circle</span>
                <div className="text-xs font-semibold">
                  Tất cả các danh mục đang trong ngưỡng an toàn ({safePercent.toFixed(1)}%).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Split Layout: Left Category Budgets (7 cols), Right Spending Calendar Ledger (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* Left Column: Categories List & Alerts (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Danh mục chi tiêu chi tiết
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                {budgets.length} danh mục
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1 text-label-sm font-label-sm rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('WARNING')}
                className={`px-3 py-1 text-label-sm font-label-sm rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'WARNING'
                    ? 'bg-error-container text-on-error-container font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Cảnh báo ({categoryStats.overbudget + categoryStats.warning})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('SAFE')}
                className={`px-3 py-1 text-label-sm font-label-sm rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'SAFE'
                    ? 'bg-secondary-fixed/60 text-on-secondary-fixed font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                An toàn ({categoryStats.safe})
              </button>
            </div>
          </div>

          {/* Category List */}
          {isLoading ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 text-on-surface-variant">
              Đang tải danh sách ngân sách...
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-3">
                <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
              </div>
              <h4 className="font-title-md text-title-md font-bold text-on-surface mb-1">
                {filterTab === 'ALL'
                  ? 'Chưa thiết lập ngân sách nào cho tháng này'
                  : 'Không có danh mục nào thuộc nhóm lọc này'}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-4">
                Thiết lập hạn mức chi tiêu để nhận cảnh báo thông minh khi sắp hết tiền.
              </p>
              {filterTab === 'ALL' && (
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer"
                >
                  + Thiết lập ngân sách đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-space-md">
              {filteredBudgets.map((b) => {
                const allocated = b.amount ?? b.allocatedAmount;
                const pct = allocated > 0 ? (b.spentAmount / allocated) * 100 : 0;
                const isOver = pct > 100 || b.status === 'OVERBUDGET';
                const isWarn = (pct >= 80 && pct <= 100) || b.status === 'WARNING';

                // Determine badge and bar styling
                let badgeClass = 'bg-secondary-fixed/40 text-on-secondary-fixed font-bold';
                let badgeLabel = 'An toàn';
                let barClass = 'bg-secondary';
                let amountTextClass = 'text-secondary';

                if (isOver) {
                  badgeClass = 'bg-primary-container text-on-primary-container font-bold animate-pulse';
                  badgeLabel = '100% Hết hạn mức';
                  barClass = 'bg-primary-container';
                  amountTextClass = 'text-primary';
                } else if (isWarn) {
                  badgeClass = 'bg-amber-100 text-amber-900 font-bold';
                  badgeLabel = 'Sắp chạm ngưỡng';
                  barClass = 'bg-amber-500';
                  amountTextClass = 'text-amber-700';
                } else if (b.spentAmount === 0) {
                  badgeClass = 'bg-surface-container-high text-on-surface-variant font-medium';
                  badgeLabel = 'Chưa chi';
                  barClass = 'bg-surface-variant';
                  amountTextClass = 'text-on-surface-variant';
                }

                const remaining = Math.max(0, allocated - b.spentAmount);
                const overspent = Math.max(0, b.spentAmount - allocated);

                return (
                  <div
                    key={b.id}
                    className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 relative overflow-hidden transition-all hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-space-xs">
                      <div className="flex items-center gap-space-sm">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isOver
                              ? 'bg-error-container/70 text-on-error-container'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-secondary-fixed/50 text-on-secondary-fixed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[26px]">
                            {b.category.icon || 'category'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-title-md text-title-md font-bold text-on-surface">
                              {b.category.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${badgeClass}`}>
                              {badgeLabel}
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Đã tiêu: {b.spentAmount.toLocaleString('vi-VN')} đ / Hạn mức: {allocated.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Right Amount / Percentage */}
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className={`font-headline-sm text-headline-sm font-bold ${amountTextClass}`}>
                            {pct.toFixed(0)}%
                          </span>

                          {/* Action Buttons (Edit / Delete) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(b)}
                              title="Sửa ngân sách"
                              className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBudget(b)}
                              title="Xóa ngân sách"
                              className="p-1 rounded-lg hover:bg-error-container text-error cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {isOver ? (
                            <span className="text-primary font-bold">
                              Vượt: {overspent.toLocaleString('vi-VN')} đ
                            </span>
                          ) : (
                            <>
                              Còn lại:{' '}
                              <span className="font-semibold text-on-surface font-currency-row">
                                {remaining.toLocaleString('vi-VN')} đ
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden mb-space-xs">
                      <div
                        className={`h-full ${barClass} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                      ></div>
                    </div>

                    {/* Distinct Warning Notice Card for Overbudget/Warning categories */}
                    {isOver && (
                      <div className="p-space-sm rounded-xl bg-error-container/50 flex items-center justify-between mt-space-xs flex-wrap gap-2">
                        <div className="flex items-center gap-space-xs text-on-error-container">
                          <span className="material-symbols-outlined text-[20px] text-error shrink-0">warning</span>
                          <span className="font-label-sm text-label-sm font-bold">
                            Đã đạt giới hạn ngân sách! Không thể chi thêm hoặc cần nâng hạn mức.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickBoost(b, 500_000)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          Nâng quỹ +500k
                        </button>
                      </div>
                    )}
                    {isWarn && !isOver && (
                      <div className="p-space-sm rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between mt-space-xs flex-wrap gap-2">
                        <div className="flex items-center gap-space-xs text-amber-900">
                          <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">info</span>
                          <span className="font-label-sm text-label-sm font-bold">
                            Đã tiêu hơn 80% ngân sách. Hãy cân nhắc chi tiêu tiết kiệm trong những ngày còn lại.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickBoost(b, 500_000)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-amber-800 font-label-sm text-label-sm font-bold shadow-xs hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          Nâng quỹ +500k
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Spending Calendar & Daily Ledger Drilldown (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Interactive Heatmap / Calendar Block (From Stitch Reference) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Lịch chi tiêu {formatMonthLabel(selectedMonth)}
                </span>
              </div>
              <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                <span className="px-2.5 py-1 rounded-md bg-surface-container-lowest font-label-sm text-label-sm text-on-surface font-semibold shadow-xs">
                  Tháng
                </span>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center font-label-sm text-label-sm text-on-surface-variant font-bold mb-2">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-primary">CN</span>
            </div>

            {/* Days Grid with micro cashflows */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {/* Preceding weekday alignment empty cells */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="p-1 min-h-[50px] rounded-xl opacity-20 pointer-events-none" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const flow = dailyCashflows.get(day);
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`p-1 min-h-[50px] rounded-xl flex flex-col items-center justify-start cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-error-container/60 shadow-xs scale-105 z-10 ring-2 ring-primary-container'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        isSelected
                          ? 'w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-bold text-[10px] flex items-center justify-center'
                          : 'text-on-surface'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Micro Cashflows on calendar cell */}
                    {flow && flow.income > 0 && (
                      <span className="text-secondary font-bold text-[9px] leading-tight mt-0.5">
                        +{flow.income >= 1_000_000 ? `${(flow.income / 1_000_000).toFixed(1)}M` : `${Math.round(flow.income / 1000)}k`}
                      </span>
                    )}
                    {flow && flow.expense > 0 && (
                      <span className="text-primary font-bold text-[9px] leading-tight mt-0.5">
                        -{flow.expense >= 1_000_000 ? `${(flow.expense / 1_000_000).toFixed(1)}M` : `${Math.round(flow.expense / 1000)}k`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Ledger Card for Selected Date */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-sm border-b border-surface-container-high/60 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  Giao dịch ngày {selectedDay}/{selectedMonth.split('-')[1]}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {selectedDayTransactions.length} giao dịch
              </span>
            </div>

            {selectedDayTransactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-on-surface-variant">
                Không phát sinh giao dịch nào vào ngày {selectedDay}.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {selectedDayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-sm">
                        <span className="material-symbols-outlined text-base">
                          {t.category.icon || 'payments'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-on-surface">
                          {t.note || t.category.name}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {t.account.name} • {t.category.name}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-currency-row text-xs font-bold ${
                        t.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                      }`}
                    >
                      {t.type === 'INCOME' ? '+' : '-'}
                      {t.amount.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Modal Thiết Lập / Sửa Ngân Sách Mới (Glassmorphism Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-surface-container-high/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {editingBudget ? 'Chỉnh sửa hạn mức ngân sách' : 'Thiết lập ngân sách mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBudget} className="space-y-4">
              {/* Custom Styled Category Dropdown (Khớp giao diện Trang Giao Dịch) */}
              <div className="relative" ref={formCategoryDropdownRef}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Danh mục chi tiêu
                </label>

                {/* Custom Trigger Button */}
                <button
                  type="button"
                  disabled={editingBudget != null}
                  onClick={() => setIsFormCategoryDropdownOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all cursor-pointer select-none ${
                    editingBudget != null
                      ? 'bg-surface-container/50 border-outline-variant/30 text-on-surface-variant cursor-not-allowed opacity-80'
                      : isFormCategoryDropdownOpen
                      ? 'border-2 border-purple-500 bg-surface-container-low ring-2 ring-purple-500/15'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/40 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedFormCategory ? (
                      <>
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${getCategoryPastelBg(
                            selectedFormCategory.id,
                            selectedFormCategory.name
                          )}`}
                        >
                          {renderCategoryIcon(selectedFormCategory.icon)}
                        </div>
                        <span className="font-semibold text-sm text-on-surface">
                          {selectedFormCategory.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-on-surface-variant text-sm">Chọn danh mục chi tiêu...</span>
                    )}
                  </div>

                  {editingBudget == null && (
                    <span
                      className={`material-symbols-outlined text-[20px] text-slate-500 transition-transform duration-200 ${
                        isFormCategoryDropdownOpen ? 'rotate-180 text-purple-600' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  )}
                </button>

                {/* Dropdown Menu Modal Card matching Screenshot 2 */}
                {isFormCategoryDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white dark:bg-surface-container-lowest rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] border border-slate-200/90 dark:border-outline-variant/30 p-3.5 animate-fadeIn select-none">
                    {/* Top Header: Purple Badge + "Danh Mục" */}
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-outline-variant/20">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">segment</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-on-surface uppercase tracking-wider">
                        Danh Mục
                      </h4>
                    </div>

                    {/* Search Input */}
                    <div className="relative my-2.5">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400">
                        search
                      </span>
                      <input
                        type="text"
                        value={formCategorySearch}
                        onChange={(e) => setFormCategorySearch(e.target.value)}
                        placeholder="Tìm danh mục (Ăn uống, Lương...)"
                        className="w-full bg-slate-50 dark:bg-surface-container-low text-slate-800 dark:text-on-surface text-xs font-medium pl-8.5 pr-7 py-2 rounded-xl border border-slate-200 dark:border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-purple-400/25 focus:border-purple-500 transition-all placeholder:text-slate-400"
                        autoFocus
                      />
                      {formCategorySearch && (
                        <button
                          type="button"
                          onClick={() => setFormCategorySearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>

                    {/* Category List */}
                    <div className="max-h-[220px] overflow-y-auto custom-scroll space-y-1 pr-1">
                      {filteredFormCategories.map((c) => {
                        const isSelected = formCategoryId === c.id;
                        const pastelBg = getCategoryPastelBg(c.id, c.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setFormCategoryId(c.id);
                              setIsFormCategoryDropdownOpen(false);
                              setFormCategorySearch('');
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900/40 shadow-2xs'
                                : 'text-slate-700 dark:text-on-surface hover:bg-slate-50 dark:hover:bg-surface-container font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${pastelBg}`}
                              >
                                {renderCategoryIcon(c.icon)}
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-on-surface">
                                {c.name}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[18px] text-purple-600 dark:text-purple-400 font-bold">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {filteredFormCategories.length === 0 && (
                        <div className="py-5 text-center text-xs text-slate-400 font-medium">
                          Không tìm thấy danh mục "{formCategorySearch}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Chu kỳ tháng áp dụng
                </label>
                <input
                  type="month"
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Hạn mức ngân sách tối đa (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ví dụ: 3.000.000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(formatCurrencyInput(e.target.value))}
                    className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 pr-8 text-base border border-outline-variant/40 font-currency-row focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface font-bold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
                    ₫
                  </span>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {[500_000, 1_000_000, 2_000_000, 5_000_000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormAmount(formatCurrencyInput(val))}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                  >
                    {val.toLocaleString('vi-VN')} ₫
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : editingBudget ? 'Lưu thay đổi' : 'Thiết lập ngân sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Toast Notification Banner */}
      {toast && (
        <div
          id="rebalance-toast"
          className="fixed bottom-6 right-6 z-50 transform transition-all duration-300 animate-in slide-in-from-bottom"
        >
          <div className="bg-surface-container-lowest text-on-surface p-space-md rounded-xl shadow-2xl border border-outline-variant/30 flex items-center gap-space-sm max-w-md">
            <span className="material-symbols-outlined text-secondary text-[26px]">task_alt</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-surface">{toast.title}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{toast.desc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
