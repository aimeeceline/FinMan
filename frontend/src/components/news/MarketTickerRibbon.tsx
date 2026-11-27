import React from 'react';
import type { MarketTickerItem } from '../../types/news';
import { DEFAULT_MARKET_TICKERS } from '../../types/news';

interface MarketTickerRibbonProps {
  tickers?: MarketTickerItem[];
  onTickerClick?: (symbol: string) => void;
}

export const MarketTickerRibbon: React.FC<MarketTickerRibbonProps> = ({
  tickers = DEFAULT_MARKET_TICKERS,
  onTickerClick,
}) => {
  // Nhân đôi mảng ticker để tạo hiệu ứng marquee lặp vô tận mượt mà
  const marqueeItems = [...tickers, ...tickers];

  return (
    <div
      data-testid="market-ticker-ribbon"
      className="relative w-full overflow-hidden bg-slate-900 border-y border-white/10 py-2 sm:py-2.5 select-none shadow-inner"
    >
      <div className="max-w-[1600px] mx-auto flex items-center">
        {/* Left Live Badge */}
        <div className="shrink-0 z-10 pl-3 pr-3.5 sm:pl-4 sm:pr-4 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border-r border-white/10 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-slate-300 whitespace-nowrap">
            Live Market
          </span>
        </div>

        {/* Marquee Track */}
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker-marquee flex items-center gap-6 sm:gap-8 px-4">
            {marqueeItems.map((item, idx) => {
              const isGreen = item.isPositive === true;
              const isRed = item.isPositive === false;

              return (
                <button
                  key={`${item.symbol}-${idx}`}
                  type="button"
                  onClick={() => onTickerClick?.(item.symbol)}
                  className="flex items-center gap-2 text-xs hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  title={`Xem tin tức về ${item.nameVi}`}
                >
                  <span className="font-bold text-white tracking-tight">
                    {item.symbol}
                  </span>
                  <span className="font-currency-row font-semibold text-slate-300 tabular-nums">
                    {item.value}
                  </span>
                  <span
                    className={`font-currency-row text-[11px] font-bold flex items-center tabular-nums ${
                      isGreen
                        ? 'text-emerald-400'
                        : isRed
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }`}
                  >
                    <span className="text-[9px] mr-0.5">
                      {isGreen ? '▲' : isRed ? '▼' : '●'}
                    </span>
                    {item.changePercent}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

