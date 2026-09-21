import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleGoogleError = useCallback((msg: string) => {
    setErrorMsg(msg);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordModal
        onNavigate={(screen) => {
          if (screen === 'login') setShowForgotPassword(false);
          if (screen === 'register') {
            setShowForgotPassword(false);
            onNavigateToRegister();
          }
        }}
        onSendResetLink={(emailSent) => {
          alert(`Đã gửi liên kết khôi phục mật khẩu đến: ${emailSent}`);
          setShowForgotPassword(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        {/* Left Hero Prestige Presentation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center relative py-6 pr-0 lg:pr-6">
          <div className="relative flex flex-col items-start z-10">
            {/* Coin Crest Emblem */}
            <div className="relative mb-6 self-start">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl transform scale-110"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-xl flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-300 font-extrabold text-3xl shadow-inner border border-amber-300/40">
                  FM
                </div>
              </div>
            </div>

            {/* Typography Statement */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              Fintech Prestige Web Platform
            </div>

            <h1 className="font-display-lg text-display-lg font-extrabold text-on-surface tracking-tight mb-4 leading-tight">
              Quản lý tài chính cá nhân thông minh
            </h1>

            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              Bảo mật cấp ngân hàng, kiểm soát dòng tiền minh bạch và phân tích chi tiêu thông minh cùng FinMan AI.
            </p>

            {/* Feature List */}
            <div className="w-full space-y-3 font-body-md text-body-md text-on-surface-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Theo dõi dòng tiền thu chi tức thời</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Kiểm soát ngân sách đa ngưỡng 80% - 100%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Trợ lý FinMan AI phân tích bằng Gemini</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stage: Login Form (7 cols) */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden border border-outline-variant/20">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary"></div>

            <div className="flex flex-col items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low shadow-sm flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-2xl font-bold">lock</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight mb-1">
                Đăng nhập hệ thống
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Nhập thông tin tài khoản FinMan của bạn để tiếp tục
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Official Google Identity Services Provider */}
            <GoogleSignInButton
              text="continue_with"
              onError={handleGoogleError}
            />

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-surface-container-high"></div>
              <span className="absolute px-4 bg-surface-container-lowest font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant tracking-wider">
                HOẶC ĐĂNG NHẬP VỚI EMAIL
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Địa chỉ Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md font-semibold text-on-surface">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="font-label-sm text-label-sm text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-12 py-3 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="remember" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                  Ghi nhớ phiên đăng nhập trên thiết bị này
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    <span>Đăng nhập ngay</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 text-center">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Chưa có tài khoản FinMan?{' '}
              </span>
              <button
                onClick={onNavigateToRegister}
                className="font-label-sm text-label-sm font-bold text-primary hover:underline cursor-pointer"
              >
                Đăng ký tài khoản mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
