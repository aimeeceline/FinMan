import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Account, Category, Transaction, AccountType, Budget, TransactionType } from '../../types';
import { accountService } from '../../services/accountService';
import { categoryService } from '../../services/categoryService';
import { budgetService } from '../../services/budgetService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';
import { AddCategoryModal } from './AddCategoryModal';
import { AddAccountModal } from './AddAccountModal';
import { getCategoryTheme } from '../../utils/categoryTheme';

export interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void> | void;
  onUpdateTransaction?: (id: number, transaction: Omit<Transaction, 'id'>) => Promise<void> | void;
  editingTransaction?: Transaction | null;
  initialTransaction?: Partial<Transaction> | null;
  initialData?: Partial<Transaction> | null;
  accounts?: Account[];
  categories?: Category[];
  transactions?: Transaction[];
  budgets?: Budget[];
  onCategoryCreated?: (newCategory: Category) => void;
  onAccountCreated?: (newAccount: Account) => void;
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
    case 'INVESTMENT':
      return '📈';
    case 'OTHER':
      return '💼';
    default:
      return '💰';
  }
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  initialTransaction: initialTransactionProp,
  initialData,
  accounts = [],
  categories,
  transactions: _transactions = [],
  budgets: externalBudgets,
  onCategoryCreated,
  onAccountCreated,
}) => {
  const initialTransaction = initialTransactionProp || initialData;
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories || []);
  const [accountsList, setAccountsList] = useState<Account[]>(accounts.filter((a) => !a.isArchived));

  // Đồng bộ accountsList khi prop accounts thay đổi hoặc modal mở ra
  useEffect(() => {
    setAccountsList(accounts.filter((a) => !a.isArchived));
  }, [accounts, isOpen]);

  // Quick account creation modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [accountTargetField, setAccountTargetField] = useState<'from' | 'to'>('from');

  const handleAccountCreated = (newAccount: Account) => {
    setAccountsList((prev) => {
      const exists = prev.some((a) => a.id === newAccount.id);
      return exists ? prev : [...prev, newAccount];
    });

    if (accountTargetField === 'to') {
      setSelectedToAccount(newAccount);
    } else {
      setSelectedAccount(newAccount);
    }

    if (formError) setFormError(null);
    setShowAddAccountModal(false);

    if (onAccountCreated) {
      onAccountCreated(newAccount);
    }
  };

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayLocalDateStr);
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

  // Custom Styled Date Picker Popover State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => {
    return new Date();
  });
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sync calendarViewDate when date changes or modal opens
  useEffect(() => {
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      if (y && m && d) {
        setCalendarViewDate(new Date(y, m - 1, d));
      }
    }
  }, [date, isOpen]);

  // Click outside to close custom date picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const handlePrevCalMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextCalMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    if (!y || !m || !d) return dStr;
    return `${d}/${m}/${y}`;
  };

  // Manual Date Input State
  const [dateInput, setDateInput] = useState<string>(() => formatDisplayDate(date));

  // Sync dateInput when date changes
  useEffect(() => {
    setDateInput(formatDisplayDate(date));
  }, [date]);

  const handleDateInputChange = (val: string) => {
    setDateInput(val);
    const parts = val.trim().split(/[/.-]/);
    if (parts.length === 3) {
      let [d, m, y] = parts.map(Number);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const padD = String(d).padStart(2, '0');
        const padM = String(m).padStart(2, '0');
        const validIso = `${y}-${padM}-${padD}`;
        setDate(validIso);
        setCalendarViewDate(new Date(y, m - 1, d));
      }
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      setDate(val.trim());
      const [y, m, d] = val.trim().split('-').map(Number);
      setCalendarViewDate(new Date(y, m - 1, d));
    }
  };

  const handleDateInputBlur = () => {
    const parts = dateInput.trim().split(/[/.-]/);
    if (parts.length === 3) {
      let [d, m, y] = parts.map(Number);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const padD = String(d).padStart(2, '0');
        const padM = String(m).padStart(2, '0');
        const validIso = `${y}-${padM}-${padD}`;
        setDate(validIso);
        setDateInput(`${padD}/${padM}/${y}`);
        return;
      }
    }
    setDateInput(formatDisplayDate(date));
  };

  const calendarDays = useMemo(() => {
    const calYear = calendarViewDate.getFullYear();
    const calMonth = calendarViewDate.getMonth() + 1; // 1-12

    const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
    const startOffset = (firstDay + 6) % 7; // Monday = 0

    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // 1. Prev month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = calMonth === 1 ? 12 : calMonth - 1;
      const prevY = calMonth === 1 ? calYear - 1 : calYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isSelected: dateStr === date,
        isToday: dateStr === getTodayLocalDateStr(),
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isSelected: dateStr === date,
        isToday: dateStr === getTodayLocalDateStr(),
      });
    }

    // 3. Next month leading days (fill to 35 or 42)
    const targetTotal = cells.length <= 35 ? 35 : 42;
    const nextPadCount = targetTotal - cells.length;
    const nextM = calMonth === 12 ? 1 : calMonth + 1;
    const nextY = calMonth === 12 ? calYear + 1 : calYear;
    for (let d = 1; d <= nextPadCount; d++) {
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isSelected: dateStr === date,
        isToday: dateStr === getTodayLocalDateStr(),
      });
    }

    return cells;
  }, [calendarViewDate, date]);

  // Sync form state when editingTransaction, initialTransaction, or isOpen changes
  useEffect(() => {
    if (!isOpen) return;
    if (editingTransaction) {
      setType(editingTransaction.type);
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
      if (editingTransaction.toAccount) {
        const matchedToAcc = accounts.find((a) => a.id === editingTransaction.toAccount?.id);
        if (matchedToAcc) setSelectedToAccount(matchedToAcc);
      }
      if (editingTransaction.category) {
        const matchedCat = categoriesList.find((c) => c.id === editingTransaction.category?.id);
        if (matchedCat) setSelectedCategory(matchedCat);
      }
    } else if (
      initialTransaction &&
      typeof initialTransaction === 'object' &&
      !('nativeEvent' in initialTransaction) &&
      (initialTransaction.amount !== undefined ||
        initialTransaction.type !== undefined ||
        initialTransaction.note !== undefined ||
        initialTransaction.category !== undefined ||
        initialTransaction.account !== undefined ||
        initialTransaction.toAccount !== undefined ||
        initialTransaction.isAiParsed)
    ) {
      const targetType = initialTransaction.type || 'EXPENSE';
      setType(targetType);
      setAmount(initialTransaction.amount || 0);
      setDate(initialTransaction.date || getTodayLocalDateStr());
      if (initialTransaction.time) {
        setTime(initialTransaction.time);
      } else {
        setTime(new Date().toTimeString().slice(0, 5));
      }
      setNote(initialTransaction.note || '');

      let matchedToAcc: Account | null = null;
      if (initialTransaction.toAccount) {
        matchedToAcc = accountsList.find(
          (a) =>
            a.id === initialTransaction.toAccount?.id ||
            a.name.toLowerCase() === initialTransaction.toAccount?.name?.toLowerCase()
        ) || null;
        if (matchedToAcc) setSelectedToAccount(matchedToAcc);
      }

      if (initialTransaction.account) {
        const matchedAcc = accountsList.find(
          (a) =>
            a.id === initialTransaction.account?.id ||
            a.name.toLowerCase() === initialTransaction.account?.name?.toLowerCase() ||
            (initialTransaction.account?.name &&
              (a.name.toLowerCase().includes(initialTransaction.account.name.toLowerCase()) ||
                initialTransaction.account.name.toLowerCase().includes(a.name.toLowerCase())))
        );
        if (matchedAcc) {
          setSelectedAccount(matchedAcc);
        } else {
          setSelectedAccount(initialTransaction.account as Account);
        }
      } else if (matchedToAcc) {
        // Nếu chỉ truyền toAccount (như khi bấm Thanh toán thẻ tín dụng):
        // Ưu tiên tài khoản thanh toán đã được người dùng cấu hình cho thẻ tín dụng này
        const configuredPaymentAcc = matchedToAcc.paymentAccountId
          ? accountsList.find((a) => a.id === matchedToAcc.paymentAccountId)
          : null;
        const sourceAcc =
          configuredPaymentAcc ||
          accountsList.find((a) => a.id !== matchedToAcc.id && a.type !== 'CREDIT_CARD') ||
          accountsList.find((a) => a.id !== matchedToAcc.id) ||
          null;
        if (sourceAcc) setSelectedAccount(sourceAcc);
      }

      if (initialTransaction.category) {
        const matchedCat = categoriesList.find(
          (c) =>
            (c.id === initialTransaction.category?.id ||
              c.name.toLowerCase() === initialTransaction.category?.name?.toLowerCase() ||
              (initialTransaction.category?.name &&
                (c.name.toLowerCase().includes(initialTransaction.category.name.toLowerCase()) ||
                  initialTransaction.category.name.toLowerCase().includes(c.name.toLowerCase())))) &&
            c.type === targetType
        );
        if (matchedCat) {
          setSelectedCategory(matchedCat);
        } else {
          setSelectedCategory(initialTransaction.category as Category);
        }
      }
    } else {
      setType('EXPENSE');
      setAmount(0);
      setDate(getTodayLocalDateStr());
      setTime(new Date().toTimeString().slice(0, 5));
      setNote('');
      setSelectedToAccount(null);
    }
  }, [isOpen, editingTransaction, initialTransaction]);

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

  // Sync accounts prop and refresh latest active accounts when modal opens
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountsList(accounts.filter((a) => !a.isArchived));
    }
  }, [accounts]);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    accountService
      .getAccounts(false)
      .then((data) => {
        if (data && data.length > 0) {
          setAccountsList(data.filter((a) => !a.isArchived));
        }
      })
      .catch((err) => console.warn('Could not refresh accounts in AddTransactionModal:', err));
  }, [isOpen]);

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
        const preferredCat = editingTransaction?.category || initialTransaction?.category;
        const matchedPref = preferredCat
          ? filteredCategories.find(
              (c) =>
                c.id === preferredCat.id ||
                c.name.toLowerCase() === preferredCat.name?.toLowerCase() ||
                (preferredCat.name &&
                  (c.name.toLowerCase().includes(preferredCat.name.toLowerCase()) ||
                    preferredCat.name.toLowerCase().includes(c.name.toLowerCase())))
            )
          : null;
        setSelectedCategory(matchedPref || filteredCategories[0]);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [filteredCategories, type, selectedCategory, editingTransaction, initialTransaction]);

  // Sync selectedAccount
  useEffect(() => {
    if (!isOpen) return;
    if (accountsList.length > 0) {
      if (!selectedAccount || !accountsList.some((a) => a.id === selectedAccount.id)) {
        const preferredAcc = editingTransaction?.account || initialTransaction?.account;
        const matchedPref = preferredAcc
          ? accountsList.find(
              (a) =>
                a.id === preferredAcc.id ||
                a.name.toLowerCase() === preferredAcc.name?.toLowerCase() ||
                (preferredAcc.name &&
                  (a.name.toLowerCase().includes(preferredAcc.name.toLowerCase()) ||
                    preferredAcc.name.toLowerCase().includes(a.name.toLowerCase())))
            )
          : null;

        // Nếu không có preferredAcc nhưng có toAccount (ví dụ khi bấm Thanh toán thẻ tín dụng):
        // Tránh chọn trùng với toAccount!
        const avoidId = editingTransaction?.toAccount?.id || initialTransaction?.toAccount?.id || selectedToAccount?.id;
        const fallbackAcc = avoidId
          ? (accountsList.find((a) => a.id !== avoidId && a.type !== 'CREDIT_CARD')
             || accountsList.find((a) => a.id !== avoidId)
             || accountsList[0])
          : accountsList[0];

        setSelectedAccount(matchedPref || fallbackAcc);
      }
    } else {
      setSelectedAccount(null);
    }
  }, [isOpen, accountsList, selectedAccount, editingTransaction, initialTransaction, selectedToAccount?.id]);

  // Sync selectedToAccount when type is TRANSFER
  useEffect(() => {
    if (!isOpen) return;
    if (type === 'TRANSFER' && accountsList.length > 0) {
      const preferredTo = editingTransaction?.toAccount || initialTransaction?.toAccount;
      if (preferredTo) {
        const matchedTo = accountsList.find(
          (a) => a.id === preferredTo.id || a.name.toLowerCase() === preferredTo.name?.toLowerCase()
        );
        if (matchedTo) {
          if (!selectedToAccount || selectedToAccount.id !== matchedTo.id) {
            setSelectedToAccount(matchedTo);
          }
          if (selectedAccount?.id === matchedTo.id) {
            const otherFromAcc = accountsList.find((a) => a.id !== matchedTo.id && a.type !== 'CREDIT_CARD')
              || accountsList.find((a) => a.id !== matchedTo.id);
            if (otherFromAcc) setSelectedAccount(otherFromAcc);
          }
          return;
        }
      }

      if (
        !selectedToAccount ||
        selectedToAccount.id === selectedAccount?.id ||
        !accountsList.some((a) => a.id === selectedToAccount.id)
      ) {
        const otherAcc = accountsList.find((a) => a.id !== selectedAccount?.id);
        if (otherAcc) setSelectedToAccount(otherAcc);
      }
    }
  }, [isOpen, type, accountsList, selectedAccount, selectedToAccount, editingTransaction, initialTransaction]);

  // Handle switching from account with auto-switch for destination
  const handleFromAccountChange = (accId: number) => {
    const acc = accountsList.find((a) => a.id === accId);
    if (!acc) return;
    setSelectedAccount(acc);
    if (selectedToAccount && selectedToAccount.id === acc.id) {
      const alternative = accountsList.find((a) => a.id !== acc.id);
      if (alternative) setSelectedToAccount(alternative);
    }
    if (formError) setFormError(null);
  };

  // Handle switching to account with auto-switch for source
  const handleToAccountChange = (accId: number) => {
    const acc = accountsList.find((a) => a.id === accId);
    if (!acc) return;
    setSelectedToAccount(acc);
    if (selectedAccount && selectedAccount.id === acc.id) {
      const alternative = accountsList.find((a) => a.id !== acc.id);
      if (alternative) setSelectedAccount(alternative);
    }
    if (formError) setFormError(null);
  };

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

  // Kiểm tra hạn mức tín dụng thời gian thực khi chọn tài khoản là thẻ tín dụng
  const creditLimitValidation = useMemo(() => {
    if (!selectedAccount || selectedAccount.type !== 'CREDIT_CARD') return null;
    const limit = selectedAccount.creditLimit || 0;
    let baseDebt = selectedAccount.currentBalance || 0;
    if (
      editingTransaction &&
      editingTransaction.account?.id === selectedAccount.id &&
      (editingTransaction.type === 'EXPENSE' || editingTransaction.type === 'TRANSFER')
    ) {
      baseDebt = Math.max(0, baseDebt - (editingTransaction.amount || 0));
    }
    const availableCredit = limit > 0 ? Math.max(0, limit - baseDebt) : 0;
    const isExceeded = limit > 0 && (type === 'EXPENSE' || type === 'TRANSFER') && amount > availableCredit;
    const remainingAfterSpend = limit > 0 ? limit - (baseDebt + amount) : 0;

    return {
      limit,
      currentDebt: baseDebt,
      availableCredit,
      isExceeded,
      remainingAfterSpend,
    };
  }, [selectedAccount, editingTransaction, type, amount]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (amount <= 0) {
      setFormError('Vui lòng nhập số tiền giao dịch lớn hơn 0.');
      return;
    }
    if (!selectedAccount) {
      setFormError('Vui lòng chọn tài khoản giao dịch.');
      return;
    }

    // RÀNG BUỘC HẠN MỨC TÍN DỤNG: Không cho phép chi tiêu hoặc chuyển tiền vượt hạn mức
    if (creditLimitValidation && creditLimitValidation.isExceeded) {
      setFormError(
        `Giao dịch vượt quá hạn mức tín dụng khả dụng của thẻ "${selectedAccount.name}"! Hạn mức khả dụng còn lại là ${creditLimitValidation.availableCredit.toLocaleString('vi-VN')} đ, số tiền bạn nhập là ${amount.toLocaleString('vi-VN')} đ.`
      );
      return;
    }

    if (type === 'TRANSFER') {
      if (accountsList.length < 2) {
        setFormError('Bạn cần ít nhất 2 tài khoản để thực hiện giao dịch chuyển tiền.');
        return;
      }
      if (!selectedToAccount) {
        setFormError('Vui lòng chọn tài khoản đích nhận tiền.');
        return;
      }
      if (selectedAccount.id === selectedToAccount.id) {
        setFormError('Tài khoản nguồn và tài khoản đích không được trùng nhau.');
        return;
      }

      const txPayload = {
        amount,
        type: 'TRANSFER' as const,
        account: selectedAccount,
        toAccount: selectedToAccount,
        date,
        time,
        note: note.trim() || undefined,
      };

      try {
        setIsSubmitting(true);
        if (editingTransaction && onUpdateTransaction) {
          await onUpdateTransaction(editingTransaction.id, txPayload as any);
        } else {
          await onAddTransaction(txPayload as any);
        }
        // Reset form & close ONLY on success
        setAmount(0);
        setNote('');
        setFormError(null);
        onClose();
      } catch (err: any) {
        console.error('Error submitting transfer transaction:', err);
        setFormError(err.response?.data?.message || err.message || 'Không thể thực hiện chuyển tiền. Vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedCategory) {
        setFormError('Vui lòng chọn danh mục cho giao dịch.');
        return;
      }

      const txPayload = {
        amount,
        type,
        category: selectedCategory,
        account: selectedAccount,
        date,
        time,
        note: note.trim() || undefined,
      };

      try {
        setIsSubmitting(true);
        if (editingTransaction && onUpdateTransaction) {
          await onUpdateTransaction(editingTransaction.id, txPayload);
        } else {
          await onAddTransaction(txPayload);
        }
        // Reset form & close ONLY on success
        setAmount(0);
        setNote('');
        setFormError(null);
        onClose();
      } catch (err: any) {
        console.error('Error submitting transaction:', err);
        setFormError(err.response?.data?.message || err.message || 'Không thể lưu giao dịch. Vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const hasNoAccounts = accountsList.length === 0;

  // Render Category Icon (handles emoji vs material symbol)
  const renderCategoryIcon = (cat: Category, _isSelected: boolean) => {
    const theme = getCategoryTheme(cat);
    return <span>{theme.emoji}</span>;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-[200] flex items-center justify-center p-4 lg:p-6 transition-all duration-300 select-none animate-fadeIn"
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
              : type === 'INCOME'
              ? 'bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/30'
              : 'bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-full border p-0.5 flex items-center justify-center shadow-md transition-colors ${
                  type === 'EXPENSE'
                    ? 'border-amber-300/40 bg-amber-50 text-amber-600'
                    : type === 'INCOME'
                    ? 'border-emerald-300/40 bg-emerald-50 text-emerald-600'
                    : 'border-blue-300/40 bg-blue-50 text-blue-600'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {type === 'EXPENSE' ? 'payments' : type === 'INCOME' ? 'savings' : 'swap_horiz'}
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    type === 'EXPENSE' ? 'bg-red-400' : type === 'INCOME' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${
                    type === 'EXPENSE' ? 'bg-red-600' : type === 'INCOME' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                ></span>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingTransaction
                  ? 'Chỉnh sửa giao dịch'
                  : Boolean((initialTransaction as any)?.isAiParsed)
                  ? 'Chỉnh sửa giao dịch từ AI'
                  : type === 'TRANSFER'
                  ? 'Điều chuyển khoản tiền mục đích'
                  : type === 'EXPENSE'
                  ? 'Thêm giao dịch chi tiêu'
                  : 'Thêm giao dịch thu nhập'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {editingTransaction
                  ? `Cập nhật thông tin giao dịch #${editingTransaction.id}`
                  : Boolean((initialTransaction as any)?.isAiParsed)
                  ? 'Kiểm tra và tùy chỉnh thông tin do AI bóc tách trước khi lưu'
                  : type === 'EXPENSE'
                  ? 'Ghi nhận chi phí sinh hoạt & dòng tiền ra'
                  : type === 'INCOME'
                  ? 'Ghi nhận nguồn thu nhập & tích lũy tài sản'
                  : 'Điều chuyển tiền giữa các mục đích sử dụng (không ảnh hưởng thu/chi ròng)'}
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
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">warning</span>
                <span>
                  Bạn chưa có tài khoản nào. Bạn có thể nhấn nút bên cạnh để tạo tài khoản mới ngay lập tức.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccountTargetField('from');
                  setShowAddAccountModal(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0 cursor-pointer transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Thêm tài khoản ngay
              </button>
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
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
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
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-glow-emerald'
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

              {/* Transfer Tab */}
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  type === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span>Chuyển khoản</span>
              </button>
            </nav>
          </div>

          {/* Big Amount Hero Input */}
          <div
            className={`border rounded-2xl p-5 text-center shadow-sm transition-all ${
              type === 'EXPENSE'
                ? 'bg-gradient-to-b from-red-50/60 to-transparent border-red-100'
                : type === 'INCOME'
                ? 'bg-gradient-to-b from-emerald-50/60 to-transparent border-emerald-100'
                : 'bg-gradient-to-b from-blue-50/60 to-transparent border-blue-100'
            }`}
          >
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                type === 'EXPENSE'
                  ? 'text-red-600/80'
                  : type === 'INCOME'
                  ? 'text-emerald-600/80'
                  : 'text-blue-600/80'
              }`}
            >
              {type === 'EXPENSE'
                ? 'Số tiền chi tiêu'
                : type === 'INCOME'
                ? 'Số tiền thu nhập'
                : 'Số tiền điều chuyển'}
            </label>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  type === 'EXPENSE'
                    ? 'text-red-600'
                    : type === 'INCOME'
                    ? 'text-emerald-600'
                    : 'text-blue-600'
                }`}
              >
                {type === 'EXPENSE' ? '-' : type === 'INCOME' ? '+' : '⇄'}
              </span>
              <input
                className={`w-52 sm:w-72 text-center text-3xl sm:text-4xl font-extrabold bg-transparent border-0 border-b-2 outline-none focus:outline-none focus:ring-0 p-0 pb-0.5 tracking-tight font-currency-display ${
                  type === 'EXPENSE'
                    ? 'text-red-600 border-red-300 focus:border-red-600'
                    : type === 'INCOME'
                    ? 'text-emerald-600 border-emerald-300 focus:border-emerald-600'
                    : 'text-blue-600 border-blue-300 focus:border-blue-600'
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
                    : type === 'INCOME'
                    ? 'text-emerald-600 decoration-emerald-300'
                    : 'text-blue-600 decoration-blue-300'
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
                      : type === 'INCOME'
                      ? 'hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                      : 'hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50'
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
                    : type === 'INCOME'
                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                    : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                }`}
                title="Xóa số tiền về 0"
              >
                Xóa (C)
              </button>
            </div>

            {/* Cảnh báo thời gian thực khi số tiền vượt hạn mức thẻ tín dụng */}
            {creditLimitValidation?.isExceeded && (
              <div className="mt-3.5 py-2 px-3 bg-red-100/95 border border-red-300 rounded-xl text-red-700 text-xs font-bold inline-flex items-center gap-1.5 animate-pulse shadow-xs">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>
                  Vượt quá hạn mức tín dụng! Thẻ "{selectedAccount?.name}" chỉ còn khả dụng tối đa{' '}
                  <strong className="underline">{creditLimitValidation.availableCredit.toLocaleString('vi-VN')} đ</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Main Form: Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
            {type === 'TRANSFER' ? (
              /* TRANSFER FLOW (7 cols left) */
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Điều chuyển tiền giữa các Khoản mục đích
                  </label>
                  <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Bảo toàn 100% Net Worth
                  </span>
                </div>

                {accountsList.length < 2 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">
                        warning
                      </span>
                      <div className="leading-relaxed">
                        <strong>Cần ít nhất 2 tài khoản:</strong> Bạn cần ít nhất 2 tài khoản để thực hiện chuyển tiền qua lại.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTargetField('to');
                        setShowAddAccountModal(true);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Tạo thêm tài khoản
                    </button>
                  </div>
                )}

                <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  {/* FROM ACCOUNT */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Khoản tiền nguồn
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedAccount && (
                          <span className="text-xs font-semibold text-slate-500 font-currency-row">
                            {selectedAccount.type === 'CREDIT_CARD'
                              ? `Khả dụng thẻ: ${formatVND(Math.max(0, (selectedAccount.creditLimit || 0) - (selectedAccount.currentBalance || 0)))}`
                              : `Khả dụng: ${formatVND(selectedAccount.currentBalance)}`}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAccountTargetField('from');
                            setShowAddAccountModal(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer transition-all border border-blue-200/60"
                          title="Thêm tài khoản nguồn mới"
                        >
                          <span className="material-symbols-outlined text-[13px]">add</span>
                          Thêm
                        </button>
                      </div>
                    </div>
                    <select
                      id="transferFromAccountSelect"
                      value={selectedAccount?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setAccountTargetField('from');
                          setShowAddAccountModal(true);
                          return;
                        }
                        handleFromAccountChange(Number(e.target.value));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {accountsList.length === 0 && <option value="">-- Chưa có tài khoản --</option>}
                      {accountsList.map((a) => {
                        const isCard = a.type === 'CREDIT_CARD';
                        const avail = isCard && a.creditLimit
                          ? Math.max(0, a.creditLimit - (a.currentBalance || 0))
                          : a.currentBalance;
                        return (
                          <option key={a.id} value={a.id}>
                            {getAccountEmoji(a.type)} {a.name} ({isCard ? 'Khả dụng' : 'Số dư'}: {formatVND(avail)})
                            {a.note ? ` - [${a.note}]` : ''}
                          </option>
                        );
                      })}
                      <option value="__ADD_NEW__">➕ Thêm tài khoản mới...</option>
                    </select>

                    {selectedAccount && (
                      <div className="mt-2 text-[11px] flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100">
                        <span>Sau khi trích:</span>
                        {selectedAccount.type === 'CREDIT_CARD' ? (
                          <span
                            className={`font-bold font-currency-row ${
                              creditLimitValidation?.isExceeded ? 'text-red-600' : 'text-slate-700'
                            }`}
                          >
                            Còn hạn mức: {formatVND(Math.max(0, creditLimitValidation?.remainingAfterSpend || 0))}
                            {creditLimitValidation?.isExceeded && ' (⚠️ Vượt hạn mức thẻ)'}
                          </span>
                        ) : (
                          <span
                            className={`font-bold font-currency-row ${
                              selectedAccount.currentBalance - amount < 0
                                ? 'text-red-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {formatVND(selectedAccount.currentBalance - amount)}
                            {selectedAccount.currentBalance - amount < 0 && ' (⚠️ Vượt số dư)'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DIRECTION INDICATOR */}
                  <div className="flex items-center justify-center -my-1 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center border-2 border-white">
                      <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    </div>
                  </div>

                  {/* TO ACCOUNT */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Khoản tiền đích
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedToAccount && (
                          <span className="text-xs font-semibold text-slate-500 font-currency-row">
                            Hiện có: {formatVND(selectedToAccount.currentBalance)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAccountTargetField('to');
                            setShowAddAccountModal(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer transition-all border border-blue-200/60"
                          title="Thêm tài khoản đích mới"
                        >
                          <span className="material-symbols-outlined text-[13px]">add</span>
                          Thêm
                        </button>
                      </div>
                    </div>
                    <select
                      id="transferToAccountSelect"
                      value={selectedToAccount?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setAccountTargetField('to');
                          setShowAddAccountModal(true);
                          return;
                        }
                        handleToAccountChange(Number(e.target.value));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {!selectedToAccount && <option value="">-- Chọn tài khoản nhận tiền --</option>}
                      {accountsList.map((a) => (
                        <option
                          key={a.id}
                          value={a.id}
                          disabled={a.id === selectedAccount?.id}
                        >
                          {getAccountEmoji(a.type)} {a.name} (Số dư: {formatVND(a.currentBalance)})
                          {a.id === selectedAccount?.id ? ' (Trùng ví nguồn)' : ''}
                          {a.note ? ` - [${a.note}]` : ''}
                        </option>
                      ))}
                      <option value="__ADD_NEW__">➕ Thêm tài khoản mới...</option>
                    </select>

                    {selectedToAccount && (
                      <div className="mt-2 text-[11px] flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100">
                        <span>Sau khi nhận:</span>
                        <span className="font-bold text-emerald-600 font-currency-row">
                          {formatVND(selectedToAccount.currentBalance + amount)}
                        </span>
                      </div>
                    )}
                  </div>

                  
                </div>
              </div>
            ) : (
              /* CATEGORIES SELECTION (7 cols left) */
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

                {/* Categories Grid (4 Columns) */}
                <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto custom-scroll pr-1">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    const theme = getCategoryTheme(cat);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex flex-col items-center py-2.5 px-1.5 rounded-xl transition-all cursor-pointer text-center group ${
                          isSelected
                            ? type === 'EXPENSE'
                              ? 'bg-red-50/90 border-2 border-red-500 shadow-sm text-red-900 scale-[1.02]'
                              : 'bg-emerald-50/90 border-2 border-emerald-500 shadow-sm text-emerald-900 scale-[1.02]'
                            : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700 hover:scale-[1.02]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1.5 text-lg sm:text-xl transition-all shadow-sm ${
                            isSelected
                              ? type === 'EXPENSE'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-emerald-600 text-white shadow-md'
                              : theme.bgClass || 'bg-slate-200/70 text-slate-700'
                          }`}
                        >
                          {renderCategoryIcon(cat, isSelected)}
                        </div>
                        <span
                          className={`text-[11px] sm:text-xs truncate w-full px-0.5 ${
                            isSelected ? 'font-bold' : 'font-semibold'
                          }`}
                          title={cat.name}
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
                    className="flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-700 cursor-pointer group"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200/80 flex items-center justify-center mb-1.5 transition-colors">
                      <svg
                        className="w-5 h-5 text-slate-500 group-hover:text-slate-700"
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
                    <span className="text-[11px] sm:text-xs font-bold">Thêm mới</span>
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
            )}

            {/* RIGHT COLUMN: Payment Account & Metadata (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              {/* Payment Account Selector (Only shown if NOT transfer) */}
              {type !== 'TRANSFER' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-500">
                        account_balance_wallet
                      </span>
                      Tài khoản thanh toán
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTargetField('from');
                        setShowAddAccountModal(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-blue-200/60"
                      title="Tạo tài khoản thanh toán mới"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>
                      Thêm tài khoản
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      id="normalAccountSelect"
                      value={selectedAccount?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setAccountTargetField('from');
                          setShowAddAccountModal(true);
                          return;
                        }
                        const acc = accountsList.find((a) => a.id === Number(e.target.value));
                        if (acc) setSelectedAccount(acc);
                        if (formError) setFormError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer"
                    >
                      {accountsList.length === 0 && (
                        <option value="">-- Chưa có tài khoản nào --</option>
                      )}
                      {accountsList.map((a) => {
                        const isCard = a.type === 'CREDIT_CARD';
                        const avail = isCard && a.creditLimit
                          ? Math.max(0, a.creditLimit - (a.currentBalance || 0))
                          : a.currentBalance;
                        return (
                          <option key={a.id} value={a.id}>
                            {getAccountEmoji(a.type)} {a.name} ({isCard ? 'Khả dụng thẻ' : 'Số dư'}:{' '}
                            {avail.toLocaleString('vi-VN')} đ)
                          </option>
                        );
                      })}
                      <option value="__ADD_NEW__">➕ Thêm tài khoản mới...</option>
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

                  {accountsList.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountTargetField('from');
                        setShowAddAccountModal(true);
                      }}
                      className="mt-2 w-full py-2.5 px-3 border border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl text-xs font-semibold text-blue-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Tạo tài khoản / Ví tiền mặt ngay
                    </button>
                  )}

                  {/* THÔNG TIN THẺ TÍN DỤNG & CẢNH BÁO HẠN MỨC */}
                  {selectedAccount?.type === 'CREDIT_CARD' && creditLimitValidation && (
                    <div
                      className={`mt-2 p-2.5 rounded-xl border text-xs transition-all ${
                        creditLimitValidation.isExceeded
                          ? 'bg-red-50 border-red-300 text-red-800 shadow-xs'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-amber-700">credit_card</span>
                          Hạn mức: {creditLimitValidation.limit.toLocaleString('vi-VN')} đ
                        </span>
                        <span className={creditLimitValidation.isExceeded ? 'text-red-700 font-extrabold' : 'text-slate-700'}>
                          Khả dụng: <strong>{creditLimitValidation.availableCredit.toLocaleString('vi-VN')} đ</strong>
                        </span>
                      </div>
                      {creditLimitValidation.isExceeded ? (
                        <p className="mt-1 text-red-600 font-bold flex items-center gap-1 leading-tight">
                          <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                          Vượt quá hạn mức! Chỉ còn được chi tối đa {creditLimitValidation.availableCredit.toLocaleString('vi-VN')} đ.
                        </p>
                      ) : (
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Dư nợ hiện tại: {creditLimitValidation.currentDebt.toLocaleString('vi-VN')} đ</span>
                          <span>Sau chi còn: {Math.max(0, creditLimitValidation.remainingAfterSpend).toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                            : type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={handleSetYesterday}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        isYesterday
                          ? type === 'EXPENSE'
                            ? 'bg-red-100 text-red-700'
                            : type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hôm qua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date Input with Manual Typing & Compact Calendar Popover */}
                  <div className="relative" ref={datePickerRef}>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={dateInput}
                        onChange={(e) => handleDateInputChange(e.target.value)}
                        onBlur={handleDateInputBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDateInputBlur();
                            setIsDatePickerOpen(false);
                          }
                        }}
                        placeholder="DD/MM/YYYY"
                        className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold py-2 pl-3 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tracking-wide"
                        title="Nhập ngày thủ công (ví dụ: 06/10/2026) hoặc nhấn biểu tượng lịch"
                      />
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen((prev) => !prev)}
                        className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded cursor-pointer flex items-center justify-center"
                        title="Mở lịch chọn ngày"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          calendar_today
                        </span>
                      </button>
                    </div>

                    {/* Compact Custom Calendar Popover (Thu nhỏ gọn gàng) */}
                    {isDatePickerOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2.5 animate-in fade-in zoom-in-95 select-none">
                        {/* Header: < [Tháng M v] [Năm YYYY v] > */}
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                          <button
                            type="button"
                            onClick={handlePrevCalMonth}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
                            title="Tháng trước"
                          >
                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {/* Chọn Tháng */}
                            <select
                              value={calendarViewDate.getMonth() + 1}
                              onChange={(e) => {
                                const newM = Number(e.target.value);
                                setCalendarViewDate(
                                  new Date(calendarViewDate.getFullYear(), newM - 1, 1)
                                );
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs hover:border-slate-300"
                              title="Chọn tháng"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                  Tháng {m}
                                </option>
                              ))}
                            </select>

                            {/* Chọn Năm: Các năm liên tiếp từ 2015 đến 2040 */}
                            <select
                              value={calendarViewDate.getFullYear()}
                              onChange={(e) => {
                                const newY = Number(e.target.value);
                                setCalendarViewDate(
                                  new Date(newY, calendarViewDate.getMonth(), 1)
                                );
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-blue-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs hover:border-slate-300"
                              title="Chọn năm"
                            >
                              {Array.from({ length: 26 }, (_, i) => 2015 + i).map((y) => (
                                <option key={y} value={y}>
                                  Năm {y}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextCalMonth}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
                            title="Tháng sau"
                          >
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </button>
                        </div>

                        {/* Weekday headers: T2 -> CN */}
                        <div className="grid grid-cols-7 mb-1 text-center">
                          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                            <div key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Days Grid - Compact */}
                        <div className="grid grid-cols-7 gap-0.5">
                          {calendarDays.map((cell, idx) => {
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setDate(cell.dateStr);
                                  setIsDatePickerOpen(false);
                                }}
                                className={`h-7 rounded-md text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                                  cell.isSelected
                                    ? type === 'EXPENSE'
                                      ? 'bg-red-600 text-white font-bold shadow-xs scale-105'
                                      : type === 'INCOME'
                                      ? 'bg-emerald-600 text-white font-bold shadow-xs scale-105'
                                      : 'bg-blue-600 text-white font-bold shadow-xs scale-105'
                                    : cell.isCurrentMonth
                                    ? 'text-slate-700 hover:bg-slate-100'
                                    : 'text-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {cell.dayNumber}
                                {cell.isToday && !cell.isSelected && (
                                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-red-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              handleSetToday();
                              setIsDatePickerOpen(false);
                            }}
                            className="font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Hôm nay
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="text-slate-500 hover:text-slate-700 cursor-pointer font-medium"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Input */}
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold py-2 px-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder={
                      type === 'TRANSFER'
                        ? 'Nội dung điều chuyển (ví dụ: Trích quỹ nuôi con, Tiền gửi bố mẹ...)'
                        : 'Nhập nội dung chi tiết (ví dụ: Cà phê Highlands, Tiền xăng...)'
                    }
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Error Notification */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
                <span className="font-semibold">{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

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
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300/80 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              {/* Save Primary CTA Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  amount <= 0 ||
                  hasNoAccounts ||
                  (type === 'TRANSFER'
                    ? !selectedAccount || !selectedToAccount || selectedAccount.id === selectedToAccount.id || accountsList.length < 2
                    : !selectedCategory || !selectedAccount)
                }
                className={`px-7 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'EXPENSE'
                    ? 'bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-glow-red'
                    : type === 'INCOME'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-glow-emerald'
                    : 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                      ></path>
                    </svg>
                    <span>
                      {editingTransaction
                        ? 'Lưu thay đổi (Enter)'
                        : type === 'TRANSFER'
                        ? 'Lưu chuyển khoản (Enter)'
                        : 'Lưu giao dịch (Enter)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>

        {/* Unified Add Category Modal */}
        <AddCategoryModal
          isOpen={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          initialType={type === 'INCOME' ? 'INCOME' : 'EXPENSE'}
          showTypeSelector={false}
          onSuccess={(created) => {
            setCategoriesList((prev) => [...prev, created]);
            setSelectedCategory(created);
            if (onCategoryCreated) {
              onCategoryCreated(created);
            }
          }}
        />

        {/* Quick Add Account Modal */}
        <AddAccountModal
          isOpen={showAddAccountModal}
          onClose={() => setShowAddAccountModal(false)}
          defaultType={accountsList.length === 0 ? 'CASH' : 'BANK'}
          existingAccounts={accountsList}
          onSuccess={handleAccountCreated}
        />
      </section>
    </div>
  );
};
