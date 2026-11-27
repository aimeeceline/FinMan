import React, { useState } from 'react';
import type { MarketMatrixAsset } from '../../types/news';
import { DEFAULT_MARKET_MATRIX } from '../../types/news';

interface MarketOverviewMatrixProps {
  onAssetClick?: (symbol: string) => void;
  onScrollToMarket?: () => void;
  isMarketEnabled?: boolean;
}

type MatrixTab = 'INDICES' | 'FOREX' | 'COMMODITIES';

export const MarketOverviewMatrix: React.FC<MarketOverviewMatrixProps> = ({
  onAssetClick,
  onScrollToMarket,
  isMarketEnabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<MatrixTab>('INDICES');

  const assets: MarketMatrixAsset[] = DEFAULT_MARKET_MATRIX[activeTab] || [];

  return (
    <div
      data-testid="market-overview-matrix"
      className="bg-surface-container-lowest rounded-3xl border border-outline-variant/25 p-4 sm:p-5 shadow-2xs space-y-4"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              Tổng Quan Thị Trường Tài Chính
            </h3>            
          </div>
        </div>

        {/* Right side: Tabs & Optional Direct Scroll to Market Terminal */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Nút dẫn thẳng đến div thị trường (chỉ hiện khi tính năng được bật trong Cài đặt) */}
          {isMarketEnabled && onScrollToMarket && (
            <button
              type="button"
              onClick={onScrollToMarket}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer shadow-2xs border border-primary/20 active:scale-95"
              title="Chuyển nhanh đến Bảng giá chứng khoán & Phân tích chi tiết bên dưới"
            >
              <span className="material-symbols-outlined text-[16px]">candlestick_chart</span>
              <span>Bảng giá & Chi tiết</span>
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </button>
          )}

          {/* Tab switchers */}
          <div className="inline-flex p-1 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <button
              type="button"
              onClick={() => setActiveTab('INDICES')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'INDICES'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Chỉ Số
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FOREX')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'FOREX'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tỷ Giá
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMMODITIES')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'COMMODITIES'
                  ? 'bg-white text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Hàng Hóa
            </button>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {assets.map((asset) => {
          const isUp = asset.isPositive;
          return (
            <button
              key={asset.symbol}
              type="button"
              onClick={() => onAssetClick?.(asset.symbol)}
              title={`Lọc tin tức về ${asset.symbol}`}
              className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                  {asset.symbol}
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase">
                  {asset.exchange}
                </span>
              </div>

              <div className="text-[11px] text-on-surface-variant truncate mt-1">
                {asset.name}
              </div>

              <div className="mt-2 flex items-baseline justify-between gap-1">
                <span className="font-currency-row font-bold text-xs sm:text-sm text-on-surface tabular-nums">
                  {asset.value}
                </span>
                <span
                  className={`font-currency-row text-[11px] font-bold flex items-center tabular-nums ${
                    isUp ? 'text-secondary' : 'text-error'
                  }`}
                >
                  <span className="text-[9px] mr-0.5">{isUp ? '▲' : '▼'}</span>
                  {asset.changePercent}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

