import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  onExportExcel?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedMonth?: string;
  selectedYearMonth?: string; // Format "YYYY-MM"
  onSelectYearMonth?: (yearMonth: string) => void;
  onMonthPrev?: () => void;
  onMonthNext?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onExportExcel,
  searchQuery = '',
  onSearchChange,
  selectedMonth,
  selectedYearMonth = '2026-09',
  onSelectYearMonth,
  onMonthPrev,
  onMonthNext,
}) => {
  const { user } = useAuth();
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse current year and month from selectedYearMonth
  const [currentYear, currentMonthNum] = selectedYearMonth
    ? selectedYearMonth.split('-').map(Number)
    : [2026, 9];

  const [pickerYear, setPickerYear] = useState<number>(currentYear);

  // Update pickerYear when selectedYearMonth changes
  useEffect(() => {
    setPickerYear(currentYear);
  }, [currentYear]);

  // Click outside to close month picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  const displayMonthLabel =
    selectedMonth || `Tháng ${currentMonthNum}, ${currentYear}`;

  const handleSelectMonth = (m: number) => {
    const formattedMonth = String(m).padStart(2, '0');
    const ym = `${pickerYear}-${formattedMonth}`;
    onSelectYearMonth?.(ym);
    setShowMonthPicker(false);
  };

  const handleJumpToCurrentMonth = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onSelectYearMonth?.(ym);
    setShowMonthPicker(false);
  };

  const MONTH_NAMES = [
    'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4',
    'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8',
    'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
  ];

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

        {/* Interactive Month Selector with Popover */}
        <div className="relative shrink-0" ref={popoverRef}>
          <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-space-2xs gap-space-xs select-none shadow-sm border border-outline-variant/15">
            <button
              onClick={onMonthPrev}
              className="p-space-2xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
              title="Tháng trước"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMonthPicker((prev) => !prev)}
              className="flex items-center gap-space-2xs font-label-md text-label-md text-on-surface font-semibold px-space-xs hover:bg-surface-container rounded-lg py-0.5 transition-colors cursor-pointer"
              title="Nhấn để chọn nhanh tháng"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                calendar_month
              </span>
              <span>{displayMonthLabel}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_drop_down
              </span>
            </button>

            <button
              onClick={onMonthNext}
              className="p-space-2xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
              title="Tháng sau"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Month & Year Dropdown Popover */}
          {showMonthPicker && (
            <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-scaleUp">
              {/* Year Navigation Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setPickerYear((y) => y - 1)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-bold text-sm text-slate-800">
                  Năm {pickerYear}
                </span>
                <button
                  type="button"
                  onClick={() => setPickerYear((y) => y + 1)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-3 gap-2 py-3">
                {MONTH_NAMES.map((name, idx) => {
                  const m = idx + 1;
                  const isSelected =
                    currentYear === pickerYear && currentMonthNum === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump to Current Month */}
              <div className="pt-2 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  onClick={handleJumpToCurrentMonth}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">today</span>
                  <span>Về tháng hiện tại</span>
                </button>
              </div>
            </div>
          )}
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
            src={
              user?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.fullName || 'User'
              )}&background=0D8ABC&color=fff`
            }
          />
        </div>
      </div>
    </header>
  );
};
