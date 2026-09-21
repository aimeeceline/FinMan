import React, { useState } from 'react';
import type { Account, Transaction } from '../../types';

interface DashboardPageProps {
  transactions: Transaction[];
  accounts?: Account[];
  onOpenAddModal: () => void;
  onNavigateToAccounts: () => void;
  onNavigateToReports: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  accounts,
  onOpenAddModal,
  onNavigateToAccounts,
  onNavigateToReports,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [aiText, setAiText] = useState('');
  const [aiParsed, setAiParsed] = useState<{
    amount: number;
    category: string;
    account: string;
    note: string;
  } | null>(null);

  // Dynamic calculations from actual user transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netWorth = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const displayAccounts = accounts && accounts.length > 0 ? accounts : [
    {
      id: 1,
      name: 'Tiền mặt',
      type: 'CASH' as const,
      currentBalance: netWorth,
      initialBalance: 0,
      accountNumber: 'Ví mặc định',
    },
  ];

  const handleAiParse = () => {
    if (!aiText.trim()) return;
    const lower = aiText.toLowerCase();
    let amount = 0;
    const matchNumber = aiText.match(/(\d+)\s*(k|nghìn|triệu)?/i);
    if (matchNumber) {
      const num = parseInt(matchNumber[1], 10);
      const unit = (matchNumber[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'nghìn') amount = num * 1000;
      else if (unit === 'triệu') amount = num * 1000000;
      else amount = num;
    }

    let category = 'Ăn uống';
    if (lower.includes('xăng') || lower.includes('grab') || lower.includes('xe')) category = 'Giao thông';
    else if (lower.includes('sách') || lower.includes('quần') || lower.includes('áo') || lower.includes('mua')) category = 'Mua sắm';
    else if (lower.includes('lương') || lower.includes('thưởng')) category = 'Tiền lương';

    setAiParsed({
      amount,
      category,
      account: 'Tiền mặt',
      note: aiText.trim(),
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.type === activeFilter;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Header Command Bar & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
            Tổng quan Tài chính
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Minh bạch dòng tiền & cập nhật số dư thời gian thực
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-space-xs bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg px-space-lg py-space-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Thêm giao dịch</span>
        </button>
      </div>

      {/* 2. Key Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
        {/* Card 1: Net Worth */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Tổng Số dư Khả dụng
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
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
                {showBalance ? netWorth.toLocaleString('vi-VN') : '••••••••'}
              </span>
              <span className="font-title-md text-title-md text-on-surface-variant font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
              {displayAccounts.length} tài khoản đang hoạt động
            </p>
          </div>

          <div className="pt-space-xs border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tài sản ròng hiện tại</span>
            <button
              onClick={onNavigateToAccounts}
              className="text-tertiary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Chi tiết <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Tổng Thu nhập
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
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              Khoản thu ghi nhận
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Lương và các khoản thu nhập
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Tổng Chi tiêu
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
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px] text-amber-500">info</span>
              Tổng các khoản chi phí
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Ăn uống, sinh hoạt, mua sắm
          </div>
        </div>

        {/* Card 4: Savings Rate */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
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
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              Thặng dư: {netWorth >= 0 ? '+' : ''}{netWorth.toLocaleString('vi-VN')}₫
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Báo cáo dòng tiền</span>
            <button
              onClick={onNavigateToReports}
              className="text-tertiary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Báo cáo <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Column: Transaction Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-space-md">
          {/* Sub-header Filter Tabs */}
          <div className="flex items-center justify-between">
            <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
              Sổ Nhật ký Giao dịch
            </h3>
            <div className="flex items-center gap-space-2xs bg-surface-container-low p-1 rounded-xl">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tất cả ({transactions.length})
              </button>
              <button
                onClick={() => setActiveFilter('EXPENSE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'EXPENSE'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Khoản Chi
              </button>
              <button
                onClick={() => setActiveFilter('INCOME')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'INCOME'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Khoản Thu
              </button>
            </div>
          </div>

          {/* Transaction Ledger Rows */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 divide-y divide-surface-container-high/60 overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mb-1">
                  Chưa có giao dịch nào
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-4">
                  Bắt đầu ghi nhận các khoản thu chi bằng cách nhấn nút "Thêm giao dịch".
                </p>
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                >
                  + Thêm giao dịch đầu tiên
                </button>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-container-low/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: tx.category.bgColor || '#fee2e2',
                          color: tx.category.color || '#dc2626',
                        }}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {tx.category.icon}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-bold text-on-surface">
                          {tx.note || tx.category.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                          <span className="font-medium text-slate-700">{tx.category.name}</span>
                          <span>•</span>
                          <span>{tx.account.name}</span>
                          <span>•</span>
                          <span>{tx.date} {tx.time || ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount Column */}
                    <div className="text-right">
                      <span
                        className={`font-currency-row text-currency-row font-extrabold text-base sm:text-lg block tracking-tight ${
                          isExpense ? 'text-primary-container' : 'text-secondary'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {tx.amount.toLocaleString('vi-VN')} ₫
                      </span>
                      <span
                        className={`font-label-sm text-label-sm font-semibold uppercase ${
                          isExpense ? 'text-primary/80' : 'text-secondary/80'
                        }`}
                      >
                        {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: AI Assistant & Accounts (4 cols) */}
        <div className="lg:col-span-4 space-y-space-md">
          {/* Card: AI Quick Transaction Input */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-space-lg rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">auto_awesome</span>
              <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-amber-400">
                FinMan AI Trợ Lý
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Nhập câu văn tự nhiên, AI sẽ tự động phân loại danh mục, tài khoản và số tiền:
            </p>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={2}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Ví dụ: Ăn tối 120k tiền mặt hoặc Đổ xăng 50k..."
                  className="w-full bg-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none border border-white/10"
                />
              </div>

              <button
                onClick={handleAiParse}
                disabled={!aiText.trim()}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-label-md text-label-md font-bold shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>Phân tích thông minh</span>
              </button>
            </div>

            {aiParsed && (
              <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/15 space-y-1.5 text-xs animate-fadeIn">
                <div className="flex justify-between text-slate-300">
                  <span>Số tiền nhận diện:</span>
                  <span className="font-bold text-amber-300">{aiParsed.amount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Danh mục:</span>
                  <span className="font-semibold text-white">{aiParsed.category}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tài khoản:</span>
                  <span className="font-semibold text-white">{aiParsed.account}</span>
                </div>
                <button
                  onClick={() => {
                    onOpenAddModal();
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Điền vào phiếu giao dịch</span>
                </button>
              </div>
            )}
          </div>

          {/* Accounts Breakdown */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
                Tài khoản của bạn
              </h4>
              <button
                onClick={onNavigateToAccounts}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-3">
              {displayAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">
                        payments
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface truncate max-w-[130px]">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {acc.accountNumber}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-on-surface">
                      {acc.currentBalance.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-[10px] text-secondary font-semibold">
                      Hoạt động
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
