import React, { useState } from 'react';
import { mockStats } from '../../services/mockData';

export const StatisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCOME_EXPENSE' | 'CASHFLOW'>('OVERVIEW');
  const [activePeriod, setActivePeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');

  const expenseCategories = [
    { name: 'Ăn uống', amount: 550000, percent: 50.5, color: '#dc2626', icon: 'restaurant' },
    { name: 'Mua sắm', amount: 340000, percent: 31.2, color: '#7c3aed', icon: 'shopping_bag' },
    { name: 'Giao thông', amount: 200000, percent: 18.3, color: '#d97706', icon: 'directions_car' },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Sub-Navigation & Quick Action Filter Bar */}
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

        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center bg-surface-container-low p-space-2xs rounded-xl shadow-sm">
            <button
              onClick={() => setActivePeriod('WEEK')}
              className={`px-space-sm py-space-2xs rounded-lg font-label-sm text-label-sm transition-colors cursor-pointer ${
                activePeriod === 'WEEK'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setActivePeriod('MONTH')}
              className={`px-space-md py-space-2xs rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                activePeriod === 'MONTH'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tháng này (T09/2026)
            </button>
            <button
              onClick={() => setActivePeriod('YEAR')}
              className={`px-space-sm py-space-2xs rounded-lg font-label-sm text-label-sm transition-colors cursor-pointer ${
                activePeriod === 'YEAR'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Hàng năm
            </button>
          </div>

          <button
            onClick={() => alert('Đang xuất báo cáo thống kê Excel (.xlsx)...')}
            className="flex items-center gap-space-2xs px-space-md py-space-xs rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all border border-outline-variant/30 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">file_download</span>
            <span>Xuất Báo cáo Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Health Banner (AI Intelligence Banner) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-fixed/50 via-surface-container-low to-surface-container-lowest p-space-lg shadow-sm border border-secondary-container/40 mb-space-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex items-start gap-space-md">
            <div className="w-14 h-14 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[32px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs mb-space-2xs">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Tình trạng tài chính: Rất khả quan
                </span>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm">
                  81.8% thặng dư dòng tiền
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Tuyệt vời! Bạn đang kiểm soát chi tiêu ở mức{' '}
                <span className="font-label-md text-label-md text-secondary font-bold">18,2%</span>{' '}
                tổng thu nhập tháng 9. Dòng tiền dự kiến tăng trưởng ổn định theo mục tiêu tích lũy.
              </p>
            </div>
          </div>

          {/* 3 Primary Highlight Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md shrink-0">
            <div className="bg-surface-container-lowest/90 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm border border-outline-variant/20 flex flex-col min-w-[170px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                Dòng tiền thuần
                <span className="material-symbols-outlined text-[16px] text-secondary">north_east</span>
              </span>
              <span className="font-currency-display text-xl font-extrabold text-secondary tracking-tight mt-space-2xs">
                +{mockStats.surplus.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm border border-outline-variant/20 flex flex-col min-w-[170px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                Tỷ lệ tiết kiệm
                <span className="material-symbols-outlined text-[16px] text-tertiary">savings</span>
              </span>
              <span className="font-currency-display text-xl font-extrabold text-tertiary tracking-tight mt-space-2xs">
                {mockStats.savingsRate}%
              </span>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm border border-outline-variant/20 flex flex-col min-w-[170px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                Điểm số FinScore
                <span className="material-symbols-outlined text-[16px] text-amber-600">star</span>
              </span>
              <span className="font-currency-display text-xl font-extrabold text-amber-600 tracking-tight mt-space-2xs">
                92 / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analytics Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* Income vs Expense Analytical Stage (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              So sánh Tổng quan Thu nhập &amp; Chi tiêu
            </h3>
            <span className="text-xs text-on-surface-variant">Số liệu đối soát tháng 9</span>
          </div>

          <div className="space-y-6">
            {/* Income Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-md text-label-md font-semibold text-secondary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  Tổng Thu nhập
                </span>
                <span className="font-currency-display font-bold text-secondary text-lg">
                  +{mockStats.totalIncome.toLocaleString('vi-VN')} ₫ (100%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Expense Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-md text-label-md font-semibold text-primary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  Tổng Chi tiêu
                </span>
                <span className="font-currency-display font-bold text-primary text-lg">
                  -{mockStats.totalExpense.toLocaleString('vi-VN')} ₫ (18.2%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '18.2%' }}></div>
              </div>
            </div>

            {/* Surplus Net Cashflow */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-md text-label-md font-semibold text-tertiary flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                  Dòng tiền Thặng dư
                </span>
                <span className="font-currency-display font-bold text-tertiary text-lg">
                  +{mockStats.surplus.toLocaleString('vi-VN')} ₫ (81.8%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '81.8%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">info</span>
            <span>
              Tỷ lệ chi tiêu trên thu nhập của bạn hiện đạt 18.2%, nằm trong nhóm 5% người dùng kiểm soát tài chính xuất sắc nhất.
            </span>
          </div>
        </div>

        {/* Expenses by Category (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm border border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
            Cơ cấu Chi tiêu theo Danh mục
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Tỷ trọng các nhóm khoản chi trong tháng
          </p>

          <div className="space-y-4">
            {expenseCategories.map((c) => (
              <div key={c.name} className="p-3.5 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: c.color }}>
                      {c.icon}
                    </span>
                    <span className="text-xs font-bold text-on-surface">{c.name}</span>
                  </div>
                  <span className="font-currency-row text-xs font-bold text-on-surface">
                    {c.amount.toLocaleString('vi-VN')} ₫ ({c.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.percent}%`, backgroundColor: c.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>Tổng chi tiêu danh mục</span>
            <span className="font-bold text-primary">1.090.000 ₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};
