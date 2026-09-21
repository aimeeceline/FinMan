import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockCategories } from '../../services/mockData';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter-desktop py-space-lg select-none">
      <div className="flex flex-col mb-space-lg">
        <div className="flex items-center gap-space-xs mb-space-2xs">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
            Tùy chỉnh hệ thống
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        </div>
        <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
          Cài đặt &amp; Danh mục
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
        {/* Left: User Profile (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 space-y-6">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Hồ sơ tài chính cá nhân
          </h3>

          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div>
              <h4 className="font-title-md text-title-md font-bold text-on-surface">
                {user?.fullName || 'Nguyễn Minh Khang'}
              </h4>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-bold">
                Tài khoản VIP Fintech
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => alert('Đang tạo file sao lưu Excel...')}
              className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  file_download
                </span>
                <span>Xuất toàn bộ lịch sử giao dịch (.xlsx)</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                chevron_right
              </span>
            </button>

            <button
              onClick={logout}
              className="w-full p-3 rounded-xl bg-error-container/40 hover:bg-error-container text-left flex items-center justify-between text-xs font-bold text-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Đăng xuất khỏi hệ thống</span>
              </div>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Right: Categories Management (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Danh mục thu chi mặc định
              </h3>
              <p className="text-xs text-on-surface-variant">
                Quản lý các hạng mục phân loại tài chính trong sổ cái
              </p>
            </div>
            <button
              onClick={() => alert('Thêm danh mục tùy biến mới...')}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
            >
              + Thêm danh mục
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockCategories.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: c.bgColor || '#fee2e2', color: c.color || '#dc2626' }}
                  >
                    <span className="material-symbols-outlined text-xl">{c.icon}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">{c.name}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        c.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                      }`}
                    >
                      {c.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-slate-300 text-lg">lock</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
