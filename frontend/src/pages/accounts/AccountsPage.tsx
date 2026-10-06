import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Account,
  AccountType,
  AccountSummary,
} from '../../types';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { AddAccountModal } from '../../components/modals/AddAccountModal';
import { AccountDetailModal } from '../../components/modals/AccountDetailModal';

interface AccountsPageProps {
  accounts?: Account[];
  onAddAccount?: (account: Account) => void;
  onRefresh?: () => void;
  onOpenAddTransaction?: (initial?: Partial<any>) => void;
}

type AccountWithStats = Account & {
  totalIncome?: number;
  totalExpense?: number;
  income?: number;
  expense?: number;
};

interface AccountTypeConfig {
  type: AccountType;
  title: string;
  countUnit: string;
  totalLabel: string;
  totalBadgeClass: string;
  totalTextClass: string;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
}

const Dong: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`underline underline-offset-2 ${className}`}>₫</span>
);

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts: propAccounts,
  onAddAccount,
  onRefresh,
  onOpenAddTransaction,
}) => {
  // ============================================================
  // STATE
  // ============================================================
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [accountStats, setAccountStats] = useState<Record<number, { income: number; expense: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<AccountType>('BANK');
  const [accountToArchive, setAccountToArchive] = useState<Account | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openMenuAccountId, setOpenMenuAccountId] = useState<number | null>(null);

  // Account Detail Modal (Edit account & Transaction history with Day/Month/Year filters)
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<Account | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Privacy toggle for hiding balances
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('finman_hide_balance') === 'true';
  });

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      localStorage.setItem('finman_hide_balance', String(next));
      return next;
    });
  };

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setOpenMenuAccountId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // ============================================================
  // CONFIG (Consistent with FinMan Design System & User Stitch)
  // ============================================================
  const accountTypeConfigs: AccountTypeConfig[] = [
    {
      type: 'BANK',
      title: 'Tài khoản Ngân hàng',
      countUnit: 'tài khoản',
      totalLabel: 'Tổng tài sản',
      totalBadgeClass: 'bg-tertiary-fixed/40',
      totalTextClass: 'text-tertiary',
      icon: 'account_balance',
      iconBgClass: 'bg-tertiary-fixed',
      iconTextClass: 'text-tertiary',
    },
    {
      type: 'CASH',
      title: 'Tiền mặt',
      countUnit: 'ví',
      totalLabel: 'Tổng tiền mặt',
      totalBadgeClass: 'bg-amber-50',
      totalTextClass: 'text-amber-700',
      icon: 'payments',
      iconBgClass: 'bg-amber-50',
      iconTextClass: 'text-amber-700',
    },
    {
      type: 'CREDIT_CARD',
      title: 'Thẻ tín dụng',
      countUnit: 'thẻ',
      totalLabel: 'Tổng dư nợ',
      totalBadgeClass: 'bg-error-container/60',
      totalTextClass: 'text-error',
      icon: 'credit_card',
      iconBgClass: 'bg-error-container/60',
      iconTextClass: 'text-error',
    },
    {
      type: 'INVESTMENT',
      title: 'Đầu tư',
      countUnit: 'danh mục',
      totalLabel: 'Tổng đầu tư',
      totalBadgeClass: 'bg-purple-100',
      totalTextClass: 'text-purple-700',
      icon: 'trending_up',
      iconBgClass: 'bg-purple-100',
      iconTextClass: 'text-purple-700',
    },
    {
      type: 'OTHER',
      title: 'Khác',
      countUnit: 'tài khoản',
      totalLabel: 'Tổng cộng',
      totalBadgeClass: 'bg-surface-container-high',
      totalTextClass: 'text-on-surface-variant',
      icon: 'category',
      iconBgClass: 'bg-surface-container-high',
      iconTextClass: 'text-on-surface-variant',
    },
  ];

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  // ============================================================
  // FETCH
  // ============================================================
  const fetchAccounts = useCallback(async () => {
    setError(null);
    try {
      const data = await accountService.getAccountsSummary(true);
      setSummary(data);

      // Load transaction stats to compute Thu / Chi dynamically per account
      try {
        const transactions = await transactionService.getTransactions({ size: 500 });
        const stats: Record<number, { income: number; expense: number }> = {};
        transactions.forEach((tx) => {
          if (tx.account?.id) {
            if (!stats[tx.account.id]) {
              stats[tx.account.id] = { income: 0, expense: 0 };
            }
            if (tx.type === 'INCOME') {
              stats[tx.account.id].income += tx.amount;
            } else if (tx.type === 'EXPENSE') {
              stats[tx.account.id].expense += tx.amount;
            } else if (tx.type === 'TRANSFER') {
              stats[tx.account.id].expense += tx.amount;
            }
          }
          if (tx.toAccount?.id && tx.type === 'TRANSFER') {
            if (!stats[tx.toAccount.id]) {
              stats[tx.toAccount.id] = { income: 0, expense: 0 };
            }
            stats[tx.toAccount.id].income += tx.amount;
          }
        });
        setAccountStats(stats);
      } catch {
        // Silently continue if transactions API is unavailable
      }

      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.warn('Could not fetch accounts from backend:', err);
      const accList = propAccounts || [];
      const totalAssets = accList
        .filter((account) => account.type !== 'CREDIT_CARD' && !account.isArchived)
        .reduce((sum, account) => sum + (account.currentBalance || 0), 0);

      const totalLiabilities = accList
        .filter((account) => account.type === 'CREDIT_CARD' && !account.isArchived)
        .reduce((sum, account) => sum + (account.currentBalance || 0), 0);

      setSummary({
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        accounts: accList,
      });
    }
  }, [propAccounts, onRefresh]);

  useEffect(() => {
    fetchAccounts();

    const handleSync = () => {
      fetchAccounts();
    };

    window.addEventListener('finman_accounts_updated', handleSync);
    window.addEventListener('finman_transactions_updated', handleSync);

    return () => {
      window.removeEventListener('finman_accounts_updated', handleSync);
      window.removeEventListener('finman_transactions_updated', handleSync);
    };
  }, [fetchAccounts]);

  // ============================================================
  // ACCOUNT LISTS & DYNAMIC METRIC KPI CALCULATIONS
  // ============================================================
  const allAccounts = summary?.accounts || propAccounts || [];
  const activeAccounts = useMemo(() => allAccounts.filter((account) => !account.isArchived), [allAccounts]);
  const archivedAccounts = useMemo(() => allAccounts.filter((account) => account.isArchived), [allAccounts]);

  // Compute live financial totals accurately taking into account negative balances (debts/overdrafts)
  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    let assets = 0;
    let liabilities = 0;

    activeAccounts.forEach((account) => {
      const balance = account.currentBalance || 0;
      if (account.type === 'CREDIT_CARD') {
        if (balance >= 0) {
          liabilities += balance;
        } else {
          assets += Math.abs(balance);
        }
      } else {
        if (balance >= 0) {
          assets += balance;
        } else {
          // Negative balance on bank/cash/other is a liability (nợ/thấu chi)
          liabilities += Math.abs(balance);
        }
      }
    });

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: assets - liabilities,
    };
  }, [activeAccounts]);

  // ============================================================
  // HELPERS & FORMATTERS
  // ============================================================
  const formatCurrency = (amount: number): string => {
    if (hideBalance) return '••••••••';
    return amount.toLocaleString('vi-VN');
  };

  const getSubtitle = (account: Account): string => {
    const note = account.note?.trim();
    const accNum = account.accountNumber?.trim();
    const last4 = accNum ? (accNum.length > 4 ? accNum.slice(-4) : accNum) : null;

    if (note && last4) {
      if (note.includes(last4)) return note;
      return `${note} • ${last4}`;
    }
    if (note) return note;
    if (last4) {
      const typeLabel = account.type === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 'Tài khoản chính';
      return `${typeLabel} • ${last4}`;
    }
    return account.type === 'CREDIT_CARD'
      ? 'Thẻ tín dụng'
      : account.type === 'CASH'
      ? 'Ví tiền mặt'
      : 'Tài khoản thanh toán';
  };

  const getAccountIncome = (account: Account): number => {
    const item = account as AccountWithStats;
    if (item.totalIncome != null) return item.totalIncome;
    if (item.income != null) return item.income;
    return accountStats[account.id]?.income || 0;
  };

  const getAccountExpense = (account: Account): number => {
    const item = account as AccountWithStats;
    if (item.totalExpense != null) return item.totalExpense;
    if (item.expense != null) return item.expense;
    return accountStats[account.id]?.expense || 0;
  };

  const getBalanceColor = (account: Account): string => {
    if ((account.currentBalance || 0) < 0) {
      return 'text-red-600 font-extrabold';
    }
    if (account.type === 'CREDIT_CARD') {
      return 'text-primary-container';
    }
    const nameLower = (account.name || '').toLowerCase();
    const noteLower = (account.note || '').toLowerCase();
    if (
      nameLower.includes('tiết kiệm') ||
      noteLower.includes('tiết kiệm') ||
      nameLower.includes('nuôi con') ||
      nameLower.includes('mục tiêu') ||
      noteLower.includes('mục tiêu') ||
      account.type === 'INVESTMENT'
    ) {
      return 'text-tertiary'; // Royal blue
    }
    return 'text-on-surface'; // Deep dark navy
  };

  const renderAccountAvatar = (account: Account) => {
    const nameLower = (account.name || '').toLowerCase();
    const noteLower = (account.note || '').toLowerCase();
    const bankLower = (account.bankName || '').toLowerCase();
    const text = `${nameLower} ${bankLower}`;

    if (account.type === 'BANK') {
      if (text.includes('vietcombank') || text.includes('vcb')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            VCB
          </div>
        );
      }
      if (text.includes('techcombank') || text.includes('tcb')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            TCB
          </div>
        );
      }
      if (text.includes('mbbank') || text.includes('mb bank') || text.includes(' mb ')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            MB
          </div>
        );
      }
      if (text.includes('acb')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            ACB
          </div>
        );
      }
      if (text.includes('bidv')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            BIDV
          </div>
        );
      }
      if (text.includes('vpbank') || text.includes('vpb')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            VPB
          </div>
        );
      }
      if (text.includes('tpbank') || text.includes('tpb')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            TPB
          </div>
        );
      }
      if (text.includes('vietinbank') || text.includes('ctg')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            CTG
          </div>
        );
      }
      // Family / child / goal account icon
      if (
        nameLower.includes('nuôi con') ||
        nameLower.includes('con') ||
        nameLower.includes('gia đình') ||
        nameLower.includes('bé') ||
        noteLower.includes('gia đình') ||
        noteLower.includes('con')
      ) {
        return (
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-base">favorite</span>
          </div>
        );
      }
      if (nameLower.includes('tiết kiệm') || noteLower.includes('tiết kiệm')) {
        return (
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-base">savings</span>
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-2xs">
          <span className="material-symbols-outlined text-base">account_balance</span>
        </div>
      );
    }

    if (account.type === 'CASH') {
      if (
        nameLower.includes('két') ||
        nameLower.includes('dự phòng') ||
        noteLower.includes('két') ||
        noteLower.includes('khẩn cấp')
      ) {
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-base">savings</span>
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
          <span className="material-symbols-outlined text-base">wallet</span>
        </div>
      );
    }

    if (account.type === 'CREDIT_CARD') {
      return (
        <div className="w-8 h-8 rounded-lg bg-error-container/60 text-error flex items-center justify-center shrink-0 shadow-2xs">
          <span className="material-symbols-outlined text-base">credit_card</span>
        </div>
      );
    }

    if (account.type === 'INVESTMENT') {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
          <span className="material-symbols-outlined text-base">trending_up</span>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 shadow-2xs">
        <span className="material-symbols-outlined text-base">category</span>
      </div>
    );
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleOpenAddModal = (defaultType: AccountType = 'BANK') => {
    setModalDefaultType(defaultType);
    setIsModalOpen(true);
  };

  const handleAccountCreated = async (created: Account) => {
    showToast(`Đã tạo tài khoản "${created.name}" thành công!`);
    if (onAddAccount) onAddAccount(created);
    window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
    await fetchAccounts();
  };

  const handleArchiveConfirm = async () => {
    if (!accountToArchive) return;
    setIsArchiving(true);
    try {
      await accountService.archiveAccount(accountToArchive.id, true, accountToArchive);
      showToast(`Đã lưu trữ tài khoản "${accountToArchive.name}".`);
      setAccountToArchive(null);
      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
      await fetchAccounts();
    } catch (err: unknown) {
      console.error('Error archiving account:', err);
      showToast(`Không thể lưu trữ tài khoản "${accountToArchive.name}".`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchiveAccount = async (account: Account) => {
    try {
      await accountService.archiveAccount(account.id, false, account);
      showToast(`Đã khôi phục tài khoản "${account.name}".`);
      window.dispatchEvent(new CustomEvent('finman_accounts_updated'));
      await fetchAccounts();
    } catch (err: unknown) {
      console.error('Error unarchiving account:', err);
      showToast('Khôi phục tài khoản thất bại, vui lòng thử lại.');
    }
  };

  // ============================================================
  // ACCOUNT CARD COMPONENT (Formatted for 4 columns)
  // ============================================================
  const renderAccountCard = (account: Account) => {
    const isCredit = account.type === 'CREDIT_CARD';
    const currentBalance = account.currentBalance || 0;
    const isNegative = currentBalance < 0;
    const creditLimit = account.creditLimit || 0;
    const income = getAccountIncome(account);
    const expense = getAccountExpense(account);
    const subtitle = getSubtitle(account);

    const usedPercent =
      isCredit && creditLimit > 0
        ? Math.min(100, Math.round((currentBalance / creditLimit) * 100))
        : 0;

    const availableCredit = Math.max(0, creditLimit - currentBalance);

    return (
      <div
        key={account.id}
        onClick={() => {
          setSelectedDetailAccount(account);
          setIsDetailModalOpen(true);
        }}
        className={`
          p-space-sm
          rounded-xl
          ${
            isNegative
              ? 'bg-red-50/70 border border-red-200/90 hover:border-red-400 shadow-2xs hover:shadow-md'
              : 'bg-surface-container-lowest border border-slate-200 hover:border-primary/50 hover:shadow-md'
          }
          transition-all
          flex flex-col justify-between
          gap-space-xs
          group
          min-w-0
          cursor-pointer
          active:scale-[0.99]
        `}
        title="Bấm để xem chi tiết, sửa tài khoản và lịch sử giao dịch"
      >
        {/* TOP ROW: AVATAR + TITLE/SUBTITLE + 3 DOTS MENU */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {renderAccountAvatar(account)}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="font-title-md text-sm text-on-surface font-semibold leading-tight truncate"
                  title={account.name}
                >
                  {account.name}
                </span>
                {isNegative && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-100 text-red-700 shrink-0 border border-red-200/80">
                    Số dư âm
                  </span>
                )}
              </div>
              <span
                className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5"
                title={subtitle}
              >
                {subtitle}
              </span>
            </div>
          </div>

          {/* 3 DOTS ACTION MENU */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuAccountId(openMenuAccountId === account.id ? null : account.id);
              }}
              className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
              title="Tùy chọn tài khoản"
            >
              <span className="material-symbols-outlined text-base">
                more_vert
              </span>
            </button>

            {openMenuAccountId === account.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="
                  absolute right-0 top-8 z-40
                  w-44
                  bg-surface-container-lowest
                  rounded-xl
                  shadow-xl
                  border border-outline-variant/30
                  py-1
                  text-xs font-medium text-on-surface
                  animate-in fade-in zoom-in-95 duration-100
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuAccountId(null);
                    setAccountToArchive(account);
                  }}
                  className="
                    w-full px-3 py-2 text-left
                    hover:bg-error-container hover:text-error
                    flex items-center gap-2
                    cursor-pointer transition-colors
                  "
                >
                  <span className="material-symbols-outlined text-[16px]">
                    archive
                  </span>
                  <span>Lưu trữ tài khoản</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE ROW: CURRENT BALANCE */}
        <div className="py-1">
          <span
            className={`
              font-currency-display
              text-xl sm:text-2xl
              font-extrabold
              tracking-tight
              block
              ${getBalanceColor(account)}
            `}
          >
            {hideBalance ? '••••••••' : currentBalance.toLocaleString('vi-VN')} <Dong />
          </span>
        </div>

        {/* CREDIT CARD USAGE BAR */}
        {isCredit && creditLimit > 0 && (
          <div className="py-1">
            <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1">
              <span>Đã dùng {usedPercent}%</span>
              <span>
                Còn {formatCurrency(availableCredit)} <Dong />
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usedPercent > 80 ? 'bg-error' : 'bg-primary-container'
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* BOTTOM ROW: THU / CHI STATS */}
        <div className={`pt-1.5 border-t ${isNegative ? 'border-red-200/70' : 'border-surface-container/60'} flex items-center justify-between font-label-sm text-label-sm`}>
          {/* Thu */}
          <span className="text-secondary font-medium flex items-center gap-0.5 truncate mr-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            Thu: {hideBalance ? '••••' : `+${income.toLocaleString('vi-VN')}`} <Dong />
          </span>

          {/* Chi */}
          {expense > 0 ? (
            <span className="text-error font-medium flex items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>
              Chi: {hideBalance ? '••••' : `-${expense.toLocaleString('vi-VN')}`} <Dong />
            </span>
          ) : (
            <span className="text-on-surface-variant font-medium flex items-center gap-0.5 shrink-0">
              Chi: {hideBalance ? '••••' : '0'} <Dong />
            </span>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // SECTION FOR EACH ACCOUNT TYPE (4 ACCOUNTS PER ROW)
  // ============================================================
  const renderAccountTypeSection = (
    accounts: Account[],
    config: AccountTypeConfig
  ) => {
    const accountsOfType = accounts.filter((acc) => acc.type === config.type);
    if (accountsOfType.length === 0) return null;

    const total = accountsOfType.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    );

    return (
      <div
        key={config.type}
        className="
          p-space-md
          rounded-2xl
          bg-surface-container-lowest
          shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]
          border border-outline-variant/15
          flex flex-col gap-space-sm
          w-full
        "
      >
        {/* SECTION HEADER */}
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-2">
            <div
              className={`
                w-8 h-8
                rounded-lg
                ${config.iconBgClass}
                ${config.iconTextClass}
                flex items-center justify-center
                shrink-0
              `}
            >
              <span className="material-symbols-outlined text-base">
                {config.icon}
              </span>
            </div>

            <span className="font-title-md text-title-md text-on-surface font-semibold">
              {config.title}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
              {accountsOfType.length} {config.countUnit}
            </span>
          </div>

          <div
            className={`
              flex items-center gap-1.5
              ${config.totalBadgeClass}
              px-space-sm py-1
              rounded-xl
            `}
          >
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              {config.totalLabel}:
            </span>
            <span
              className={`
                font-currency-row text-currency-row font-bold
                ${config.totalTextClass}
              `}
            >
              {formatCurrency(total)} <Dong />
            </span>
          </div>
        </div>

        {/* 3-COLUMN GRID (3 TÀI KHOẢN TRONG 1 HÀNG) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm w-full">
          {accountsOfType.map(renderAccountCard)}
        </div>
      </div>
    );
  };

  // ============================================================
  // EMPTY STATE
  // ============================================================
  const renderEmptyActiveState = () => {
    if (activeAccounts.length > 0) return null;

    return (
      <div className="w-full rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant/40 py-16 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">
            account_balance_wallet
          </span>
        </div>
        <h2 className="text-lg font-bold text-on-surface">Chưa có tài khoản</h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-md">
          Tạo tài khoản đầu tiên để bắt đầu theo dõi tiền, tài sản và các nghĩa vụ tài chính của bạn.
        </p>
        <button
          type="button"
          onClick={() => handleOpenAddModal('BANK')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold hover:opacity-95 shadow-md shadow-primary-container/20 transition-colors cursor-pointer"
        >
          + Thêm tài khoản
        </button>
      </div>
    );
  };

  // ============================================================
  // ARCHIVED TAB CONTENT
  // ============================================================
  const renderArchivedContent = () => {
    if (archivedAccounts.length === 0) {
      return (
        <div className="w-full rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant/40 text-center py-16 px-6 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[42px] text-on-surface-variant/40 mb-3">
            inventory_2
          </span>
          <p className="text-lg font-bold text-on-surface">
            Không có tài khoản lưu trữ
          </p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md">
            Các tài khoản đã lưu trữ sẽ xuất hiện tại đây. Lịch sử giao dịch vẫn được bảo toàn.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm w-full">
        {archivedAccounts.map((account) => {
          const isNegative = (account.currentBalance || 0) < 0;
          return (
            <div
              key={account.id}
              onClick={() => {
                setSelectedDetailAccount(account);
                setIsDetailModalOpen(true);
              }}
              className={`
                p-space-sm rounded-xl
                ${
                  isNegative
                    ? 'bg-red-50/70 border border-red-200/90 hover:border-red-400'
                    : 'bg-surface-container-lowest border border-slate-200 hover:border-slate-300'
                }
                hover:shadow-md transition-all flex flex-col justify-between gap-space-xs cursor-pointer active:scale-[0.99]
              `}
              title="Bấm để xem chi tiết và lịch sử giao dịch"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {renderAccountAvatar(account)}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-title-md text-sm text-on-surface font-semibold leading-tight truncate">
                        {account.name}
                      </span>
                      {isNegative && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-100 text-red-700 shrink-0 border border-red-200/80">
                          Số dư âm
                        </span>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {getSubtitle(account)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchiveAccount(account);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary text-xs font-semibold text-on-surface transition-colors cursor-pointer shrink-0"
                >
                  Khôi phục
                </button>
              </div>

              <div className="py-1">
                <span className="text-xs text-on-surface-variant block">Số dư lúc lưu trữ</span>
                <span className={`font-currency-display text-lg ${isNegative ? 'text-red-600 font-extrabold' : 'text-on-surface font-extrabold'} tracking-tight block`}>
                  {formatCurrency(account.currentBalance || 0)} <Dong />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER (FULL WIDTH, STICKY HERO STRIP, 4-COL GRID)
  // ============================================================
  return (
    <div className="w-full px-space-md sm:px-space-lg py-space-md flex flex-col gap-space-lg select-none">
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-on-background text-on-primary px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAccounts}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-error text-xs font-bold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ========================================================
          STICKY HEADER STRIP: 3 KPI CARDS + TOOLBAR (TABS & ADD BUTTON)
          Stays fixed under the TopHeader (top-20) when scrolling!
      ======================================================== */}
      <div className="sticky top-20 z-30 bg-surface/90 backdrop-blur-xl pt-1 pb-space-sm -mx-space-md sm:-mx-space-lg px-space-md sm:px-space-lg border-b border-surface-container/50 shadow-xs flex flex-col gap-space-sm">
        {/* 1. 3 PRESTIGE METRIC KPI HERO CARDS (CHÍNH XÁC THEO CSS BÊN THỐNG KÊ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md w-full">
          {/* Card 1: TÀI SẢN (Xanh dương Gradient) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-space-lg rounded-xl shadow-md shadow-blue-500/15 flex flex-col justify-between border border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/25 transition-all text-white">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-blue-100 uppercase tracking-wider font-bold">
                  TÀI SẢN
                </span>
                <button
                  type="button"
                  onClick={toggleHideBalance}
                  className="p-1 text-blue-200 hover:text-white transition-colors cursor-pointer"
                  title={hideBalance ? 'Hiện số dư' : 'Ẩn số dư'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {hideBalance ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>

            <div className="mt-space-sm mb-space-md relative z-10">
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-currency-display text-currency-display text-white font-extrabold tracking-tight">
                  {hideBalance ? '••••••••' : totalAssets.toLocaleString('vi-VN')}
                </span>
                <span className="font-title-md text-title-md text-blue-200 font-bold">
                  ₫
                </span>
              </div>
            </div>            
          </div>

          {/* Card 2: KHOẢN NỢ (Đỏ Gradient) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-rose-700 p-space-lg rounded-xl shadow-md shadow-red-500/15 flex flex-col justify-between border border-red-400/30 hover:shadow-lg hover:shadow-red-500/25 transition-all text-white">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="font-label-md text-label-md text-rose-100 uppercase tracking-wider font-bold">
                KHOẢN NỢ
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </div>
            </div>

            <div className="mt-space-sm mb-space-md relative z-10">
              <div className="flex items-baseline gap-space-2xs text-white">
                <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                  {hideBalance
                    ? '••••••••'
                    : totalLiabilities > 0
                    ? `-${totalLiabilities.toLocaleString('vi-VN')}`
                    : '0'}
                </span>
                <span className="font-title-md text-title-md text-rose-200 font-bold">₫</span>
              </div>        
            </div>
          </div>

          {/* Card 3: TÀI SẢN RÒNG (Xanh lá Gradient) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 p-space-lg rounded-xl shadow-md shadow-emerald-500/15 flex flex-col justify-between border border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-white">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="font-label-md text-label-md text-emerald-100 uppercase tracking-wider font-bold">
                TÀI SẢN RÒNG
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
              </div>
            </div>

            <div className="mt-space-sm mb-space-md relative z-10">
              <div className="flex items-baseline gap-space-2xs text-white">
                <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                  {hideBalance
                    ? '••••••••'
                    : netWorth >= 0
                    ? `+${netWorth.toLocaleString('vi-VN')}`
                    : netWorth.toLocaleString('vi-VN')}
                </span>
                <span className="font-title-md text-title-md text-emerald-200 font-bold">₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CHUNG VỚI DIV ĐÓ: NÚT ĐANG HOẠT ĐỘNG, NÚT LƯU TRỮ VÀ NÚT THÊM TÀI KHOẢN */}
        <div className="flex items-center justify-between gap-space-md pt-1">
          {/* TABS: Đang hoạt động / Lưu trữ */}
          <div className="inline-flex p-1 bg-surface-container rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                account_balance_wallet
              </span>
              <span>Đang hoạt động ({activeAccounts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ARCHIVED')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ARCHIVED'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                inventory_2
              </span>
              <span>Lưu trữ ({archivedAccounts.length})</span>
            </button>
          </div>

          {/* BUTTON THÊM TÀI KHOẢN MỚI */}
          <button
            type="button"
            onClick={() => handleOpenAddModal('BANK')}
            className="
              inline-flex
              items-center
              gap-2
              px-space-lg
              py-2.5
              rounded-xl
              bg-primary-container
              text-on-primary
              hover:opacity-95
              shadow-md
              shadow-primary-container/20
              transition-all
              font-label-lg
              text-label-lg
              font-bold
              cursor-pointer
            "
          >
            <span className="material-symbols-outlined text-lg">
              add_circle
            </span>
            <span>Thêm tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          MAIN WORKSPACE: FULL WIDTH WITH 4-COLUMN ACCOUNTS GRID
      ======================================================== */}
      <div className="w-full flex flex-col gap-space-lg">
        {activeTab === 'ACTIVE' ? (
          <>
            {renderEmptyActiveState()}

            {activeAccounts.length > 0 && (
              <div className="w-full flex flex-col gap-space-lg">
                {accountTypeConfigs.map((config) =>
                  renderAccountTypeSection(activeAccounts, config)
                )}
              </div>
            )}
          </>
        ) : (
          renderArchivedContent()
        )}
      </div>

      {/* MODAL: ADD ACCOUNT */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAccountCreated}
        defaultType={modalDefaultType}
        existingAccounts={activeAccounts}
      />

      {/* MODAL: CONFIRM ARCHIVE */}
      {accountToArchive && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-on-background/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 border border-outline-variant/30 animate-in zoom-in-95 duration-100">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[26px]">
                archive
              </span>
            </div>

            <h3 className="text-lg font-bold text-on-surface text-center">
              Lưu trữ tài khoản này?
            </h3>

            <p className="mt-2 text-sm text-on-surface-variant text-center leading-6">
              Bạn có chắc chắn muốn lưu trữ tài khoản{' '}
              <strong className="text-on-surface">
                "{accountToArchive.name}"
              </strong>
              ?<br />
              Lịch sử các giao dịch đã ghi nhận sẽ vẫn được bảo lưu an toàn.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setAccountToArchive(null)}
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchiveConfirm}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary hover:opacity-95 text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isArchiving ? 'Đang lưu trữ...' : 'Xác nhận lưu trữ'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ACCOUNT DETAIL & TRANSACTIONS & EDIT */}
      <AccountDetailModal
        key={selectedDetailAccount?.id ? `acc-modal-${selectedDetailAccount.id}` : 'no-account'}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailAccount(null);
        }}
        account={selectedDetailAccount}
        onAccountUpdated={(updatedAccount) => {
          setSelectedDetailAccount(updatedAccount);
          setSummary((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              accounts: prev.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
            };
          });
        }}
        onOpenAddTransaction={(acc) => {
          if (onOpenAddTransaction) {
            onOpenAddTransaction({ account: acc });
          }
        }}
        onRefresh={() => {
          fetchAccounts();
          onRefresh?.();
        }}
      />
    </div>
  );
};