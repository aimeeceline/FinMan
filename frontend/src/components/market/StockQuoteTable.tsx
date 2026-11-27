import React, { useState, useMemo } from 'react';
import type { StockQuote } from '../../types/market';
import {
  formatChangePrice,
  formatPercent,
  formatTradingValueTyd,
  formatVndPrice,
  formatVolume,
} from '../../types/market';

interface StockQuoteTableProps {
  stocks: StockQuote[];
  isLoading?: boolean;
  watchlistSymbols?: Set<string>;
  onToggleWatchlist?: (symbol: string, isWatched: boolean) => void;
  onSelectStock?: (stock: StockQuote) => void;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedExchange: string;
  onSelectExchange: (exchange: string) => void;
  searchKeyword: string;
  onSearchChange: (kw: string) => void;
}

type TabCategory = 'ALL' | 'GAINERS' | 'LOSERS' | 'VOLUME';

export const StockQuoteTable: React.FC<StockQuoteTableProps> = ({
  stocks,
  isLoading = false,
  watchlistSymbols = new Set(),
  onToggleWatchlist,
  onSelectStock,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  selectedExchange,
  onSelectExchange,
  searchKeyword,
  onSearchChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');

  // Lọc và sắp xếp theo Tab
  const sortedStocks = useMemo(() => {
    let result = [...stocks];

    if (activeTab === 'GAINERS') {
      result.sort((a, b) => b.percentChange - a.percentChange);
    } else if (activeTab === 'LOSERS') {
      result.sort((a, b) => a.percentChange - b.percentChange);
    } else if (activeTab === 'VOLUME') {
      result.sort((a, b) => b.totalVolume - a.totalVolume);
    }

    return result;
  }, [stocks, activeTab]);

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Filter Header */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/15 flex flex-col gap-4">
        {/* Top Row: Quick Category Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-on-surface text-white shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              <span>Tất cả ({totalElements})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GAINERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'GAINERS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Tăng mạnh nhất</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LOSERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'LOSERS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">trending_down</span>
              <span>Giảm mạnh nhất</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VOLUME')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'VOLUME'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              <span>Khối lượng lớn</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm mã, công ty, ngành..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface text-[16px] cursor-pointer"
              >
                close
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Sàn Giao Dịch Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant font-medium mr-1">Sàn:</span>
          {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onSelectExchange(ex)}
              data-testid={`exchange-filter-${ex}`}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedExchange === ex
                  ? 'bg-primary text-white shadow-2xs font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {ex === 'ALL' ? 'Tất cả sàn' : ex}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Stock Quote Table */}
      <div className="overflow-x-auto custom-scroll flex-1">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-surface-container/50 border-b border-outline-variant/20 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-12 text-center">Lưu</th>
              <th className="py-3 px-4">Mã CP</th>
              <th className="py-3 px-4">Tên Doanh Nghiệp</th>
              <th className="py-3 px-3 text-center">Sàn</th>
              <th className="py-3 px-4 text-right">Giá Khớp</th>
              <th className="py-3 px-4 text-right">Biến Động</th>
              <th className="py-3 px-3 text-right">Tham Chiếu</th>
              <th className="py-3 px-3 text-right">Trần / Sàn</th>
              <th className="py-3 px-4 text-right">Tổng KLGD</th>
              <th className="py-3 px-4 text-right">Tổng GTGD</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/10 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
                      progress_activity
                    </span>
                    <span className="text-xs font-medium">Đang tải bảng giá chứng khoán...</span>
                  </div>
                </td>
              </tr>
            ) : sortedStocks.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">
                      search_off
                    </span>
                    <span className="text-sm font-semibold">Không tìm thấy mã cổ phiếu phù hợp</span>
                    <p className="text-xs text-on-surface-variant/70">
                      Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại sàn giao dịch.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStocks.map((stock) => {
                const isPositive = stock.changePrice > 0;
                const isNegative = stock.changePrice < 0;
                const isWatched = watchlistSymbols.has(stock.symbol);

                // Màu sắc quy chuẩn sàn chứng khoán Việt Nam
                const colorClass = isPositive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : isNegative
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-amber-600 dark:text-amber-400 font-bold';

                return (
                  <tr
                    key={stock.id}
                    onClick={() => onSelectStock?.(stock)}
                    data-testid={`stock-row-${stock.symbol}`}
                    className="hover:bg-surface-container/60 transition-colors cursor-pointer group"
                  >
                    {/* Nút Watchlist */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist?.(stock.symbol, isWatched)}
                        title={isWatched ? 'Bỏ theo dõi' : 'Thêm vào Watchlist'}
                        data-testid={`watchlist-btn-${stock.symbol}`}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isWatched
                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                            : 'text-on-surface-variant/40 hover:text-primary hover:bg-surface-container'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[17px]"
                          style={{ fontVariationSettings: isWatched ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </button>
                    </td>

                    {/* Mã CP */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-currency-row font-black text-sm tracking-wider text-on-surface group-hover:text-primary transition-colors">
                          {stock.symbol}
                        </span>
                        {stock.sector && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium hidden sm:inline-block">
                            {stock.sector}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tên Doanh Nghiệp */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <span className="truncate block font-medium text-on-surface-variant group-hover:text-on-surface" title={stock.companyName}>
                        {stock.companyName}
                      </span>
                    </td>

                    {/* Sàn */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-surface-container text-on-surface-variant">
                        {stock.exchange}
                      </span>
                    </td>

                    {/* Giá Khớp (VND) */}
                    <td className="py-3 px-4 text-right">
                      <span className={`font-currency-row text-sm font-black ${colorClass}`}>
                        {formatVndPrice(stock.currentPrice)}
                      </span>
                    </td>

                    {/* Biến Động */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono text-xs ${colorClass}`}>
                          {formatChangePrice(stock.changePrice)}
                        </span>
                        <span className={`font-mono text-[11px] ${colorClass}`}>
                          {formatPercent(stock.percentChange)}
                        </span>
                      </div>
                    </td>

                    {/* Tham Chiếu (Vàng) */}
                    <td className="py-3 px-3 text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                      {formatVndPrice(stock.referencePrice)}
                    </td>

                    {/* Trần / Sàn (Tím / Xanh lơ) */}
                    <td className="py-3 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold" title="Giá trần">
                        {formatVndPrice(stock.ceilingPrice || Math.round(stock.referencePrice * 1.07))}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold" title="Giá sàn">
                        {formatVndPrice(stock.floorPrice || Math.round(stock.referencePrice * 0.93))}
                      </span>
                    </td>

                    {/* Tổng KLGD */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-on-surface">
                      {formatVolume(stock.totalVolume)}
                    </td>

                    {/* Tổng GTGD */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-on-surface">
                      {formatTradingValueTyd(stock.totalValue)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectStock?.(stock)}
                        title="Xem chi tiết & lịch sử giá"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-outline-variant/15 flex items-center justify-between flex-wrap gap-3 text-xs">
          <span className="text-on-surface-variant font-medium">
            Trang <span className="font-bold text-on-surface">{currentPage + 1}</span> / {totalPages} (Tổng {totalElements} mã cổ phiếu)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Trước</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - Math.min(5, totalPages)));
              const pageNum = startPage + idx;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Sau</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

