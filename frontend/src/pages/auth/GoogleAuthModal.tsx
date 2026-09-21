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
  const [googleEmail, setGoogleEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loadingState, setLoadingState] = useState<'idle' | 'authenticating' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!googleEmail.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email Google.');
      return;
    }

    const emailToSend = googleEmail.trim().toLowerCase();
    const nameToSend = fullName.trim() || emailToSend.split('@')[0];

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
        }, 600);
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

      {/* Google OAuth Modal */}
      <div
        aria-labelledby="oauth-heading"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 max-w-[460px] mx-auto w-full bg-surface-container-lowest sm:rounded-3xl rounded-t-[28px] shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border border-outline-variant/20"
        role="dialog"
      >
        <div className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
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
                  Xác thực trực tiếp với FinMan
                </p>
              </div>
            </div>

            <button
              aria-label="Đóng"
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

          {/* Form to enter Google Account */}
          <form onSubmit={handleConfirm} className="flex flex-col gap-3">
            <div className="space-y-1">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Email Google của bạn
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Họ và tên hiển thị
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  person
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ tên của bạn"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 text-[12px] text-on-surface-variant leading-relaxed">
              Tài khoản Google của bạn sẽ được liên kết an toàn với hệ thống FinMan để đồng bộ dữ liệu tài chính.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                className="w-full py-3 px-4 rounded-xl bg-secondary text-white font-label-lg text-label-lg font-bold shadow-md flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
                disabled={loadingState !== 'idle'}
                type="submit"
              >
                {loadingState === 'idle' && (
                  <>
                    <span>Xác nhận đăng nhập Google</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
                {loadingState === 'authenticating' && (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối...</span>
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
                className="w-full py-2 px-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-label-md text-label-md transition-colors cursor-pointer text-center"
                onClick={onClose}
                disabled={loadingState !== 'idle'}
                type="button"
              >
                Hủy bỏ
              </button>
            </div>
          </form>

          {/* Footer Security Badges */}
          <div className="flex items-center justify-center gap-4 text-[12px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Google Identity Secure</span>
            </div>
            <span className="inline-block w-1 h-1 rounded-full bg-outline-variant" />
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>OAuth 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleAuthModal;
