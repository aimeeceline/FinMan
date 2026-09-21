import React, { useState } from 'react';
import type { Transaction } from '../../types';

interface StatisticsPageProps {
  transactions?: Transaction[];
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ transactions = [] }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCOME_EXPENSE' | 'CASHFLOW'>('OVERVIEW');

  // Dynamic calculations from actual transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const surplus = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0;
  const expenseRate = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  // Group expenses by category
  const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');
  const categoryMap = new Map<string, { amount: number; icon: string; color: string }>();

  expenseTransactions.forEach((t) => {
    const prev = categoryMap.get(t.category.name) || {
      amount: 0,
      icon: t.category.icon || 'category',
      color: t.category.color || '#3b82f6',
    };
    categoryMap.set(t.category.name, {
      ...prev,
      amount: prev.amount + t.amount,
    });
  });

  const expenseCategories = Array.from(categoryMap.entries()).map(([name, val]) => ({
    name,
    amount: val.amount,
    percent: totalExpense > 0 ? Math.round((val.amount / totalExpense) * 1000) / 10 : 0,
    color: val.color,
    icon: val.icon,
  }));

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Sub-Navigation */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-wrap items-center gap-space-xs bg-surface-container-low p-space-2xs rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Thống kê tổng hợp
          </button>
          <button
            onClick={() => setActiveTab('INCOME_EXPENSE')}
            className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'INCOME_EXPENSE'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Phân tích Thu - Chi
          </button>
          <button
            onClick={() => setActiveTab('CASHFLOW')}
            className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'CASHFLOW'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Dòng tiền theo thời gian
          </button>
        </div>
      </div>

      {/* 2. Hero Health Card */}
      <div className="p-space-lg rounded-2xl bg-gradient-to-r from-emerald-50 via-surface-container-lowest to-surface-container-low border border-emerald-200/60 shadow-sm mb-space-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary shadow-sm">
            <span className="material-symbols-outlined text-3xl">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-title-lg text-title-lg font-bold text-on-surface">
                {transactions.length === 0
                  ? 'Chưa có giao dịch ghi nhận'
                  : surplus >= 0
                  ? 'Tình trạng tài chính: Khả quan'
                  : 'Cần chú ý kiểm soát chi tiêu'}
              </h2>
              {transactions.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-bold">
                  {savingsRate}% tích lũy
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {transactions.length === 0
                ? 'Bắt đầu ghi chép các khoản thu/chi để xem báo cáo thống kê chuyên sâu.'
                : `Tổng thu: ${totalIncome.toLocaleString('vi-VN')} ₫ | Tổng chi: ${totalExpense.toLocaleString('vi-VN')} ₫`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/30">
          <div className="text-right">
            <div className="text-xs text-on-surface-variant font-medium">Dòng tiền thuần</div>
            <div className={`font-currency-display text-currency-display font-extrabold ${surplus >= 0 ? 'text-secondary' : 'text-primary-container'}`}>
              {surplus >= 0 ? '+' : ''}{surplus.toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant font-medium">Tỷ lệ tiết kiệm</div>
            <div className="font-currency-display text-currency-display font-extrabold text-tertiary">
              {savingsRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comparison & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: Summary Bar */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/20">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface mb-6">
            So sánh Tổng quan Thu nhập & Chi tiêu
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span>Tổng Thu nhập</span>
                </span>
                <span className="text-secondary font-bold font-currency-row">
                  +{totalIncome.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all"
                  style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span>Tổng Chi tiêu</span>
                </span>
                <span className="text-primary-container font-bold font-currency-row">
                  -{totalExpense.toLocaleString('vi-VN')} ₫ ({expenseRate}%)
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, expenseRate)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                  <span>Dòng tiền Thặng dư</span>
                </span>
                <span className="text-tertiary font-bold font-currency-row">
                  {surplus >= 0 ? '+' : ''}{surplus.toLocaleString('vi-VN')} ₫ ({savingsRate}%)
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Categories */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/20">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface mb-4">
            Cơ cấu Chi tiêu theo Danh mục
          </h3>

          {expenseCategories.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              Chưa có khoản chi tiêu nào được ghi nhận.
            </div>
          ) : (
            <div className="space-y-4">
              {expenseCategories.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{c.name}</div>
                      <div className="text-xs text-on-surface-variant">{c.percent}% tổng chi</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-on-surface">
                    {c.amount.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
