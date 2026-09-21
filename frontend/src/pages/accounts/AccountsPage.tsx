import React, { useState } from 'react';
import type { Account, AccountType } from '../../types';
import { DEFAULT_ACCOUNTS } from '../../constants/accounts';

interface AccountsPageProps {
  accounts?: Account[];
  onAddAccount?: (account: Account) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts: propAccounts,
  onAddAccount,
}) => {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const accounts = propAccounts || localAccounts;
  const setAccounts = (newAccs: Account[]) => setLocalAccounts(newAccs);

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');

  const totalAssets = accounts
    .filter((a) => a.type !== 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const netWorth = totalAssets - totalLiabilities;

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAcc: Account = {
      id: Date.now(),
      name,
      type,
      currentBalance: initialBalance,
      initialBalance,
      accountNumber: accountNumber ? `•••• ${accountNumber.slice(-4)}` : undefined,
      bankName: type === 'BANK' ? name : undefined,
      napasLinked: type === 'BANK',
    };

    if (onAddAccount) {
      onAddAccount(newAcc);
    } else {
      setAccounts([...accounts, newAcc]);
    }
    setName('');
    setInitialBalance(0);
    setAccountNumber('');
    setIsAddingAccount(false);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Top Command & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-space-2xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
              Cơ cấu tài sản
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Quản lý Tài khoản &amp; Tài sản ròng
          </h1>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={() => alert('Đang xuất file Excel dữ liệu tài khoản (.xlsx)...')}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-secondary text-[20px]">file_download</span>
            <span>Xuất Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => setIsAddingAccount(true)}
            className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary-container hover:opacity-95 text-on-primary-container font-label-lg text-label-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_card</span>
            <span>+ Thêm tài khoản / thẻ mới</span>
          </button>
        </div>
      </div>

      {/* Inline Create Account Form */}
      {isAddingAccount && (
        <div className="mb-8 p-6 rounded-2xl bg-surface-container-lowest border border-primary/30 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Liên kết tài khoản / thẻ thanh toán mới
            </h3>
            <button
              onClick={() => setIsAddingAccount(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Tên tài khoản / Ngân hàng
              </label>
              <input
                type="text"
                placeholder="VD: MBBank Quân Đội, Ví MoMo..."
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Phân loại
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40"
              >
                <option value="BANK">Tài khoản Ngân hàng</option>
                <option value="CASH">Ví tiền mặt</option>
                <option value="CREDIT_CARD">Thẻ tín dụng (Dư nợ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Số dư ban đầu (VNĐ)
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-semibold cursor-pointer hover:bg-primary-container"
              >
                Lưu tài khoản
              </button>
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Hero Row: VIP Gunmetal Net Worth Card & Snapshot Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch mb-space-xl">
        {/* VIP Dark Gunmetal Card: Net Worth (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#172134] to-[#0F172A] text-white p-space-xl shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none"></div>
          <div className="absolute right-12 bottom-8 w-44 h-44 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="font-label-md text-label-md uppercase tracking-wider text-slate-300 font-bold">
                  TÀI SẢN RÒNG HIỆN TẠI (NET WORTH)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                Chuẩn báo cáo T9/2026
              </span>
            </div>

            <div className="mt-space-lg flex flex-wrap items-baseline gap-x-space-md gap-y-space-2xs">
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-currency-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {netWorth.toLocaleString('vi-VN')}
                </span>
                <span className="font-currency-display text-2xl text-slate-400 font-medium">₫</span>
              </div>
              <div className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-emerald-500/15 text-emerald-400 font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>{accounts.length} tài khoản</span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-slate-400 mt-space-xs">
              Cập nhật đồng bộ qua Cổng Napas 24/7 và hệ thống sổ cái cá nhân.
            </p>
          </div>

          {/* Equation Breakdown Strip */}
          <div className="mt-space-xl pt-space-lg bg-slate-900/60 rounded-xl p-space-md backdrop-blur-md border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
                  ● Tổng tài sản có (Assets)
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-white mt-space-2xs">
                  {totalAssets.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
                  ● Dư nợ thẻ &amp; vay (Liabilities)
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-rose-400 mt-space-2xs">
                  -{totalLiabilities.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-slate-400">
                  ● Đòn bẩy tài chính
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-emerald-400 mt-space-2xs">
                  An toàn (18.2%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-space-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
              Phân bổ tài sản
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Tỷ trọng lưu động trên các kênh thanh toán
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">Ngân hàng &amp; Chuyển khoản</span>
                  <span className="text-secondary font-bold">
                    {Math.round((5090000 / totalAssets) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '84.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">Tiền mặt tại ví</span>
                  <span className="text-tertiary font-bold">
                    {Math.round((910000 / totalAssets) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: '15.2%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Khả năng thanh khoản</span>
            <span className="text-secondary font-bold">Tức thì (100%)</span>
          </div>
        </div>
      </div>

      {/* 3. Accounts List Cards */}
      <div className="space-y-space-md">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Danh sách Tài khoản &amp; Nguồn tiền
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter-desktop">
          {accounts.map((acc) => {
            const isCredit = acc.type === 'CREDIT_CARD';
            return (
              <div
                key={acc.id}
                className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-2xl">
                        {acc.type === 'CASH'
                          ? 'payments'
                          : acc.type === 'BANK'
                          ? 'account_balance'
                          : 'credit_card'}
                      </span>
                    </div>
                    {acc.napasLinked && (
                      <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Napas 247
                      </span>
                    )}
                  </div>

                  <h4 className="font-title-md text-title-md font-bold text-on-surface mb-1">
                    {acc.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {acc.accountNumber ? `Số tài khoản: ${acc.accountNumber}` : 'Ví vật lý cá nhân'}
                  </p>
                </div>

                <div className="pt-4 border-t border-surface-container-high/60 flex items-baseline justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {isCredit ? 'Dư nợ hiện tại:' : 'Số dư khả dụng:'}
                  </span>
                  <span
                    className={`font-currency-display text-xl font-extrabold tracking-tight ${
                      isCredit ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {acc.currentBalance.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
