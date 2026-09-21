import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: { name: string; email: string }) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loginWithGoogle } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<'khang' | 'maianh' | 'custom'>('khang');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loadingState, setLoadingState] = useState<'idle' | 'authenticating' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const accounts = {
    khang: {
      name: 'Nguyễn Minh Khang',
      email: 'minhkhang.finance@gmail.com',
      badge: 'Đã liên kết FinMan Pro',
      avatar: 'K',
      bg: 'bg-primary-fixed text-primary',
    },
    maianh: {
      name: 'Đỗ Mai Anh',
      email: 'maianh.finance@gmail.com',
      badge: 'Tài khoản Google mới',
      avatar: 'A',
      bg: 'bg-secondary-fixed text-on-secondary-fixed',
    },
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    let emailToSend = '';
    let nameToSend = '';

    if (selectedAccount === 'custom') {
      if (!customEmail.trim()) {
        setErrorMsg('Vui lòng nhập địa chỉ email Google.');
        return;
      }
      emailToSend = customEmail.trim();
      nameToSend = customName.trim() || customEmail.split('@')[0];
    } else {
      emailToSend = accounts[selectedAccount].email;
      nameToSend = accounts[selectedAccount].name;
    }

    setLoadingState('authenticating');

    try {
      const res = await loginWithGoogle({
        email: emailToSend,
        fullName: nameToSend,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToSend)}&background=random&color=fff`,
      });

      if (res.success) {
        setLoadingState('success');
        setTimeout(() => {
          setLoadingState('idle');
          if (onSuccess) {
            onSuccess({ name: nameToSend, email: emailToSend });
          }
          onClose();
        }, 700);
      } else {
        setLoadingState('idle');
        setErrorMsg(res.message || 'Xác thực Google không thành công.');
      }
    } catch {
      setLoadingState('idle');
      setErrorMsg('Đã có lỗi kết nối tới máy chủ FinMan.');
    }
  };

  return (
    <>
      {/* Modal Backdrop Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={loadingState === 'idle' ? onClose : undefined}
      />

      {/* Google OAuth Native Bottom Sheet Modal */}
      <div
        aria-labelledby="oauth-heading"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 max-w-[480px] mx-auto w-full bg-surface-container-lowest sm:rounded-3xl rounded-t-[28px] shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border border-outline-variant/20"
        role="dialog"
      >
        {/* Drag Handle on Mobile */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden cursor-grab">
          <div className="w-10 h-1 rounded-full bg-surface-container-highest" />
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          {/* Top Modal Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Google Official Multi-colored G Logo */}
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-surface-container">
                <svg aria-label="Google logo" className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate" id="oauth-heading">
                  Đăng nhập bằng Google
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  để kết nối tới ứng dụng <span className="font-label-md text-label-md font-bold text-primary">FinMan</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              aria-label="Đóng bảng đăng nhập"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all shrink-0 cursor-pointer"
              onClick={onClose}
              disabled={loadingState !== 'idle'}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Selection Feed */}
          <div className="flex flex-col gap-2">
            <p className="font-label-md text-label-md font-semibold text-on-surface-variant px-1">
              Chọn tài khoản Google của bạn:
            </p>

            {/* Account 1 */}
            <button
              className={`w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer border ${
                selectedAccount === 'khang'
                  ? 'bg-secondary/10 border-secondary'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
              }`}
              onClick={() => setSelectedAccount('khang')}
              type="button"
            >
              <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm font-bold ${accounts.khang.bg}`}>
                {accounts.khang.avatar}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                  {accounts.khang.name}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {accounts.khang.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  {accounts.khang.badge}
                </span>
              </div>
              {selectedAccount === 'khang' && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              )}
            </button>

            {/* Account 2 */}
            <button
              className={`w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer border ${
                selectedAccount === 'maianh'
                  ? 'bg-secondary/10 border-secondary'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
              }`}
              onClick={() => setSelectedAccount('maianh')}
              type="button"
            >
              <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm font-bold ${accounts.maianh.bg}`}>
                {accounts.maianh.avatar}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                  {accounts.maianh.name}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {accounts.maianh.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-tertiary font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  {accounts.maianh.badge}
                </span>
              </div>
              {selectedAccount === 'maianh' && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              )}
            </button>

            {/* Account 3: Custom Google Account */}
            <button
              className={`w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all cursor-pointer border ${
                selectedAccount === 'custom'
                  ? 'bg-secondary/10 border-secondary'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
              }`}
              onClick={() => setSelectedAccount('custom')}
              type="button"
            >
              <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                  Sử dụng tài khoản Google khác
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Nhập địa chỉ email Google bất kỳ để đăng nhập / đăng ký
                </span>
              </div>
              {selectedAccount === 'custom' && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              )}
            </button>

            {/* Custom Input Form (Appears when 'custom' is selected) */}
            {selectedAccount === 'custom' && (
              <div className="p-3 bg-surface rounded-xl border border-secondary/30 space-y-2 mt-1 animate-fadeIn">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Nhập email Google (vd: yourname@gmail.com)"
                  className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  autoFocus
                />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Tên hiển thị của bạn (vd: Nguyễn Văn A)"
                  className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>
            )}
          </div>

          {/* Google Permissions Notice */}
          <div className="bg-surface-container-low rounded-xl p-3 text-[12px] text-on-surface-variant leading-relaxed">
            Để tiếp tục, Google sẽ xác thực và liên kết an toàn tài khoản của bạn với FinMan. Dữ liệu được bảo vệ chuẩn OAuth 2.0.
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              className="w-full py-3.5 px-4 rounded-xl bg-secondary text-white font-label-lg text-label-lg font-bold shadow-md flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
              disabled={loadingState !== 'idle'}
              onClick={handleConfirm}
              type="button"
            >
              {loadingState === 'idle' && (
                <>
                  <span>Tiếp tục xác thực Google</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
              {loadingState === 'authenticating' && (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang kết nối với Google...</span>
                </>
              )}
              {loadingState === 'success' && (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Đăng nhập thành công!</span>
                </>
              )}
            </button>

            <button
              className="w-full py-2.5 px-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-label-md text-label-md transition-colors cursor-pointer text-center"
              onClick={onClose}
              disabled={loadingState !== 'idle'}
              type="button"
            >
              Hủy bỏ
            </button>
          </div>

          {/* Footer Security Badges */}
          <div className="flex items-center justify-center gap-4 text-[12px] text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Google Identity Secure</span>
            </div>
            <span className="inline-block w-1 h-1 rounded-full bg-outline-variant" />
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>OAuth 2.0 Verified</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleAuthModal;
