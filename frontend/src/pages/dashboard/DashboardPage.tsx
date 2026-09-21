import React, { useState } from 'react';
import type { Transaction } from '../../types';
import { mockAccounts, mockStats } from '../../services/mockData';

interface DashboardPageProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
  onNavigateToAccounts: () => void;
  onNavigateToReports: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  transactions,
  onOpenAddModal,
  onNavigateToAccounts,
  onNavigateToReports,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [aiText, setAiText] = useState('Hôm nay tôi ăn trưa 50 nghìn ở Highland tiền mặt');
  const [aiParsed, setAiParsed] = useState<{
    amount: number;
    category: string;
    account: string;
    note: string;
  } | null>({
    amount: 50000,
    category: 'Ăn uống',
    account: 'Tiền mặt',
    note: 'Ăn trưa Highland',
  });

  const handleAiParse = () => {
    if (!aiText.trim()) return;
    // Simple natural language extractor simulation matching the mockup
    const lower = aiText.toLowerCase();
    let amount = 50000;
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

    let account = 'Tiền mặt';
    if (lower.includes('vcb') || lower.includes('vietcombank')) account = 'Vietcombank';
    else if (lower.includes('tech') || lower.includes('tcb')) account = 'Techcombank';
    else if (lower.includes('thẻ') || lower.includes('vpbank')) account = 'VPBank';

    setAiParsed({
      amount,
      category,
      account,
      note: aiText.replace(/hôm nay|tôi|ở|bằng/gi, '').trim(),
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.type === activeFilter;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Top Level KPI Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop mb-space-xl">
        {/* Card 1: Net Available Balance */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Tổng số dư khả dụng
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Ẩn/Hiện số dư"
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
                {showBalance ? mockStats.netWorth.toLocaleString('vi-VN') : '••••••••'}
              </span>
              <span className="font-title-md text-title-md text-on-surface-variant font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              3 tài khoản đã đồng bộ Napas
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
              Tổng Thu nhập T9
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-secondary">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                +{mockStats.totalIncome.toLocaleString('vi-VN')}
              </span>
              <span className="font-title-md text-title-md font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              +100% so với dự tính
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Lương và khoản thu cố định
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Tổng Chi tiêu T9
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/60 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-primary-container">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                -{mockStats.totalExpense.toLocaleString('vi-VN')}
              </span>
              <span className="font-title-md text-title-md font-bold">₫</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px] text-amber-500">warning</span>
              27.25% hạn mức ngân sách
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 text-xs text-on-surface-variant">
            Ăn uống, Mua sắm, Di chuyển
          </div>
        </div>

        {/* Card 4: Savings Rate */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Tỷ lệ tiết kiệm
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div className="mt-space-sm mb-space-md">
            <div className="flex items-baseline gap-space-2xs text-tertiary">
              <span className="font-currency-display text-currency-display font-extrabold tracking-tight">
                {mockStats.savingsRate}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              Thặng dư dòng tiền: +4.910.000₫
            </p>
          </div>
          <div className="pt-space-xs border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Đạt mức an toàn cao</span>
            <button
              onClick={onNavigateToReports}
              className="text-tertiary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Báo cáo <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Smart AI Natural Language Parsing Card (PRD 32.1) */}
      <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-highest/40 p-space-lg rounded-xl shadow-sm border border-outline-variant/20 mb-space-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Nhập thông minh AI
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Gõ câu tự nhiên bằng tiếng Việt để FinMan tự động trích xuất hạng mục tài chính
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">neurology</span>
            Gemini 2.0 Flash Engine
          </span>
        </div>

        {/* AI Input Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-space-xs shadow-md border border-outline-variant/30 flex items-center gap-space-sm focus-within:ring-2 focus-within:ring-tertiary/40 transition-all">
          <span className="material-symbols-outlined text-tertiary pl-space-sm text-[22px]">
            chat
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
            className="w-10 h-10 rounded-lg bg-tertiary hover:opacity-90 text-on-tertiary flex items-center justify-center transition-transform active:scale-95 shadow-sm cursor-pointer"
            title="Nhập liệu bằng giọng nói"
            type="button"
            onClick={() => alert('Đang kích hoạt Micro nhập giọng nói...')}
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

        {/* AI Parsed Result Preview */}
        {aiParsed && (
          <div className="mt-space-md bg-surface-container-lowest rounded-xl p-space-md border border-secondary-container/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md animate-in fade-in duration-300">
            <div className="flex flex-col gap-space-2xs">
              <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>AI đã bóc tách chính xác giao dịch</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs text-body-sm font-body-sm text-on-surface">
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Số tiền:</span>
                  <span className="font-currency-row text-currency-row text-primary-container font-bold">
                    -{aiParsed.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Danh mục:</span>
                  <span className="px-space-xs py-0.5 rounded bg-error-container text-on-surface font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">restaurant</span>
                    {aiParsed.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Tài khoản:</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-semibold text-on-surface">
                    {aiParsed.account}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-on-surface-variant">Ghi chú:</span>
                  <span className="font-medium text-on-surface">{aiParsed.note}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-secondary text-white font-label-md text-label-md font-semibold hover:brightness-105 active:scale-95 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              type="button"
            >
              + Thêm vào sổ cái
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Split Stage: Ledger (8 cols) & Contextual Rail (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* Left: Categorized Transaction Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-space-md">
          {/* Header & Filter Bar */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Sổ cái Giao dịch
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface-variant">
                {filteredTransactions.length} mục
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tất cả
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
            {filteredTransactions.map((tx) => {
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

                  {/* Amount Column strictly right-aligned */}
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
            })}
          </div>
        </div>

        {/* Right: Contextual Auxiliary Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-space-md">
          {/* Net Worth Card Mini */}
          <div className="rounded-xl bg-gradient-to-br from-[#1E293B] via-[#172134] to-[#0F172A] text-white p-space-lg shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Tài sản ròng (Net Worth)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                +12.4%
              </span>
            </div>
            <div className="flex items-baseline gap-1 text-white mb-2">
              <span className="font-currency-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                {mockStats.netWorth.toLocaleString('vi-VN')}
              </span>
              <span className="text-slate-400 font-semibold">₫</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Tổng hợp từ 4 tài khoản thanh toán và nguồn quỹ tích lũy
            </p>
            <button
              onClick={onNavigateToAccounts}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Quản lý Tài khoản</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Accounts Breakdown Mini Ledger */}
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
              {mockAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">
                        {acc.type === 'CASH'
                          ? 'payments'
                          : acc.type === 'BANK'
                          ? 'account_balance'
                          : 'credit_card'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface truncate max-w-[130px]">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {acc.accountNumber || 'Ví tiền mặt'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-currency-row text-xs font-bold text-on-surface block">
                      {acc.currentBalance.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className="text-[10px] text-secondary font-medium">
                      {acc.napasLinked ? 'Napas 247' : 'Khả dụng'}
                    </span>
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
