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
    { route: 'thong-ke-va-bao-cao', label: 'Thống kê & Báo cáo', icon: 'monitoring' },
    { route: 'quan-ly-ngan-sach', label: 'Quản lý Ngân sách', icon: 'account_balance_wallet' },
    { route: 'tai-khoan-va-tai-san', label: 'Tài khoản & Tài sản', icon: 'account_balance' },
    { route: 'tro-ly-finman-ai', label: 'Trợ lý FinMan AI', icon: 'neurology' },
    { route: 'cai-dat-va-danh-muc', label: 'Cài đặt & Danh mục', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-20 px-space-lg flex items-center justify-between">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => onNavigate('giao-dich')}>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-outline-variant/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center text-white font-extrabold text-sm shadow-inner">
                FM
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-extrabold">
                FinMan
              </span>
              <span className="text-[10px] tracking-widest text-on-surface-variant/80 uppercase font-semibold">
                Fintech Prestige
              </span>
            </div>
          </div>
        </div>

        {/* Primary CTA Quick Action */}
        <div className="px-space-md py-space-sm">
          <button
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Thêm giao dịch</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="px-space-md pt-space-xs">
          <div className="px-space-sm pb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Menu chính
          </div>
          <nav className="flex flex-col gap-space-2xs">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => onNavigate(item.route)}
                  className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-all font-label-lg text-label-lg text-left w-full ${
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
      </div>

      {/* User Profile Mini Footer */}
      <div className="p-space-md bg-surface-container-low/70 mx-space-md mb-space-md rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <div className="relative">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></div>
          </div>
          <div className="flex flex-col max-w-[130px]">
            <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
              {user?.fullName || 'Nguyễn Minh Khang'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-[11px]">
              {user?.email || 'minhkhang.finance@gmail.com'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors"
          title="Đăng xuất"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </aside>
  );
};
