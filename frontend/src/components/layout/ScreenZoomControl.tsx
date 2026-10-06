import React, { useState, useRef, useEffect } from 'react';
import { useScreenZoom } from '../../context/ScreenZoomContext';

export const ScreenZoomControl: React.FC = () => {
  const {
    zoomScale,
    zoomMode,
    screenDimensions,
    setZoomMode,
    setZoomScale,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    formattedPercent,
  } = useScreenZoom();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const presets = [
    { label: '85% (Laptop)', value: 0.85 },
    { label: '92% (Gọn gàng)', value: 0.92 },
    { label: '100% (Chuẩn)', value: 1.0 },
    { label: '110% (Màn lớn)', value: 1.1 },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button on Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'bg-secondary/15 text-secondary border border-secondary/30 ring-2 ring-secondary/20'
            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
        }`}
        title="Tự động thu phóng theo kích thước màn hình"
      >
        <span className="material-symbols-outlined text-[17px] text-secondary">
          fit_screen
        </span>
        <span className="font-bold text-on-surface">
          {zoomMode === 'auto' ? `Auto ${formattedPercent}` : formattedPercent}
        </span>
        {zoomMode === 'auto' && (
          <span
            className="w-2 h-2 rounded-full bg-secondary animate-pulse"
            title="Đang bật chế độ tự động căn chỉnh màn hình"
          />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-xl border border-outline-variant/30 z-50 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-surface-container-high/70">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                aspect_ratio
              </span>
              <span className="font-title-md text-title-md font-bold text-on-surface">
                Thu phóng giao diện
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono">
              {screenDimensions.width}px
            </span>
          </div>

          {/* Auto Mode Switch */}
          <div className="mt-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                Tự động theo màn hình
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  auto_awesome
                </span>
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                Tối ưu cho thiết lập 2 màn hình
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (zoomMode === 'auto') {
                  setZoomMode('manual');
                } else {
                  resetZoom();
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                zoomMode === 'auto' ? 'bg-secondary' : 'bg-surface-container-highest'
              }`}
              role="switch"
              aria-checked={zoomMode === 'auto'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  zoomMode === 'auto' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Stepper Controls */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={decreaseZoom}
              className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
              disabled={zoomScale <= 0.65}
              title="Thu nhỏ 5%"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>

            <div className="flex-1 text-center py-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="font-extrabold text-base tracking-tight font-currency-display text-secondary">
                {formattedPercent}
              </span>
            </div>

            <button
              type="button"
              onClick={increaseZoom}
              className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-base transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
              disabled={zoomScale >= 1.4}
              title="Phóng to 5%"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {presets.map((preset) => {
              const isSelected = Math.abs(zoomScale - preset.value) < 0.02;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setZoomScale(preset.value)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-secondary text-white font-bold shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reset link */}
          {zoomMode !== 'auto' && (
            <div className="mt-2.5 pt-2 border-t border-surface-container-high/60 text-center">
              <button
                type="button"
                onClick={resetZoom}
                className="text-xs text-secondary hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Bật lại tự động theo màn hình</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
