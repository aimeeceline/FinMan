import React from 'react';
import type { MarketPulseItem } from '../../types/intelligence';

interface MarketPulseCardProps {
  marketPulse: MarketPulseItem[];
  onViewMarketDetail?: () => void;
}

export const MarketPulseCard: React.FC<MarketPulseCardProps> = ({
  marketPulse,
  onViewMarketDetail,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">monitoring</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              Nhịp Đập Thị Trường (Market Pulse)
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Diễn biến điểm số các chỉ số chứng khoán trọng điểm
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Phiên sáng</span>
        </div>
      </div>

      {/* Indices Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {marketPulse.map((item) => {
          const isUp = item.isPositive || item.changeValue >= 0;
          return (
            <div
              key={item.code}
              className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between hover:border-outline-variant/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-on-surface">{item.name}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                  {item.code}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="font-currency-display font-extrabold text-base sm:text-lg text-on-surface tabular-nums">
                  {item.currentValue ? item.currentValue.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <div
                  className={`mt-1 text-xs font-bold flex items-center tabular-nums ${
                    isUp ? 'text-secondary' : 'text-error'
                  }`}
                >
                  <span className="mr-0.5 text-[10px]">{isUp ? '▲' : '▼'}</span>
                  <span>{isUp ? '+' : ''}{item.changeValue ? item.changeValue.toFixed(2) : '0.00'}</span>
                  <span className="ml-1 opacity-90">({isUp ? '+' : ''}{item.percentChange ? item.percentChange.toFixed(2) : '0.00'}%)</span>
                </div>
              </div>

              {item.tradingValue && item.tradingValue > 0 && (
                <div className="mt-2.5 pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[10px] text-on-surface-variant/80">
                  <span>GTGD:</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {(item.tradingValue / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} tỷ
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Link to Market Terminal */}
      {onViewMarketDetail && (
        <button
          type="button"
          onClick={onViewMarketDetail}
          className="w-full py-2.5 px-3 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
        >
          <span>Xem Bảng giá & Biểu đồ kỹ thuật chi tiết</span>
          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </button>
      )}
    </div>
  );
};
