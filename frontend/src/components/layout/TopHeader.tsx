import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  onExportExcel?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedMonth?: string;
  onMonthPrev?: () => void;
  onMonthNext?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onExportExcel,
  searchQuery = '',
  onSearchChange,
  selectedMonth = 'Tháng 9, 2026',
  onMonthPrev,
  onMonthNext,
}) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-gutter-desktop">
      {/* Search & Month Bar */}
      <div className="flex items-center gap-space-md flex-1 max-w-xl">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant text-[20px] pointer-events-none">
            search
          </span>
          <input
            className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant pl-10 pr-4 py-space-xs rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
            placeholder="Tìm kiếm giao dịch, danh mục, số tiền..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-space-2xs gap-space-xs shrink-0 select-none">
          <button
            onClick={onMonthPrev}
            className="p-space-2xs rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
            title="Tháng trước"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <div className="flex items-center gap-space-2xs font-label-md text-label-md text-on-surface font-semibold px-space-xs">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              calendar_today
            </span>
            <span>{selectedMonth}</span>
          </div>
          <button
            onClick={onMonthNext}
            className="p-space-2xs rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
            title="Tháng sau"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Action Icons & Profile */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          {/* Excel Export Quick Button */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-space-2xs px-space-sm py-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
            title="Trích xuất Excel (.xlsx)"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              description
            </span>
            <span>Excel</span>
          </button>

          {/* Notifications */}
          <button
            className="relative p-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            title="Thông báo"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-on-primary font-label-sm text-label-sm text-[10px] leading-tight flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            className="p-space-xs rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            title="Chế độ giao diện"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">light_mode</span>
          </button>
        </div>

        {/* Profile Avatar Pill */}
        <div className="pl-space-xs">
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
          />
        </div>
      </div>
    </header>
  );
};
