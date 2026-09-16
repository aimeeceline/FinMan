function App() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter">
      <div className="max-w-[420px] w-full bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col items-center text-center space-y-space-md border border-surface-container-high/60">
        <div className="w-20 h-20 rounded-full shadow-md overflow-hidden ring-2 ring-primary/20 flex items-center justify-center">
          <img
            src="/logo-fm.png"
            alt="FinMan Official Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
            FinMan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Hệ Thống Quản Lý Tài Chính Cá Nhân
          </p>
        </div>

        <div className="w-full grid grid-cols-2 gap-space-sm pt-2">
          <div className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tone Màu Thu</span>
            <span className="font-headline-sm text-headline-sm text-secondary font-bold">+6.000.000₫</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tone Màu Chi</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">-1.090.000₫</span>
          </div>
        </div>

        <div className="w-full p-3 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-center justify-center gap-2 text-tertiary font-label-md">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Đã nhúng Design Tokens Stitch & Logo FM</span>
        </div>
      </div>
    </div>
  )
}

export default App
