import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    const res = await register(email, fullName, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10">
        {/* Left Hero */}
        <div className="lg:col-span-5 flex flex-col justify-center relative py-6 pr-0 lg:pr-6">
          <div className="relative flex flex-col items-start z-10">
            <div className="relative mb-6 self-start">
              <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl transform scale-110"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-600 shadow-xl flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-emerald-300 font-extrabold text-3xl shadow-inner border border-emerald-300/40">
                  FM
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Khởi đầu thịnh vượng
            </div>

            <h1 className="font-display-lg text-display-lg font-extrabold text-on-surface tracking-tight mb-4 leading-tight">
              Tạo tài khoản quản lý tài chính
            </h1>

            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Bắt đầu hành trình minh bạch dòng tiền, thiết lập hạn mức ngân sách và gia tăng tài sản ròng bền vững.
            </p>

            <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Tự động tính toán số dư và dòng tiền thuần thực tế</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Cảnh báo ngân sách thông minh đa ngưỡng 80% - 100%</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                <span>Trợ lý FinMan AI phân loại giao dịch bằng tiếng Việt</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Stage: Register Form */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden border border-outline-variant/20">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-container to-primary"></div>

            <div className="flex flex-col items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low shadow-sm flex items-center justify-center mb-4 text-secondary">
                <span className="material-symbols-outlined text-2xl font-bold">person_add</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight mb-1">
                Đăng ký tài khoản
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Chỉ mất 30 giây để thiết lập tài khoản FinMan cá nhân của bạn
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Official Google Identity Services Provider */}
            <div className="mb-6">
              <GoogleSignInButton
                text="signup_with"
                onError={(msg) => setErrorMsg(msg)}
              />
            </div>

            {/* Divider */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="w-full h-px bg-surface-container-high"></div>
              <span className="absolute px-4 bg-surface-container-lowest font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant tracking-wider">
                HOẶC ĐĂNG KÝ VỚI EMAIL
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Họ và tên
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col space-y-1">
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
                    placeholder="tenban@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-12 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
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

              {/* Confirm Password */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Xác nhận mật khẩu
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                    verified_user
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/40 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="terms" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                  Tôi đồng ý với <a href="#terms" className="text-secondary font-semibold hover:underline">Điều khoản dịch vụ</a> và <a href="#privacy" className="text-secondary font-semibold hover:underline">Chính sách bảo mật</a>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="w-full py-3 px-4 rounded-xl bg-secondary text-white font-label-lg text-label-lg font-bold shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    <span>Tạo tài khoản ngay</span>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Đã có tài khoản FinMan?{' '}
              </span>
              <button
                onClick={onNavigateToLogin}
                className="font-label-sm text-label-sm font-bold text-secondary hover:underline cursor-pointer"
              >
                Đăng nhập tại đây
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
