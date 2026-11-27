import React from 'react';
import type { MarketIndex } from '../../types/market';
import { formatTradingValueTyd, formatVolume } from '../../types/market';

interface IndexCardProps {
  index: MarketIndex;
  isSelected?: boolean;
  onSelect?: (index: MarketIndex) => void;
}

export const IndexCard: React.FC<IndexCardProps> = ({
  index,
  isSelected = false,
  onSelect,
}) => {
  const isPositive = index.changeValue > 0;
  const isNegative = index.changeValue < 0;

  // Sắc thái chuẩn sàn chứng khoán Việt Nam: Xanh lá (tăng) / Đỏ (giảm) / Vàng (tham chiếu)
  const colorClasses = isPositive
    ? {
        text: 'text-emerald-600 dark:text-emerald-400',
        bgPill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: 'trending_up',
        stroke: '#10b981',
        areaGradient: 'from-emerald-500/20 to-transparent',
        borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
      }
    : isNegative
    ? {
        text: 'text-rose-600 dark:text-rose-400',
        bgPill: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: 'trending_down',
        stroke: '#f43f5e',
        areaGradient: 'from-rose-500/20 to-transparent',
        borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
      }
    : {
        text: 'text-amber-600 dark:text-amber-400',
        bgPill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: 'trending_flat',
        stroke: '#f59e0b',
        areaGradient: 'from-amber-500/20 to-transparent',
        borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
      };

  // Sparkline mini SVG 6 điểm trực quan
  const sparkPoints = isPositive
    ? [20, 24, 18, 22, 12, 6]
    : isNegative
    ? [8, 12, 16, 14, 22, 26]
    : [16, 15, 17, 16, 15, 16];

  const maxVal = Math.max(...sparkPoints);
  const minVal = Math.min(...sparkPoints);
  const range = maxVal - minVal || 1;

  const pointsSvg = sparkPoints
    .map((val, idx) => {
      const x = (idx / (sparkPoints.length - 1)) * 70;
      const y = 28 - ((val - minVal) / range) * 22;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaSvg = `0,30 ${pointsSvg} 70,30`;

  return (
    <div
      onClick={() => onSelect?.(index)}
      role="button"
      tabIndex={0}
      data-testid={`index-card-${index.code}`}
      className={`p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border transition-all duration-200 cursor-pointer select-none relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
        isSelected
          ? `${colorClasses.borderActive} bg-surface-container-low/50 shadow-md`
          : 'border-outline-variant/30 hover:border-outline-variant/60'
      }`}
    >
      {/* 1. Header: Mã & Tên chỉ số, Trạng thái phiên */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg text-on-surface tracking-tight">
              {index.name}
            </span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-mono">
              {index.code}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 font-medium truncate block">
            Sở Giao Dịch Chứng Khoán
          </span>
        </div>

        {/* Trạng thái phiên giao dịch */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border shrink-0 ${
            index.sessionStatus === 'OPEN'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              index.sessionStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{index.sessionStatus === 'OPEN' ? 'Khớp lệnh' : 'Đóng cửa'}</span>
        </span>
      </div>

      {/* 2. Body: Điểm số lớn, Biến động & Sparkline */}
      <div className="flex items-end justify-between gap-3 my-2">
        <div>
          <div className="font-currency-row font-black text-2xl sm:text-3xl text-on-surface tracking-tight leading-none">
            {index.currentValue.toLocaleString('vi-VN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold font-mono border ${colorClasses.bgPill}`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {colorClasses.icon}
              </span>
              <span>
                {index.changeValue > 0 ? '+' : ''}
                {index.changeValue.toFixed(2)}
              </span>
              <span>({index.percentChange > 0 ? '+' : ''}{index.percentChange.toFixed(2)}%)</span>
            </span>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="w-18 h-10 shrink-0">
          <svg viewBox="0 0 70 30" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`grad-${index.code}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorClasses.stroke} stopOpacity="0.35" />
                <stop offset="100%" stopColor={colorClasses.stroke} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon points={areaSvg} fill={`url(#grad-${index.code})`} />
            <polyline
              fill="none"
              stroke={colorClasses.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsSvg}
            />
          </svg>
        </div>
      </div>

      {/* 3. Footer: Khối lượng và Giá trị thanh khoản */}
      <div className="pt-2 mt-1 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
        <span className="flex items-center gap-1">
          <span className="text-on-surface-variant/70">KL:</span>
          <span className="font-semibold text-on-surface">{formatVolume(index.tradingVolume)}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-on-surface-variant/70">GT:</span>
          <span className="font-semibold text-on-surface font-mono">{formatTradingValueTyd(index.tradingValue)}</span>
        </span>
      </div>
    </div>
  );
};

