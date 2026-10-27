import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenZoomControl } from './ScreenZoomControl';
import type { NavRoute } from './Sidebar';

interface TopHeaderProps {
  onExportExcel?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  currentRoute?: NavRoute;
  onNavigate?: (route: NavRoute) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onExportExcel,
  searchQuery = '',
  onSearchChange,
  currentRoute,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const userAvatar =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0D8ABC&color=fff`;

  return (
    <>
      <header className="fixed top-0 left-0 md:left-72 right-0 h-16 md:h-20 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-3.5 sm:px-4 md:px-gutter-desktop select-none">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          {/* Mobile Logo & Brand */}
          <div
            className="flex md:hidden items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => onNavigate?.('giao-dich')}
          >
            <div className="w-8 h-8 rounded-xl bg-surface-container/70 flex items-center justify-center overflow-hidden ring-1 ring-outline-variant/30 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="FinMan Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="text-[19px] tracking-tight text-on-surface font-extrabold">
              Fin<span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Man</span>
            </span>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center w-full relative">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant pl-10 pr-4 py-space-xs rounded-xl font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all border border-transparent focus:border-outline-variant/30"
              placeholder="Tìm kiếm giao dịch, danh mục, số tiền..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Right Section: Mobile Search Toggle, ScreenZoom, Excel, Cài đặt & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
              isMobileSearchOpen
                ? 'bg-secondary/15 text-secondary'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            title="Tìm kiếm"
          >
            <span className="material-symbols-outlined text-[19px]">search</span>
          </button>

          {/* Screen Zoom Control */}
          {/* Screen Zoom Control (Chỉ hiển thị trên máy tính/laptop để không chiếm chỗ header mobile) */}
          <div className="hidden md:block">
            <ScreenZoomControl />
          </div>

          {/* Excel Export Quick Button (Ẩn trên mobile) */}
          <button
            onClick={onExportExcel}
            className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors cursor-pointer"
            title="Trích xuất Excel (.xlsx)"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">
              description
            </span>
            <span>Excel</span>
          </button>

          {/* Nút Cài đặt (Theo yêu cầu: Header để phần cài đặt) */}
          <button
            onClick={() => onNavigate?.('cai-dat-va-danh-muc')}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              currentRoute === 'cai-dat-va-danh-muc'
                ? 'bg-primary/10 text-primary ring-1 ring-primary/25 shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            title="Cài đặt & Danh mục"
            type="button"
            aria-label="Cài đặt"
          >
            <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
              tune
            </span>
          </button>

          {/* Thông tin User & Dropdown (Theo yêu cầu: Header để thông tin user) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 sm:p-1.5 pl-1.5 sm:pl-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all cursor-pointer select-none ring-1 ring-outline-variant/30"
              title="Thông tin tài khoản"
              aria-label="Thông tin người dùng"
            >
              <div className="relative shrink-0">
                <img
                  alt="Avatar"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
                  src={userAvatar}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0D8ABC&color=fff`;
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-on-surface truncate max-w-[110px]">
                {user?.fullName || 'Tài khoản'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_drop_down
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] p-3 bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-xl border border-outline-variant/30 z-50 animate-fadeIn">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/20">
                  <img
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-outline-variant/40"
                    src={userAvatar}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                      {user?.fullName || 'Tài khoản FinMan'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {user?.email || ''}
                    </span>
                  </div>
                </div>

                <div className="py-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate?.('cai-dat-va-danh-muc');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      settings
                    </span>
                    <span>Cài đặt tài khoản & danh mục</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/30 transition-colors cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Expandable Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-30 p-2.5 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/20 shadow-md animate-fadeIn">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Tìm kiếm giao dịch, danh mục, số tiền..."
              className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-2.5 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
