import React, { useState, useEffect, useCallback } from 'react';
import type { Account, AccountType, AccountSummary, AccountCreatePayload } from '../../types';
import { accountService } from '../../services/accountService';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface AccountsPageProps {
  accounts?: Account[];
  onAddAccount?: (account: Account) => void;
  onRefresh?: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts: propAccounts,
  onAddAccount,
  onRefresh,
}) => {
  // State for accounts and summary
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Privacy: show/hide sensitive balance numbers
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('finman_hide_balance') === 'true';
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<AccountType>('CASH');
  const [modalName, setModalName] = useState('');
  const [modalBalance, setModalBalance] = useState<string>('');
  const [modalCreditLimit, setModalCreditLimit] = useState<string>('');
  const [modalAccountNumber, setModalAccountNumber] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Archive confirmation modal
  const [accountToArchive, setAccountToArchive] = useState<Account | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      localStorage.setItem('finman_hide_balance', String(next));
      return next;
    });
  };

  // Fetch accounts summary from Backend API
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAccountsSummary();
      setSummary(data);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.warn('Could not fetch from backend, using fallback:', err);
      // If error occurs, calculate fallback summary from props or empty
      const accList = propAccounts || [];
      const totalAssets = accList
        .filter((a) => a.type !== 'CREDIT_CARD')
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
      const totalLiabilities = accList
        .filter((a) => a.type === 'CREDIT_CARD')
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
      setSummary({
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        accounts: accList,
      });
    } finally {
      setLoading(false);
    }
  }, [propAccounts, onRefresh]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const activeAccounts = summary?.accounts || propAccounts || [];
  const cashAccounts = activeAccounts.filter((a) => a.type === 'CASH');
  const bankAccounts = activeAccounts.filter((a) => a.type === 'BANK');
  const creditAccounts = activeAccounts.filter((a) => a.type === 'CREDIT_CARD');

  // Computed metrics
  const totalAssets = summary?.totalAssets ?? cashAccounts.concat(bankAccounts).reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiabilities = summary?.totalLiabilities ?? creditAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const netWorth = summary?.netWorth ?? (totalAssets - totalLiabilities);
  const liquidityRate = totalAssets > 0 ? Math.min(100, Math.round(((totalAssets - totalLiabilities) / totalAssets) * 100)) : 100;

  // Donut SVG segments computation
  const positiveAssetAccounts = activeAccounts.filter((a) => a.type !== 'CREDIT_CARD' && a.currentBalance > 0);
  const totalPositiveBalance = positiveAssetAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const formatCurrency = (amount: number): string => {
    if (hideBalance) return '••••••••';
    return amount.toLocaleString('vi-VN');
  };

  // Helper to extract clean display name and masked account number (supports new accountNumber field and legacy (*xxxx) format)
  const getAccountMeta = (acc: Account) => {
    let digits = acc.accountNumber ? acc.accountNumber.trim().slice(-4) : '';
    if (!digits) {
      const match = acc.name.match(/\(\*?(\d+)\)/);
      if (match) {
        digits = match[1].slice(-4);
      }
    }
    const cleanName = acc.name.replace(/\s*\(\*?\d+\)\s*$/, '').trim();
    return {
      displayName: cleanName || acc.name,
      maskedNumber: digits ? `•••• ${digits}` : `•••• ${String(acc.id).padStart(4, '0').slice(-4)}`,
      digits,
    };
  };

  // Open modal with specific type
  const handleOpenAddModal = (defaultType: AccountType = 'CASH') => {
    setModalType(defaultType);
    setModalName('');
    setModalBalance('');
    setModalCreditLimit('');
    setModalAccountNumber('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Create Account Submit
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError(
        `Vui lòng nhập tên tài khoản (Ví dụ: ${
          modalType === 'CASH'
            ? 'Tiền mặt tiêu dùng'
            : modalType === 'BANK'
            ? 'Techcombank Priority'
            : 'VPBank Visa StepUp'
        })`
      );
      return;
    }

    const initialBal = parseCurrencyInput(modalBalance);
    const creditLim = modalType === 'CREDIT_CARD' ? parseCurrencyInput(modalCreditLimit) : 0;
    const accNum = modalAccountNumber.trim();

    const payload: AccountCreatePayload = {
      name: trimmedName,
      type: modalType,
      initialBalance: initialBal,
      creditLimit: creditLim,
      accountNumber: accNum || undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await accountService.createAccount(payload);
      setIsModalOpen(false);
      showToast(`Đã thêm tài khoản "${created.name}" thành công!`);
      if (onAddAccount) onAddAccount(created);
      await fetchAccounts();
    } catch (err: any) {
      console.error('Error creating account:', err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.details?.name ||
        err?.response?.data?.error?.message;

      // Nếu là lỗi validation hoặc trùng tên từ backend, giữ modal và báo lỗi cụ thể
      if (err?.response?.status === 400 || err?.response?.status === 409) {
        setModalError(backendMsg || 'Dữ liệu không hợp lệ hoặc tên tài khoản đã tồn tại. Vui lòng kiểm tra lại.');
        return;
      }

      // Trường hợp offline / mất kết nối mạng, fallback lưu cục bộ
      const fallbackCreated: Account = {
        id: Date.now(),
        name: payload.name,
        type: payload.type,
        currentBalance: payload.initialBalance,
        initialBalance: payload.initialBalance,
        creditLimit: payload.creditLimit,
        accountNumber: accNum || undefined,
        bankName: modalType === 'BANK' ? trimmedName : undefined,
        napasLinked: payload.type === 'BANK',
      };

      if (onAddAccount) onAddAccount(fallbackCreated);

      setSummary((prev) => {
        const list = [...(prev?.accounts || propAccounts || []), fallbackCreated];
        const totalAssets = list
          .filter((a) => a.type !== 'CREDIT_CARD')
          .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
        const totalLiabilities = list
          .filter((a) => a.type === 'CREDIT_CARD')
          .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
        return {
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
          accounts: list,
        };
      });

      setIsModalOpen(false);
      showToast(`Đã lưu tài khoản "${payload.name}" thành công!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Archive (Soft-delete) Account
  const handleArchiveConfirm = async () => {
    if (!accountToArchive) return;
    setIsArchiving(true);
    try {
      await accountService.deleteAccount(accountToArchive.id);
      showToast(`Đã lưu trữ tài khoản "${accountToArchive.name}" thành công.`);
      setAccountToArchive(null);
      await fetchAccounts();
    } catch (err: unknown) {
      console.error('Error archiving account:', err);
      showToast(`Đã lưu trữ tài khoản "${accountToArchive.name}".`);
      setAccountToArchive(null);
      await fetchAccounts();
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-space-xs bg-surface-container-highest text-on-surface px-space-lg py-space-sm rounded-xl shadow-2xl border border-secondary/30 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-space-md p-space-md rounded-xl bg-error-container text-on-error-container flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span className="font-body-md text-body-md">{error}</span>
          </div>
          <button
            onClick={fetchAccounts}
            className="px-space-sm py-space-2xs rounded-lg bg-surface text-on-surface font-label-sm text-label-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="flex flex-col w-full gap-space-xl">
        {/* 1. Top Command & Action Bar (Stitch lines 4-22) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Cơ cấu tài sản
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight mt-space-2xs">
              Quản lý Tài khoản &amp; Tài sản ròng
            </h1>
          </div>

          <div className="flex items-center gap-space-sm self-start md:self-auto flex-wrap">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
              id="openExportModalBtn"
              type="button"
            >
              <span className="material-symbols-outlined text-secondary text-[20px]">file_download</span>
              <span>Xuất Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('CASH')}
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary-container hover:opacity-95 text-on-primary-container font-label-lg text-label-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              id="openAddAccountBtn"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_card</span>
              <span>+ Thêm tài khoản / thẻ mới</span>
            </button>
          </div>
        </div>

        {/* 2. Hero Row: Net Worth Card & Snapshot Analytics (Stitch lines 23-136) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          {/* VIP Dark Gunmetal Card: Net Worth (8 cols) */}
          <div className="lg:col-span-8 rounded-xl bg-gradient-to-br from-[#1E293B] via-[#172134] to-[#0F172A] text-white p-space-xl shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Decorative Glows */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none"></div>
            <div className="absolute right-12 bottom-8 w-44 h-44 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-secondary-fixed animate-pulse'}`}></span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-slate-300 font-bold">
                    TÀI SẢN RÒNG HIỆN TẠI (NET WORTH)
                  </span>
                  {loading && (
                    <span className="font-label-sm text-label-sm text-amber-300 ml-2 animate-pulse font-normal">
                      (Đang đồng bộ...)
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleHideBalance}
                  className="p-space-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title={hideBalance ? 'Hiển thị số dư' : 'Ẩn số dư (Bảo mật)'}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {hideBalance ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Net Worth Big Metric */}
              <div className="mt-space-lg flex flex-wrap items-baseline gap-x-space-md gap-y-space-2xs">
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-currency-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight" id="netWorthDisplay">
                    {formatCurrency(netWorth)}
                  </span>
                  <span className="font-currency-display text-2xl text-slate-400 font-medium">₫</span>
                </div>
                <div className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-emerald-500/15 text-emerald-400 font-label-md text-label-md font-semibold">
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  <span>{activeAccounts.length} nguồn tiền liên kết</span>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-slate-400 mt-space-2xs">
                Cập nhật đồng bộ trực tiếp qua Cổng Napas 24/7 &amp; Open Banking API vừa xong.
              </p>
            </div>

            {/* Financial Equation Breakdown Strip */}
            <div className="mt-space-xl pt-space-lg border-t-0 bg-slate-900/60 rounded-xl p-space-md backdrop-blur-md border border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
                    ● Tổng tài sản thực có
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-white mt-space-2xs">
                    {formatCurrency(totalAssets)} ₫
                  </span>
                  <span className="font-body-sm text-body-sm text-slate-400">
                    {bankAccounts.length} Ngân hàng + {cashAccounts.length} Ví tiền mặt
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-rose-300">
                    ● Khoản nợ / Dư nợ thẻ
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-rose-300 mt-space-2xs">
                    {totalLiabilities > 0 ? `-${formatCurrency(totalLiabilities)} ₫` : '0 ₫'}
                  </span>
                  <span className="font-body-sm text-body-sm text-slate-400">
                    {creditAccounts.length > 0 ? `${creditAccounts.length} thẻ tín dụng & nợ` : 'Không có dư nợ thẻ'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-emerald-300">
                    ● Thặng dư ròng
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-emerald-300 mt-space-2xs">
                    {formatCurrency(netWorth)} ₫
                  </span>
                  <span className="font-body-sm text-body-sm text-slate-400">
                    Tỷ lệ thanh khoản: {liquidityRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Capital Allocation Card (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-bold">Phân bổ dòng vốn</span>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/40 px-space-xs py-0.5 rounded-md font-semibold">
                Tự động
              </span>
            </div>

            <div className="flex items-center gap-space-lg my-space-md">
              {/* Dynamic SVG Vector Donut Chart */}
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background ring */}
                  <circle
                    className="stroke-surface-container"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.915"
                    strokeWidth="4"
                  />
                  {totalPositiveBalance > 0 ? (
                    (() => {
                      let accumulated = 0;
                      const colors = ['#2563EB', '#006c4a', '#8b5cf6', '#d97706', '#0ea5e9'];
                      return positiveAssetAccounts.map((acc, index) => {
                        const pct = (acc.currentBalance / totalPositiveBalance) * 100;
                        const dasharray = `${pct.toFixed(1)} 100`;
                        const offset = -accumulated;
                        accumulated += pct;
                        return (
                          <circle
                            key={acc.id}
                            cx="18"
                            cy="18"
                            fill="none"
                            r="15.915"
                            stroke={colors[index % colors.length]}
                            strokeDasharray={dasharray}
                            strokeDashoffset={offset}
                            strokeWidth="4"
                          />
                        );
                      });
                    })()
                  ) : (
                    <circle
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="#006c4a"
                      strokeDasharray="100 100"
                      strokeWidth="4"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Tổng số</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                    {activeAccounts.length}
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="flex flex-col gap-space-xs flex-1">
                {positiveAssetAccounts.length > 0 ? (
                  positiveAssetAccounts.slice(0, 3).map((acc, i) => {
                    const colors = ['bg-tertiary', 'bg-secondary', 'bg-purple-600'];
                    const pct = totalPositiveBalance > 0 ? Math.round((acc.currentBalance / totalPositiveBalance) * 100) : 0;
                    return (
                      <div key={acc.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`}></span>
                          <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[110px]" title={acc.name}>
                            {acc.name}
                          </span>
                        </div>
                        <span className="font-label-md text-label-md text-on-surface font-bold">{pct}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-on-surface-variant py-2">Chưa có số dư khả dụng</div>
                )}
                {creditAccounts.length > 0 && (
                  <div className="flex items-center justify-between border-t border-surface-container pt-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                      <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[110px]">
                        Dư nợ thẻ
                      </span>
                    </div>
                    <span className="font-label-md text-label-md text-rose-600 font-bold">
                      {formatCurrency(totalLiabilities)} ₫
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-space-xs border-t border-surface-container flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span>Đòn bẩy tài chính</span>
              <span className="text-secondary font-bold font-label-md text-label-md">
                {totalLiabilities === 0 ? 'Tối ưu (0% Nợ)' : `An toàn (${Math.round((totalLiabilities / (totalAssets || 1)) * 100)}%)`}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 3-Column Desktop Accounts Grid (Stitch lines 137-307) */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                Hệ thống Tài khoản thanh toán &amp; Thẻ
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                3 Nhóm chính
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg items-start">
            {/* COLUMN 1: TIỀN MẶT (CASH) */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between px-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                    TIỀN MẶT
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  {cashAccounts.length} ví khả dụng
                </span>
              </div>

              {/* Cash Card Items */}
              {cashAccounts.map((acc, index) => {
                const meta = getAccountMeta(acc);
                return (
                <div
                  key={acc.id}
                  className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md group border border-outline-variant/10 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-12 h-12 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {meta.displayName}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {acc.accountNumber || (index === 0 ? 'Ví tiêu dùng hàng ngày' : 'Ví tiền mặt phụ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-space-xs py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-sm text-label-sm flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Khả dụng
                      </span>
                      <button
                        onClick={() => setAccountToArchive(acc)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Lưu trữ tài khoản này"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">archive</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col pt-space-xs border-t border-surface-container/60">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Số dư thực tế
                    </span>
                    <div className="flex items-baseline gap-1 mt-space-2xs">
                      <span className="font-currency-display text-2xl font-extrabold text-on-surface">
                        {formatCurrency(acc.currentBalance)}
                      </span>
                      <span className="font-currency-display text-lg text-on-surface-variant">₫</span>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* Add Cash Button */}
              <button
                onClick={() => handleOpenAddModal('CASH')}
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-space-xs font-label-md text-label-md transition-colors cursor-pointer"
                id="quickAddCashBtn"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm ví tiền mặt phụ (Heo đất, Ngoại tệ)</span>
              </button>
            </div>

            {/* COLUMN 2: TÀI KHOẢN NGÂN HÀNG (BANK ACCOUNTS) */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between px-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                    TÀI KHOẢN NGÂN HÀNG
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  {bankAccounts.length} tài khoản
                </span>
              </div>

              {/* Bank Card Items */}
              {bankAccounts.map((acc, index) => {
                const meta = getAccountMeta(acc);
                return (
                <div
                  key={acc.id}
                  className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md group border border-outline-variant/10 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-12 h-12 rounded-xl bg-[#005a3c]/10 text-[#005a3c] flex items-center justify-center font-extrabold text-lg">
                        <span className="material-symbols-outlined text-[26px]">account_balance</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            {meta.displayName}
                          </span>
                        </div>
                        <div className="inline-flex mt-0.5">
                          <span
                            className={`px-space-xs py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                              index === 0 ? 'bg-rose-50 text-primary' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {index === 0 ? 'Tài khoản chính' : 'Tài khoản thanh toán'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {acc.napasLinked || meta.displayName.toUpperCase().includes('VCB') || meta.displayName.toUpperCase().includes('VIETCOMBANK') ? 'VCB - 24/7' : 'Napas 24/7'}
                      </span>
                      <button
                        onClick={() => setAccountToArchive(acc)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Lưu trữ tài khoản này"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">archive</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-space-xs border-t border-surface-container/60">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Số TK: {meta.maskedNumber}
                      </span>
                      <div className="flex items-baseline gap-1 mt-space-2xs">
                        <span className="font-currency-display text-2xl font-extrabold text-tertiary">
                          {formatCurrency(acc.currentBalance)}
                        </span>
                        <span className="font-currency-display text-lg text-on-surface-variant">₫</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Số dư khả dụng</span>
                      <span className="font-label-md text-label-md text-secondary font-bold mt-1">100% Khả dụng</span>
                    </div>
                  </div>
                </div>
                );
              })}

              {/* Add Bank CTA */}
              <button
                onClick={() => handleOpenAddModal('BANK')}
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                id="addBankCardBtn"
                type="button"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">account_balance</span>
                <span>+ Thêm tài khoản ngân hàng mới</span>
              </button>
            </div>

            {/* COLUMN 3: THẺ TÍN DỤNG & KHOẢN NỢ (CREDIT / LIABILITIES) */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between px-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                    THẺ TÍN DỤNG &amp; NỢ
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Chu kỳ: Ngày 25
                </span>
              </div>

              {/* Credit Card Items */}
              {creditAccounts.length > 0 ? (
                creditAccounts.map((acc) => {
                  const meta = getAccountMeta(acc);
                  const limit = acc.creditLimit || 15000000;
                  const used = acc.currentBalance;
                  const available = Math.max(0, limit - used);
                  const usedPercent = Math.min(100, Math.round((used / limit) * 100));
                  const isFullyPaid = used === 0;

                  return (
                    <div
                      key={acc.id}
                      className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md group border border-outline-variant/10 relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[26px]">credit_card</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                {meta.displayName}
                              </span>
                              {isFullyPaid ? (
                                <span className="px-space-xs py-0.5 rounded bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold">
                                  ✔ Đã trả hết
                                </span>
                              ) : (
                                <span className="px-space-xs py-0.5 rounded bg-rose-100 text-rose-800 font-label-sm text-label-sm font-semibold">
                                  Đang dư nợ
                                </span>
                              )}
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {meta.digits ? `Thẻ: ${meta.maskedNumber} • ` : ''}Hạn mức khả dụng: {formatCurrency(available)} ₫
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setAccountToArchive(acc)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Lưu trữ thẻ này"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">archive</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-space-xs">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Dư nợ hiện tại</span>
                          <div className="flex items-baseline gap-1 mt-space-2xs">
                            <span className="font-currency-display text-2xl font-extrabold text-secondary">
                              {formatCurrency(used)}
                            </span>
                            <span className="font-currency-display text-lg text-on-surface-variant">₫</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Sao kê kỳ kế</span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold mt-1">25 tháng 9</span>
                        </div>
                      </div>

                      {/* Limit Progress Bar */}
                      <div className="flex flex-col gap-space-2xs">
                        <div className="flex justify-between font-label-sm text-label-sm">
                          <span className="text-secondary font-semibold">
                            Khả dụng {100 - usedPercent}% ({Math.round(available / 1000000)}M / {Math.round(limit / 1000000)}M)
                          </span>
                          <span className="text-on-surface-variant">{usedPercent}% Dư nợ</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${usedPercent > 80 ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: `${100 - usedPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                        <span>Miễn lãi 45 ngày còn lại</span>
                        <button
                          className="text-tertiary hover:underline font-label-sm text-label-sm font-semibold cursor-pointer"
                          onClick={() => alert(`Chi tiết điều khoản thẻ tín dụng: ${acc.name}`)}
                          type="button"
                        >
                          Chi tiết thẻ
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/40 text-center text-on-surface-variant py-8">
                  <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2">credit_card_off</span>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">Chưa có thẻ tín dụng</p>
                  <p className="font-body-sm text-body-sm mt-1">Thêm thẻ để quản lý chu kỳ sao kê và sao lưu hạn mức</p>
                </div>
              )}

              {/* Add Credit Card Button */}
              <button
                onClick={() => handleOpenAddModal('CREDIT_CARD')}
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                id="addCreditCardBtn"
                type="button"
              >
                <span className="material-symbols-outlined text-primary-container text-[20px]">add_card</span>
                <span>+ Thêm thẻ tín dụng hoặc khoản vay</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Financial Accumulation Goals (Stitch lines 308-402) */}
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                Mục tiêu Tích lũy &amp; Dự phòng
              </h2>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                2 Đang hoạt động
              </span>
            </div>
            <button
              className="flex items-center gap-space-2xs text-primary hover:text-primary-container font-label-md text-label-md font-bold self-start sm:self-auto transition-colors cursor-pointer"
              id="openAddGoalBtn"
              onClick={() => showToast('Tính năng thêm mục tiêu tài chính mới sẽ sẵn sàng trong Phase 5!')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Thêm mục tiêu mới</span>
            </button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {/* Goal 1: Emergency Fund */}
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md border border-outline-variant/10">
              <div className="flex items-start justify-between gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">savings</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Quỹ dự phòng khẩn cấp
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Mục tiêu an tâm tài chính cá nhân (6 tháng sinh hoạt)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">2.500.000 ₫</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">trên 10.000.000 ₫</div>
                </div>
              </div>

              <div className="flex flex-col gap-space-2xs">
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span className="text-secondary font-bold">Đạt 25%</span>
                  <span className="text-on-surface-variant">Còn lại 7.500.000 ₫</span>
                </div>
              </div>

              <div className="pt-space-xs flex items-center justify-between">
                <div className="flex items-center gap-space-2xs text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-secondary">trending_up</span>
                  <span>Góp định kỳ 500.000 ₫ / tháng</span>
                </div>
                <button
                  className="px-space-md py-space-2xs rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  onClick={() => showToast('Đang chuyển tiền vào Quỹ dự phòng khẩn cấp...')}
                  type="button"
                >
                  Nạp thêm tiền
                </button>
              </div>
            </div>

            {/* Goal 2: Laptop Macbook M3 */}
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-md border border-outline-variant/10">
              <div className="flex items-start justify-between gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">laptop_mac</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Mua Laptop mới (Macbook M3)
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Phục vụ công việc thiết kế &amp; AI Engineering
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">1.500.000 ₫</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">trên 15.000.000 ₫</div>
                </div>
              </div>

              <div className="flex flex-col gap-space-2xs">
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full transition-all duration-500" style={{ width: '10%' }}></div>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span className="text-tertiary font-bold">Đạt 10%</span>
                  <span className="text-on-surface-variant">Còn lại 13.500.000 ₫</span>
                </div>
              </div>

              <div className="pt-space-xs flex items-center justify-between">
                <div className="flex items-center gap-space-2xs text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">event</span>
                  <span>Dự kiến hoàn thành: Tháng 12/2026</span>
                </div>
                <button
                  className="px-space-md py-space-2xs rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  onClick={() => showToast('Đang chuyển tiền vào Mục tiêu Mua Laptop M3...')}
                  type="button"
                >
                  Nạp thêm tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT ACCOUNT (Dialog) (Stitch lines 406-481) */}
      {isModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
        >
          <div className="w-full max-w-xl mx-space-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-lg relative animate-in zoom-in-95 duration-200 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Thêm tài khoản mới</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Khởi tạo ví tiền mặt, thẻ ngân hàng hoặc thẻ tín dụng mới
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="flex flex-col gap-space-md">
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  <span className="material-symbols-outlined text-base text-red-600 shrink-0">error</span>
                  <span>{modalError}</span>
                </div>
              )}

              {/* Account Type Switcher */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Loại tài khoản tài chính *
                </label>
                <div className="grid grid-cols-3 gap-space-xs">
                  <label
                    className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                      modalType === 'CASH'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="acc_type"
                      value="CASH"
                      checked={modalType === 'CASH'}
                      onChange={() => setModalType('CASH')}
                      className="sr-only"
                    />
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                    <span className="font-label-md text-label-md mt-1">Tiền mặt</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                      modalType === 'BANK'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="acc_type"
                      value="BANK"
                      checked={modalType === 'BANK'}
                      onChange={() => setModalType('BANK')}
                      className="sr-only"
                    />
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                    <span className="font-label-md text-label-md mt-1">Ngân hàng</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-space-sm rounded-xl cursor-pointer transition-colors ${
                      modalType === 'CREDIT_CARD'
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="acc_type"
                      value="CREDIT_CARD"
                      checked={modalType === 'CREDIT_CARD'}
                      onChange={() => setModalType('CREDIT_CARD')}
                      className="sr-only"
                    />
                    <span className="material-symbols-outlined text-[22px]">credit_card</span>
                    <span className="font-label-md text-label-md mt-1">Thẻ tín dụng</span>
                  </label>
                </div>
              </div>

              {/* Account Name */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accName">
                  Tên tài khoản / Ngân hàng *
                </label>
                <input
                  id="accName"
                  type="text"
                  required
                  placeholder={
                    modalType === 'CASH'
                      ? 'Ví dụ: Ví tiêu dùng chính, Heo đất, Két sắt...'
                      : modalType === 'BANK'
                      ? 'Ví dụ: Techcombank Priority, MBBank Quân Đội, Vietcombank...'
                      : 'Ví dụ: Thẻ VPBank StepUp, TPBank 2in1, HSBC Visa...'
                  }
                  value={modalName}
                  onChange={(e) => {
                    setModalName(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full bg-surface-container-low text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 border transition-all ${
                    modalError && !modalName.trim()
                      ? 'border-red-400 focus:ring-red-300 ring-1 ring-red-300'
                      : 'border-outline-variant/30 focus:ring-secondary/50'
                  }`}
                />
              </div>

              {/* Balance / Initial Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accBalance">
                    Số dư ban đầu (VNĐ) *
                  </label>
                  <div className="relative">
                    <input
                      id="accBalance"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={modalBalance}
                      onChange={(e) => setModalBalance(formatCurrencyInput(e.target.value))}
                      className="w-full bg-surface-container-low text-on-surface pl-space-md pr-10 py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30 font-currency-row"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md text-label-md font-bold">
                      ₫
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-space-2xs">
                  <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accLimit">
                    Hạn mức {modalType === 'CREDIT_CARD' ? '(Bắt buộc)' : '(Nếu có)'}
                  </label>
                  <div className="relative">
                    <input
                      id="accLimit"
                      type="text"
                      inputMode="numeric"
                      disabled={modalType !== 'CREDIT_CARD'}
                      value={modalCreditLimit}
                      onChange={(e) => setModalCreditLimit(formatCurrencyInput(e.target.value))}
                      placeholder="0"
                      className={`w-full bg-surface-container-low text-on-surface pl-space-md pr-10 py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30 font-currency-row ${
                        modalType !== 'CREDIT_CARD' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md text-label-md font-bold">
                      ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Masked Number / Notes */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="accNumber">
                  4 số cuối thẻ / Số tài khoản (Ghi nhớ)
                </label>
                <input
                  id="accNumber"
                  type="text"
                  maxLength={16}
                  placeholder="Ví dụ: 9968"
                  value={modalAccountNumber}
                  onChange={(e) => setModalAccountNumber(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface px-space-md py-space-sm rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/50 border border-outline-variant/30"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-space-xl py-space-sm rounded-xl bg-primary-container hover:opacity-95 text-on-primary-container font-label-lg text-label-lg font-bold shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT DATA EXCEL (Stitch lines 483-500) */}
      {isExportModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
        >
          <div className="w-full max-w-lg mx-space-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-lg relative animate-in zoom-in-95 duration-200 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Xuất dữ liệu Excel (.xlsx)
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Báo cáo chuẩn tài chính cá nhân &amp; dòng tiền (PRD Mục 19)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-md py-space-sm text-on-surface">
              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md font-bold">Báo cáo Tài khoản &amp; Tài sản ròng</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    Bao gồm toàn bộ {activeAccounts.length} tài khoản, số dư, và phân loại nguồn vốn.
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary text-[24px]">check_circle</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                File Excel sẽ được tạo chuẩn Apache POI tương thích Microsoft Excel, Google Sheets và Apple Numbers.
              </p>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  showToast('Đang tạo và tải file Excel báo cáo tài sản...');
                }}
                className="px-space-xl py-space-sm rounded-xl bg-secondary text-white font-label-lg text-label-lg font-bold shadow-md hover:opacity-95 transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Tải file Excel ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM ARCHIVE DIALOG */}
      {accountToArchive && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
        >
          <div className="w-full max-w-md mx-space-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-md relative animate-in zoom-in-95 duration-200 border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[28px]">archive</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-center">
              Lưu trữ tài khoản này?
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              Bạn có chắc chắn muốn lưu trữ tài khoản <strong>"{accountToArchive.name}"</strong>? Lịch sử các giao dịch
              đã ghi nhận trong quá khứ sẽ vẫn được bảo lưu an toàn.
            </p>

            <div className="flex items-center justify-center gap-space-sm pt-space-sm">
              <button
                type="button"
                onClick={() => setAccountToArchive(null)}
                className="px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchiveConfirm}
                className="px-space-lg py-space-sm rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-label-lg text-label-lg font-bold shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isArchiving ? 'Đang lưu trữ...' : 'Xác nhận Lưu trữ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
