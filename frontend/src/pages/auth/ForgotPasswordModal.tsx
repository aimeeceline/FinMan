import React, { useState, useEffect } from 'react'

interface ForgotPasswordModalProps {
  onNavigate?: (screen: 'splash' | 'login' | 'register' | 'forgot_password') => void
  onSendResetLink?: (email: string) => void
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onNavigate,
  onSendResetLink,
}) => {
  const [email, setEmail] = useState('minhkhang.finance@gmail.com')
  const [secondsRemaining, setSecondsRemaining] = useState(54)
  const [isSent, setIsSent] = useState(true)
  const [isPulse, setIsPulse] = useState(false)

  useEffect(() => {
    if (secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsRemaining])

  const handleSend = () => {
    setIsPulse(true)
    setIsSent(true)
    setTimeout(() => {
      setIsPulse(false)
      setSecondsRemaining(60)
    }, 400)
    if (onSendResetLink) {
      onSendResetLink(email)
    }
  }

  const handleRestartCountdown = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(60)
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen antialiased">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="Quay lại"
              className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high/60 active:scale-95 transition-all"
              onClick={() => onNavigate?.('login')}
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <img
              alt="FinMan Logo"
              className="w-8 h-8 rounded-full object-cover shrink-0"
              src="/logo-fm.png"
            />
            <span className="font-label-lg text-label-lg text-on-surface tracking-tight truncate">
              FinMan
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface px-gutter max-w-[480px] mx-auto min-h-screen">
        <div className="flex flex-col w-full pb-12">
          {/* Hero Illustration / Security Icon */}
          <div className="flex flex-col items-center justify-center pt-4 pb-6 text-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary-fixed shadow-sm mb-4">
              <span
                className="material-symbols-outlined text-primary text-[36px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                lock_reset
              </span>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
              </div>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">
              Quên mật khẩu?
            </h2>
          </div>

          {/* Recovery Form Section */}
          <div className="flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              {/* Input Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-lg text-label-lg text-on-surface flex items-center justify-between"
                  htmlFor="recovery-email"
                >
                  <span>Email đăng ký</span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">Bắt buộc</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    mail
                  </span>
                  <input
                    className="w-full h-12 pl-11 pr-10 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all"
                    id="recovery-email"
                    placeholder="tenban@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email && (
                    <button
                      aria-label="Xoá email"
                      className="absolute right-3 text-on-surface-variant/70 hover:text-on-surface flex items-center justify-center"
                      onClick={() => setEmail('')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                className="w-full h-12 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                id="btn-send-link"
                onClick={handleSend}
                type="button"
              >
                <span>Gửi liên kết đặt lại mật khẩu</span>
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>

            {/* Interactive / Live Confirmation Alert Card */}
            {isSent && (
              <div
                className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm overflow-hidden relative transition-all ${
                  isPulse ? 'animate-pulse' : ''
                }`}
                id="success-notification-card"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
                <div className="flex items-start gap-3 pl-1">
                  <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      mark_email_read
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-headline-sm text-headline-sm text-tertiary font-bold truncate">
                        Email đã gửi thành công! ✉️
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Vui lòng kiểm tra hộp thư đến của{' '}
                      <span className="font-semibold text-on-surface">{email || 'email của bạn'}</span>{' '}
                      để tạo mật khẩu mới. Nếu không thấy, hãy kiểm tra thư mục{' '}
                      <span className="font-medium text-on-surface">Spam (Thư rác)</span>.
                    </p>

                    {/* Resend timer action chip */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-container">
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Chưa nhận được mã?
                      </span>
                      <button
                        className={`font-label-md text-label-md px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                          secondsRemaining > 0
                            ? 'text-on-surface-variant/80 bg-surface-container cursor-not-allowed'
                            : 'text-primary bg-primary-fixed hover:bg-primary-fixed-dim'
                        }`}
                        id="resend-timer-btn"
                        disabled={secondsRemaining > 0}
                        onClick={handleRestartCountdown}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">replay</span>
                        <span id="countdown-text">
                          {secondsRemaining > 0
                            ? `Gửi lại sau ${secondsRemaining}s`
                            : 'Gửi lại mã ngay'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative Recovery Card (SMS OTP) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">sms</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Khôi phục qua SMS OTP
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Số điện thoại đã xác minh: •••• 8829
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </div>

            {/* Back to Login Link & Support */}
            <div className="flex flex-col items-center justify-center gap-4 mt-2">
              <button
                className="w-full py-3 rounded-xl text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-95"
                onClick={() => onNavigate?.('login')}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span>Quay lại đăng nhập</span>
              </button>
              <div className="flex items-center gap-1.5 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                  support_agent
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Cần trợ giúp thêm?{' '}
                  <a className="text-primary font-semibold hover:underline" href="#support">
                    Liên hệ hỗ trợ 24/7
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ForgotPasswordModal
