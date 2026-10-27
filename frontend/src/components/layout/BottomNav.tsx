import React from 'react';
import type { NavRoute } from './Sidebar';

interface BottomNavProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenAddModal,
}) => {
  const leftItems: { route: NavRoute; label: string; icon: string }[] = [
    { route: 'giao-dich', label: 'Giao dịch', icon: 'receipt_long' },
    { route: 'thong-ke-va-bao-cao', label: 'Thống kê', icon: 'monitoring' },
  ];

  const rightItems: { route: NavRoute; label: string; icon: string }[] = [
    { route: 'quan-ly-ngan-sach', label: 'Ngân sách', icon: 'account_balance_wallet' },
    { route: 'tai-khoan-va-tai-san', label: 'Tài khoản', icon: 'account_balance' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Left 2 Items: Giao dịch & Thống kê */}
        {leftItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer group active:scale-90 ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-11 h-8 rounded-full transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20 scale-105'
                    : 'text-on-surface-variant group-hover:bg-surface-container/60'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[23px] transition-transform"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Center Quick Add Button */}
        <div className="flex flex-col items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-tr from-primary to-rose-500 text-white flex items-center justify-center shadow-lg shadow-primary/35 border-2 border-surface-container-lowest hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Thêm giao dịch mới"
            aria-label="Thêm giao dịch mới"
          >
            <span className="material-symbols-outlined text-[28px] font-bold">add</span>
          </button>
          <span className="text-[10px] font-semibold text-primary mt-1 tracking-tight">
            Thêm mới
          </span>
        </div>

        {/* Right 2 Items: Ngân sách & Tài khoản */}
        {rightItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer group active:scale-90 ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-11 h-8 rounded-full transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20 scale-105'
                    : 'text-on-surface-variant group-hover:bg-surface-container/60'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[23px] transition-transform"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
