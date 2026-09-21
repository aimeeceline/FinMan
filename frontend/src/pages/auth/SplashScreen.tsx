import React, { useEffect } from 'react'

interface SplashScreenProps {
  onFinish?: () => void
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    if (!onFinish) return
    const timer = setTimeout(() => {
      onFinish()
    }, 2800)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div
      onClick={onFinish}
      className="min-h-screen bg-surface font-body-md text-body-md text-on-surface flex flex-col antialiased selection:bg-primary/20 cursor-pointer"
    >
      <main className="flex flex-col relative w-full pt-safe pb-safe bg-surface px-gutter max-w-[480px] mx-auto min-h-screen justify-center overflow-hidden">
        <div className="flex flex-col w-full relative overflow-hidden py-space-xl">
          {/* Ambient Glows */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-b from-amber-200/20 via-primary/5 to-transparent blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />

          {/* Center Brand Identity */}
          <div className="flex flex-col items-center justify-center my-auto py-space-xl text-center relative z-10">
            <div className="relative group cursor-pointer mb-2">
              <div className="absolute -inset-3 bg-gradient-to-tr from-amber-300/40 via-amber-200/30 to-amber-500/30 rounded-full blur-xl transition duration-700 group-hover:scale-105 opacity-80" />
              <div className="relative w-40 h-40 rounded-full p-[3px] bg-gradient-to-b from-amber-300 via-amber-400/50 to-amber-600 shadow-2xl shadow-amber-900/15 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner">
                  <img
                    src="/logo-fm.png"
                    alt="FinMan Luxury Gold Emblem"
                    className="w-full h-full object-cover rounded-full transform transition duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 bg-clip-text text-transparent drop-shadow-sm font-headline-lg">
                FinMan
              </h1>
              <p className="text-body-md font-semibold mt-1.5 max-w-[280px] leading-relaxed text-on-surface-variant tracking-normal">
                Quản lý tài chính thông minh
              </p>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest border border-amber-500/30 shadow-md backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-label-sm text-[11px] font-bold tracking-wider text-amber-800 uppercase">
                Hệ thống sẵn sàng
              </span>
            </div>
          </div>

          {/* Loading Indicator & Footer */}
          <div className="flex flex-col items-center gap-space-md mt-auto pt-space-lg relative z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 relative flex items-center justify-center">
                <svg
                  className="animate-spin w-5 h-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-90"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="font-label-sm text-xs text-on-surface-variant font-medium tracking-wide">
                Đang đồng bộ dữ liệu an toàn...
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span className="font-label-sm">Phiên bản 2.4.0</span>
              <span className="opacity-40">•</span>
              <span className="font-label-sm">Made by Aimeeceline</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SplashScreen
