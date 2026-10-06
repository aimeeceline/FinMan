import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordModalProps {
  onNavigate?: (screen: 'splash' | 'login' | 'register' | 'forgot_password') => void;
  onSendResetLink?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onNavigate,
  onSendResetLink,
}) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSent, setIsSent] = useState(false);
  const [isPulse, setIsPulse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [smsNotice, setSmsNotice] = useState(false);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMsg('Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com)');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await forgotPassword(trimmed);
      if (res.success) {
        setIsPulse(true);
        setIsSent(true);
        setSecondsRemaining(60);
        setTimeout(() => setIsPulse(false), 500);
        if (onSendResetLink) {
          onSendResetLink(trimmed);
        }
      } else {
        setErrorMsg(res.message || 'Không thể gửi email đặt lại mật khẩu');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartCountdown = () => {
    if (secondsRemaining === 0) {
      handleSend();
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen antialiased select-none">
      
      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-20 pb-safe bg-surface px-4 sm:px-6 max-w-[500px] mx-auto min-h-screen justify-center">
        <div className="flex flex-col w-full pb-12">
          {/* Hero Illustration / Security Icon */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-container/20 border border-primary/20 shadow-sm mb-4">
              <span
                className="material-symbols-outlined text-primary text-[38px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                lock_reset
              </span>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
              </div>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-extrabold tracking-tight">
              Khôi phục mật khẩu
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant max-w-sm">
              Nhập email đã đăng ký của bạn. FinMan sẽ gửi liên kết bảo mật để bạn thiết lập lại mật khẩu mới.
            </p>
          </div>

          {/* Recovery Form Section */}
          <div className="flex flex-col gap-space-md">
            <form onSubmit={handleSend} className="bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-outline-variant/20 flex flex-col gap-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between"
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
                    className="w-full h-12 pl-11 pr-10 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    id="recovery-email"
                    placeholder="tenban@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email && (
                    <button
                      aria-label="Xoá email"
                      className="absolute right-3 text-on-surface-variant/70 hover:text-on-surface flex items-center justify-center cursor-pointer"
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
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                id="btn-send-link"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Đang gửi liên kết...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi liên kết đặt lại mật khẩu</span>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </>
                )}
              </button>
            </form>

            {/* Interactive / Live Confirmation Alert Card */}
            {isSent && (
              <div
                className={`bg-surface-container-lowest rounded-2xl p-5 shadow-md border border-emerald-500/30 overflow-hidden relative transition-all animate-fadeIn ${
                  isPulse ? 'scale-[1.02]' : ''
                }`}
                id="success-notification-card"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                <div className="flex items-start gap-3 pl-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      mark_email_read
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-headline-sm text-headline-sm text-emerald-800 font-bold truncate">
                        Email đã gửi thành công! ✉️
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Vui lòng kiểm tra hộp thư đến của{' '}
                      <span className="font-bold text-on-surface">{email}</span>{' '}
                      để tạo mật khẩu mới. Nếu không thấy, hãy kiểm tra thêm thư mục{' '}
                      <span className="font-semibold text-on-surface">Spam (Thư rác)</span>.
                    </p>

                    {/* Resend timer action chip */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-container/80 flex-wrap gap-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        Chưa nhận được thư?
                      </span>
                      <button
                        className={`font-label-md text-label-md px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                          secondsRemaining > 0
                            ? 'text-on-surface-variant bg-surface-container cursor-not-allowed font-medium'
                            : 'text-primary bg-primary-container/30 hover:bg-primary-container font-bold cursor-pointer'
                        }`}
                        id="resend-timer-btn"
                        disabled={secondsRemaining > 0 || isLoading}
                        onClick={handleRestartCountdown}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">replay</span>
                        <span id="countdown-text">
                          {secondsRemaining > 0
                            ? `Gửi lại sau ${secondsRemaining}s`
                            : 'Gửi lại ngay'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative Recovery Card (SMS OTP) */}
            <div
              onClick={() => {
                setSmsNotice(true);
                setTimeout(() => setSmsNotice(false), 5000);
              }}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between border border-outline-variant/15"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">sms</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">
                    Khôi phục qua SMS OTP
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Xác minh số điện thoại liên kết bảo mật
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </div>

            {smsNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
                <span className="material-symbols-outlined text-amber-600 text-base">info</span>
                <span>Phương thức SMS OTP hiện được định tuyến an toàn qua Email chính của bạn để phòng chống SIM swap.</span>
              </div>
            )}

            {/* Back to Login Link & Support */}
            <div className="flex flex-col items-center justify-center gap-3 mt-2">
              <button
                className="w-full py-3 rounded-xl text-on-surface font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30"
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
                  <button
                    type="button"
                    onClick={() => alert('Đội ngũ hỗ trợ FinMan 24/7 sẵn sàng trợ giúp bạn qua email: support@finman.vn')}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Liên hệ hỗ trợ 24/7
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordModal;
