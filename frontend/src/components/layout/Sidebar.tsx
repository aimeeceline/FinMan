import React from 'react';
import { useAuth } from '../../context/AuthContext';

export type NavRoute =
  | 'giao-dich'
  | 'thong-ke-va-bao-cao'
  | 'quan-ly-ngan-sach'
  | 'tai-khoan-va-tai-san'
  | 'tro-ly-finman-ai'
  | 'cai-dat-va-danh-muc';

interface SidebarProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  onOpenAddModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenAddModal,
}) => {
  const { user, logout } = useAuth();

  const navItems: { route: NavRoute; label: string; icon: string }[] = [
    { route: 'giao-dich', label: 'Giao dịch', icon: 'receipt_long' },
    { route: 'thong-ke-va-bao-cao', label: 'Thống kê - Báo cáo', icon: 'monitoring' },
    { route: 'quan-ly-ngan-sach', label: 'Ngân sách', icon: 'account_balance_wallet' },
    { route: 'tai-khoan-va-tai-san', label: 'Tài khoản', icon: 'account_balance' },
    { route: 'tro-ly-finman-ai', label: 'Trợ lý FinMan', icon: 'neurology' },
    { route: 'cai-dat-va-danh-muc', label: 'Cài đặt', icon: 'tune' },
  ];

  return (
    <aside
      style={{ top: 0, bottom: 0, height: '100%' }}
      className="fixed left-0 top-0 bottom-0 inset-y-0 w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col select-none overflow-hidden h-full min-h-full"
    >
      {/* 1. Brand Header (Fixed Top) */}
      <div className="h-18 lg:h-20 px-space-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('giao-dich')}>
          <div className="w-11 h-11 rounded-xl bg-surface-container/70 flex items-center justify-center overflow-hidden shadow-xs ring-1 ring-outline-variant/30 group-hover:scale-105 group-hover:shadow-sm transition-all duration-200">
            <img src="/logo.png" alt="FinMan Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center leading-none">
              <span className="text-[22px] tracking-tight text-on-surface font-extrabold group-hover:text-primary transition-colors duration-200">
                Fin<span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Man</span>
              </span>
            </div>
            
          </div>
        </div>
      </div>

      {/* 2. Primary CTA Quick Action (Fixed Top) */}
      <div className="px-space-md py-1.5 shrink-0">
        <button
          onClick={() => onOpenAddModal()}
          className="w-full flex items-center justify-center gap-space-xs py-2.5 px-space-md rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Thêm giao dịch</span>
        </button>
      </div>

      {/* 3. Navigation Menu (Scrollable if height is constrained) */}
      <div className="px-space-md pt-2 flex-1 overflow-y-auto custom-scroll min-h-0">
        <div className="px-space-sm pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
          Menu chính
        </div>
        <nav className="flex flex-col gap-1 pb-2">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`flex items-center gap-space-sm px-space-md py-2 rounded-xl transition-all font-label-lg text-label-lg text-left w-full cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-primary' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. User Profile Mini Footer (Always Fixed At Bottom, Never Cut Off) */}
      <div className="shrink-0 p-2.5 bg-surface-container-low/80 mx-space-md mb-space-md mt-auto rounded-xl flex items-center justify-between border border-outline-variant/20 shadow-xs">
        <div className="flex items-center gap-space-xs min-w-0">
          <div className="relative shrink-0">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0D8ABC&color=fff`}
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0D8ABC&color=fff`;
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></div>
          </div>
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
              {user?.fullName || 'Tài khoản FinMan'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
              {user?.email || ''}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors shrink-0 cursor-pointer"
          title="Đăng xuất"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </aside>
  );
};
