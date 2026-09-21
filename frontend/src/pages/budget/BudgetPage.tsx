import React, { useState } from 'react';
import { mockBudgets, mockCategories } from '../../services/mockData';
import type { Budget } from '../../types';

export const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<number>(mockCategories[4].id);
  const [newAmount, setNewAmount] = useState<number>(1000000);

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalRemaining = Math.max(0, totalAllocated - totalSpent);
  const spentPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const safePercent = Math.max(0, 100 - spentPercent);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const category = mockCategories.find((c) => c.id === newCategoryId);
    if (!category || newAmount <= 0) return;

    const existingIndex = budgets.findIndex((b) => b.category.id === category.id);
    if (existingIndex >= 0) {
      const updated = [...budgets];
      updated[existingIndex].allocatedAmount = newAmount;
      setBudgets(updated);
    } else {
      const newB: Budget = {
        id: Date.now(),
        category,
        allocatedAmount: newAmount,
        spentAmount: 0,
        month: '2026-09',
      };
      setBudgets([...budgets, newB]);
    }
    setIsAddingBudget(false);
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
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
              Quản lý Ngân sách chi tiêu
            </h2>
            <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-xl bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
              <span className="font-label-lg text-label-lg font-semibold">Tháng 9, 2026</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddingBudget(true)}
          className="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Thiết lập ngân sách mới</span>
        </button>
      </div>

      {/* New Budget Inline Modal/Drawer */}
      {isAddingBudget && (
        <div className="mb-6 p-6 rounded-2xl bg-surface-container-lowest border border-primary/30 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Thiết lập hạn mức ngân sách mới
            </h3>
            <button
              onClick={() => setIsAddingBudget(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form onSubmit={handleCreateBudget} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Danh mục chi tiêu
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(Number(e.target.value))}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40"
              >
                {mockCategories
                  .filter((c) => c.type === 'EXPENSE')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Hạn mức ngân sách (VNĐ)
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm border border-outline-variant/40"
                min={50000}
                step={50000}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white font-label-md text-label-md font-semibold cursor-pointer hover:bg-primary-container"
              >
                Lưu hạn mức
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBudget(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Primary Budget Health Dashboard & VIP Metric Stack */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
        {/* Main Aggregate Spend Gauge (8 cols) */}
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

          <div className="pt-space-sm border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Còn 13 ngày nữa trong chu kỳ tháng 9</span>
            <span className="text-secondary font-semibold">Tốc độ tiêu dùng trung bình an toàn</span>
          </div>
        </div>

        {/* Speed & Projections (4 cols) */}
        <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
              Định mức chi tiêu hàng ngày
            </span>
            <div className="mt-2 flex items-baseline gap-1 text-on-surface">
              <span className="font-currency-display text-2xl font-extrabold">
                {Math.round(totalRemaining / 13).toLocaleString('vi-VN')}
              </span>
              <span className="font-bold text-on-surface-variant">đ / ngày</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              Bạn có thể chi tiêu tối đa mức này mỗi ngày để đảm bảo hoàn thành mục tiêu tiết kiệm tháng 9.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-secondary/10 text-secondary flex items-center gap-2.5 mt-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div className="text-xs font-semibold">
              Không có danh mục nào vượt ngưỡng báo động 100%.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Budgets Grid */}
      <div className="space-y-space-md">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Chi tiết Hạn mức theo Danh mục
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-desktop">
          {budgets.map((b) => {
            const pct = b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
            const isDanger = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            let badgeColor = 'bg-secondary/15 text-secondary';
            let barColor = 'bg-secondary';
            if (isDanger) {
              badgeColor = 'bg-primary/15 text-primary font-bold';
              barColor = 'bg-primary';
            } else if (isWarning) {
              badgeColor = 'bg-amber-500/15 text-amber-600 font-bold';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: b.category.bgColor || '#fee2e2',
                        color: b.category.color || '#dc2626',
                      }}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {b.category.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-title-md text-title-md font-bold text-on-surface">
                        {b.category.name}
                      </h4>
                      <span className="text-xs text-on-surface-variant">
                        Đã chi: {b.spentAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs ${badgeColor}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                  <span>Hạn mức: {b.allocatedAmount.toLocaleString('vi-VN')} ₫</span>
                  <span>
                    Còn lại: {(b.allocatedAmount - b.spentAmount).toLocaleString('vi-VN')} ₫
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
