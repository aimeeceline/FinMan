import React, { useState } from 'react'

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (account: { name: string; email: string }) => void
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<'khang' | 'work'>('khang')
  const [loadingState, setLoadingState] = useState<'idle' | 'authenticating' | 'success'>('idle')

  if (!isOpen) return null

  const accounts = {
    khang: {
      name: 'Nguyễn Minh Khang',
      email: 'minhkhang.finance@gmail.com',
      badge: 'Đã liên kết FinMan Pro',
    },
    work: {
      name: 'Minh Khang (Công việc)',
      email: 'khang.work@company.vn',
      badge: 'Tài khoản mới',
    },
  }

  const handleConfirm = () => {
    setLoadingState('authenticating')
    setTimeout(() => {
      setLoadingState('success')
      setTimeout(() => {
        setLoadingState('idle')
        if (onSuccess) {
          onSuccess(accounts[selectedAccount])
        }
        onClose()
      }, 900)
    }, 1200)
  }

  return (
    <>
      {/* Modal Backdrop Overlay */}
      <div
        className="fixed inset-0 z-40 bg-on-background/55 backdrop-blur-sm transition-opacity duration-300"
        onClick={loadingState === 'idle' ? onClose : undefined}
      />

      {/* Google OAuth Native Bottom Sheet Modal */}
      <div
        aria-labelledby="oauth-heading"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 max-w-[480px] mx-auto w-full bg-surface-container-lowest rounded-t-[28px] shadow-2xl transition-transform duration-300 transform translate-y-0 flex flex-col pb-safe"
        role="dialog"
      >
        {/* Drag Handle / Grab Bar */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-surface-container-highest" />
        </div>

        <div className="p-space-md flex flex-col gap-space-md max-h-[85vh] overflow-y-auto">
          {/* Top Modal Header */}
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-center gap-3 min-w-0">
              {/* Google Official Multi-colored G Logo */}
              <div className="w-9 h-9 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center shrink-0 border border-surface-container">
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
                <h1 className="font-headline-sm text-headline-sm text-on-surface truncate" id="oauth-heading">
                  Đăng nhập bằng Google
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  để tiếp tục đến ứng dụng <span className="font-label-md text-label-md text-primary">FinMan</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              aria-label="Đóng bảng đăng nhập"
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 transition-all shrink-0"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Account Selection Feed */}
          <div className="flex flex-col gap-space-xs">
            <p className="font-label-md text-label-md text-on-surface-variant px-1">
              Chọn một tài khoản
            </p>

            {/* Account 1: Active Default Selected */}
            <button
              className={`account-item group w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all active:scale-[0.99] relative border ${
                selectedAccount === 'khang'
                  ? 'bg-surface-container-low border-secondary/30'
                  : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-low'
              }`}
              onClick={() => setSelectedAccount('khang')}
              type="button"
            >
              {/* Avatar with User Photo */}
              <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-primary-fixed flex items-center justify-center shadow-sm">
                <div className="w-full h-full bg-primary-fixed text-primary font-bold flex items-center justify-center">
                  K
                </div>
              </div>

              {/* Account Details */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                    Nguyễn Minh Khang
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  minhkhang.finance@gmail.com
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Đã liên kết FinMan Pro
                  </span>
                </div>
              </div>

              {/* Radio Indicator */}
              {selectedAccount === 'khang' ? (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-container-high shrink-0" />
              )}
            </button>

            {/* Account 2: Secondary / Work Account */}
            <button
              className={`account-item group w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all active:scale-[0.99] border ${
                selectedAccount === 'work'
                  ? 'bg-surface-container-low border-secondary/30'
                  : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-low'
              }`}
              onClick={() => setSelectedAccount('work')}
              type="button"
            >
              {/* Avatar Badge M */}
              <div className="w-11 h-11 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-headline-sm flex items-center justify-center shrink-0 shadow-sm font-bold">
                M
              </div>

              {/* Account Details */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg text-on-surface truncate">
                  Minh Khang (Công việc)
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  khang.work@company.vn
                </span>
                <div className="mt-1">
                  <span className="inline-flex items-center bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                    Tài khoản mới
                  </span>
                </div>
              </div>

              {/* Radio Indicator */}
              {selectedAccount === 'work' ? (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-container-high shrink-0" />
              )}
            </button>

            {/* Option 3: Add Another Account */}
            <button
              className="w-full text-left bg-surface-container-lowest hover:bg-surface-container-low rounded-2xl p-3 flex items-center gap-3 transition-all active:scale-[0.99]"
              type="button"
            >
              <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-lg text-label-lg text-on-surface truncate">
                  Sử dụng một tài khoản khác
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Thêm tài khoản Google của bạn
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
                chevron_right
              </span>
            </button>
          </div>

          {/* Google Permissions Privacy Text */}
          <div className="bg-surface-container-low rounded-xl p-3">
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của bạn với{' '}
              <span className="font-label-sm text-label-sm text-on-surface">FinMan</span>. Vui lòng tham khảo{' '}
              <a className="text-secondary font-label-sm text-label-sm underline active:text-secondary-container" href="#privacy">
                Chính sách quyền riêng tư
              </a>{' '}
              và{' '}
              <a className="text-secondary font-label-sm text-label-sm underline active:text-secondary-container" href="#terms">
                Điều khoản dịch vụ
              </a>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              className="w-full py-3.5 px-4 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary font-label-lg text-label-lg shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-80"
              id="confirm-login-btn"
              disabled={loadingState !== 'idle'}
              onClick={handleConfirm}
              type="button"
            >
              {loadingState === 'idle' && (
                <>
                  <span className="truncate">
                    Tiếp tục với vai trò {accounts[selectedAccount].name}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
              {loadingState === 'authenticating' && (
                <>
                  <div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực Google...</span>
                </>
              )}
              {loadingState === 'success' && (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Thành công! Đang vào ứng dụng...</span>
                </>
              )}
            </button>

            <button
              className="w-full py-2.5 px-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-label-md text-label-md transition-colors text-center"
              id="cancel-btn"
              onClick={onClose}
              type="button"
            >
              Hủy bỏ
            </button>
          </div>

          {/* Trust Badges Footer */}
          <div className="flex items-center justify-center gap-4 pt-1 text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="font-label-sm text-label-sm">Bảo mật bởi Google Identity</span>
            </div>
            <span className="inline-block w-1 h-1 rounded-full bg-surface-container-highest" />
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span className="font-label-sm text-label-sm">OAuth 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GoogleAuthModal
