import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthModal } from './GoogleAuthModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, loginDemo, isLoading } = useAuth();
  const [email, setEmail] = useState('minhkhang.finance@gmail.com');
  const [password, setPassword] = useState('MatKhauBaoMat2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
              Bảo mật cấp ngân hàng, kiểm soát dòng tiền lucid và phân tích chi tiêu thông minh cùng FinMan AI.
            </p>

            {/* Floating Metric Showcase Cards */}
            <div className="w-full space-y-3.5">
              {/* Metric Card 1 */}
              <div className="w-full p-4 rounded-xl bg-surface-container-lowest shadow-md flex items-center justify-between border border-outline-variant/20 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Tăng trưởng tài sản thuần
                    </span>
                    <span className="font-title-md text-title-md font-bold text-on-surface">
                      Thặng dư tích lũy tháng
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-currency-row text-currency-row font-extrabold text-secondary flex items-center gap-0.5 justify-end">
                    +81.8%
                    <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant/80">
                    So với kỳ trước
                  </span>
                </div>
              </div>

              {/* Metric Card 2 */}
              <div className="w-full p-4 rounded-xl bg-surface-container-lowest shadow-md flex items-center justify-between border border-outline-variant/20 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-2xl">neurology</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Trợ lý FinMan AI
                    </span>
                    <span className="font-title-md text-title-md font-bold text-on-surface">
                      Tự động hóa thông minh
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-label-sm text-label-sm font-bold text-tertiary px-2.5 py-1 rounded-full bg-tertiary/10">
                    Gemini 2.0 Flash
                  </span>
                </div>
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
                Chào mừng trở lại
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Đăng nhập để tiếp tục tối ưu dòng tiền thông minh cùng FinMan
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google OAuth Provider Trigger */}
            <button
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full h-12 py-3 px-4 rounded-xl bg-surface hover:bg-surface-container transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-3 cursor-pointer group border border-outline-variant/30"
              type="button"
            >
              <svg className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                Tiếp tục với Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-surface-container-high"></div>
              <span className="absolute px-4 bg-surface-container-lowest font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant tracking-wider">
                HOẶC TIẾP TỤC VỚI EMAIL
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
                    placeholder="name@example.com"
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
                    placeholder="Nhập mật khẩu của bạn"
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

              {/* 1-Click Demo Testing Button */}
              <button
                type="button"
                onClick={loginDemo}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-500">auto_awesome</span>
                <span>Trải nghiệm nhanh với tài khoản Demo (1-Click)</span>
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

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
};
