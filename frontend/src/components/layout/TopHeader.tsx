import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenZoomControl } from './ScreenZoomControl';

interface TopHeaderProps {
  onExportExcel?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedMonth?: string;
  selectedYearMonth?: string;
  onSelectYearMonth?: (yearMonth: string) => void;
  onMonthPrev?: () => void;
  onMonthNext?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onExportExcel,
  searchQuery = '',
  onSearchChange,
}) => {

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-gutter-desktop">
      {/* Search Bar */}
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
      </div>

      {/* Action Icons & Profile */}
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          {/* Dynamic Screen Auto-Zoom Stepper */}
          <ScreenZoomControl />

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

        </div>

      </div>
    </header>
  );
};
