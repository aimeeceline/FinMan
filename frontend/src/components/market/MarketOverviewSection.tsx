import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { MarketIndex, StockQuote, UserWatchlistItem } from '../../types/market';
import {
  formatTradingValueTyd,
  formatVolume,
} from '../../types/market';
import { marketService, FALLBACK_MARKET_INDICES, FALLBACK_STOCK_QUOTES } from '../../services/marketService';
import { IndexCard } from './IndexCard';
import { IndexChart } from './IndexChart';
import { StockQuoteTable } from './StockQuoteTable';
import { WatchlistTable } from './WatchlistTable';
import { StockDetailModal } from './StockDetailModal';

interface MarketOverviewSectionProps {
  id?: string;
  onScrollToTop?: () => void;
  onNavigateToNews?: (ticker?: string) => void;
}

type MarketViewMode = 'ALL_STOCKS' | 'WATCHLIST';

export const MarketOverviewSection: React.FC<MarketOverviewSectionProps> = ({
  id = 'market-terminal-section',
  onScrollToTop,
  onNavigateToNews,
}) => {
  const [indices, setIndices] = useState<MarketIndex[]>(FALLBACK_MARKET_INDICES);
  const [selectedIndex, setSelectedIndex] = useState<MarketIndex>(FALLBACK_MARKET_INDICES[0]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Mode: Bảng giá thị trường vs Danh mục Watchlist
  const [viewMode, setViewMode] = useState<MarketViewMode>('ALL_STOCKS');

  // Search, Filter & Pagination states
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const pageSize = 20;

  // Watchlist status tracking
  const [watchlistItems, setWatchlistItems] = useState<UserWatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState<boolean>(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set(['FPT', 'VCB']));

  // Stock Detail Modal states
  const [selectedStockForModal, setSelectedStockForModal] = useState<StockQuote | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);

  // Fetch Market Indices
  const fetchIndices = useCallback(async () => {
    try {
      const data = await marketService.getMarketIndices();
      if (data && data.length > 0) {
        setIndices(data);
        setSelectedIndex((prev) => data.find((i) => i.code === prev.code) || data[0]);
      }
    } catch (error) {
      console.warn('Lỗi tải chỉ số:', error);
    }
  }, []);

  // Fetch Stocks with filter and pagination
  const fetchStocks = useCallback(async () => {
    setIsLoadingStocks(true);
    try {
      const pageData = await marketService.getStockQuotes({
        page: currentPage,
        size: pageSize,
        keyword: searchKeyword,
        exchange: selectedExchange,
      });
      setStocks(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.warn('Lỗi tải cổ phiếu:', error);
    } finally {
      setIsLoadingStocks(false);
    }
  }, [currentPage, searchKeyword, selectedExchange]);

  // Fetch User Watchlist
  const fetchWatchlist = useCallback(async () => {
    setIsLoadingWatchlist(true);
    try {
      const list = await marketService.getWatchlist();
      if (Array.isArray(list) && list.length > 0) {
        setWatchlistItems(list);
        setWatchlistSymbols(new Set(list.map((item) => item.symbol)));
      } else {
        const defaultSymbols = ['FPT', 'VCB', 'HPG'];
        const sampleWatchlist: UserWatchlistItem[] = defaultSymbols.map((sym, i) => {
          const q = FALLBACK_STOCK_QUOTES.find((s) => s.symbol === sym) || FALLBACK_STOCK_QUOTES[0];
          return {
            id: i + 1,
            symbol: q.symbol,
            companyName: q.companyName,
            exchange: q.exchange,
            sector: q.sector,
            currentPrice: q.currentPrice,
            changePrice: q.changePrice,
            percentChange: q.percentChange,
            referencePrice: q.referencePrice,
            totalVolume: q.totalVolume,
            note: sym === 'FPT' ? 'Dẫn đầu tăng trưởng AI & Xuất khẩu phần mềm' : sym === 'VCB' ? 'Trụ cột ngân hàng quốc doanh' : 'Chu kỳ phục hồi thép',
            targetPrice: sym === 'FPT' ? 155000 : sym === 'VCB' ? 105000 : 32000,
            alertEnabled: true,
            displayOrder: i,
            createdAt: new Date().toISOString(),
          };
        });
        setWatchlistItems(sampleWatchlist);
        setWatchlistSymbols(new Set(sampleWatchlist.map((s) => s.symbol)));
      }
    } catch (error) {
      console.warn('Lỗi tải watchlist:', error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchIndices();
    fetchWatchlist();
  }, [fetchIndices, fetchWatchlist]);

  // Refetch stocks whenever filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStocks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStocks]);

  // Trigger manual sync
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const res = await marketService.triggerSync();
      setToastMessage(res.message);
      await Promise.all([fetchIndices(), fetchStocks(), fetchWatchlist()]);
    } catch {
      setToastMessage('Lỗi đồng bộ dữ liệu thị trường.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Toggle watchlist từ bảng giá cổ phiếu
  const handleToggleWatchlist = async (symbol: string, isWatched: boolean) => {
    try {
      if (isWatched) {
        await marketService.removeFromWatchlist(symbol);
        setWatchlistSymbols((prev) => {
          const next = new Set(prev);
          next.delete(symbol);
          return next;
        });
        setWatchlistItems((prev) => prev.filter((item) => item.symbol !== symbol));
        setToastMessage(`Đã xóa mã ${symbol} khỏi danh sách theo dõi.`);
      } else {
        const added = await marketService.addToWatchlist({ symbol });
        setWatchlistSymbols((prev) => {
          const next = new Set(prev);
          next.add(symbol);
          return next;
        });
        if (added) {
          setWatchlistItems((prev) => [...prev, added]);
        } else {
          const q = stocks.find((s) => s.symbol === symbol) || FALLBACK_STOCK_QUOTES.find((s) => s.symbol === symbol);
          if (q) {
            setWatchlistItems((prev) => [
              ...prev,
              {
                id: Date.now(),
                symbol: q.symbol,
                companyName: q.companyName,
                exchange: q.exchange,
                sector: q.sector,
                currentPrice: q.currentPrice,
                changePrice: q.changePrice,
                percentChange: q.percentChange,
                referencePrice: q.referencePrice,
                totalVolume: q.totalVolume,
                alertEnabled: true,
                displayOrder: prev.length,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        }
        setToastMessage(`Đã thêm mã ${symbol} vào danh sách theo dõi.`);
      }
    } catch (error) {
      console.warn('Lỗi cập nhật watchlist:', error);
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        if (isWatched) next.delete(symbol);
        else next.add(symbol);
        return next;
      });
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Thêm trực tiếp vào Watchlist từ form Watchlist
  const handleAddWatchlist = async (symbol: string, note?: string, targetPrice?: number) => {
    try {
      const added = await marketService.addToWatchlist({ symbol, note, targetPrice, alertEnabled: true });
      setWatchlistSymbols((prev) => new Set([...prev, symbol]));
      if (added) {
        setWatchlistItems((prev) => [...prev.filter((i) => i.symbol !== symbol), added]);
      } else {
        const q = stocks.find((s) => s.symbol === symbol) || FALLBACK_STOCK_QUOTES.find((s) => s.symbol === symbol);
        setWatchlistItems((prev) => [
          ...prev.filter((i) => i.symbol !== symbol),
          {
            id: Date.now(),
            symbol,
            companyName: q?.companyName || `Mã cổ phiếu ${symbol}`,
            exchange: q?.exchange || 'HOSE',
            sector: q?.sector,
            currentPrice: q?.currentPrice || 50000,
            changePrice: q?.changePrice || 0,
            percentChange: q?.percentChange || 0,
            referencePrice: q?.referencePrice || 50000,
            totalVolume: q?.totalVolume || 1000000,
            note,
            targetPrice,
            alertEnabled: true,
            displayOrder: prev.length,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setToastMessage(`Đã thêm mã ${symbol} vào Watchlist.`);
    } catch {
      setToastMessage(`Đã thêm mã ${symbol} vào Watchlist.`);
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Cập nhật mục Watchlist
  const handleUpdateWatchlistItem = async (id: number, note?: string, targetPrice?: number, alertEnabled?: boolean) => {
    try {
      await marketService.updateWatchlistItem(id, { note, targetPrice, alertEnabled });
      setWatchlistItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, note, targetPrice, alertEnabled: alertEnabled ?? item.alertEnabled } : item
        )
      );
      setToastMessage('Đã cập nhật mục theo dõi.');
    } catch {
      setWatchlistItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, note, targetPrice, alertEnabled: alertEnabled ?? item.alertEnabled } : item
        )
      );
    } finally {
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Xóa khỏi Watchlist
  const handleRemoveWatchlistItem = async (symbol: string) => {
    try {
      await marketService.removeFromWatchlist(symbol);
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
      setWatchlistItems((prev) => prev.filter((i) => i.symbol !== symbol));
      setToastMessage(`Đã xóa mã ${symbol} khỏi Watchlist.`);
    } catch {
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
      setWatchlistItems((prev) => prev.filter((i) => i.symbol !== symbol));
    } finally {
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Mở modal chi tiết khi click vào bất kỳ mã cổ phiếu nào
  const handleOpenStockDetail = (symbolOrQuote: string | StockQuote) => {
    let quote: StockQuote | undefined;
    if (typeof symbolOrQuote === 'string') {
      quote = stocks.find((s) => s.symbol.toUpperCase() === symbolOrQuote.toUpperCase()) ||
        FALLBACK_STOCK_QUOTES.find((s) => s.symbol.toUpperCase() === symbolOrQuote.toUpperCase());
      if (!quote) {
        const wItem = watchlistItems.find((w) => w.symbol.toUpperCase() === symbolOrQuote.toUpperCase());
        if (wItem) {
          quote = {
            id: wItem.id,
            symbol: wItem.symbol,
            companyName: wItem.companyName,
            exchange: wItem.exchange,
            sector: wItem.sector,
            currentPrice: wItem.currentPrice,
            changePrice: wItem.changePrice,
            percentChange: wItem.percentChange,
            referencePrice: wItem.referencePrice,
            totalVolume: wItem.totalVolume,
            totalValue: wItem.currentPrice * wItem.totalVolume,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } else {
      quote = symbolOrQuote;
    }

    if (quote) {
      setSelectedStockForModal(quote);
      setIsStockModalOpen(true);
    }
  };

  // Tính toán độ rộng thị trường (Market Breadth: Gainers / Losers / Unchanged)
  const marketBreadth = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;
    let totalVal = 0;
    let totalVol = 0;

    stocks.forEach((s) => {
      if (s.changePrice > 0) gainers++;
      else if (s.changePrice < 0) losers++;
      else unchanged++;

      totalVal += s.totalValue || 0;
      totalVol += s.totalVolume || 0;
    });

    return { gainers, losers, unchanged, totalVal, totalVol };
  }, [stocks]);

  return (
    <section id={id} className="scroll-mt-6 pt-2 pb-6 space-y-6" aria-label="Phân hệ Thị Trường & Bảng Giá Cổ Phiếu">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-slideUp">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stock Detail Modal with 30-day Price History & Related News */}
      <StockDetailModal
        stock={selectedStockForModal}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        isWatched={selectedStockForModal ? watchlistSymbols.has(selectedStockForModal.symbol) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onNavigateToNews={onNavigateToNews}
      />

      {/* 1. Header: Title, Live Status, Scroll-to-Top Button & Sync Button */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">
                candlestick_chart
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                Thị Trường & Cổ Phiếu Niêm Yết
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Bảng điểm chỉ số VN-Index, VN30, HNX, UPCOM, biểu đồ kỹ thuật và danh mục theo dõi (Watchlist)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Nút Cuộn Lên Đầu Trang Tin Tức */}
          {onScrollToTop && (
            <button
              type="button"
              onClick={onScrollToTop}
              title="Cuộn lên phần Tin tức tài chính"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all cursor-pointer border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>Về tin tức đầu trang</span>
            </button>
          )}

          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Trực tiếp</span>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncData}
            disabled={isSyncing}
            data-testid="sync-market-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[17px] ${isSyncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Indices Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => (
          <IndexCard
            key={idx.code}
            index={idx}
            isSelected={selectedIndex?.code === idx.code}
            onSelect={(clicked) => setSelectedIndex(clicked)}
          />
        ))}
      </div>

      {/* 3. Detailed Index Chart */}
      {selectedIndex && <IndexChart index={selectedIndex} />}

      {/* 4. Market Breadth & Liquidity Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mã tăng */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant block">Mã Tăng Giá</span>
              <span className="text-lg font-black text-emerald-600 font-currency-row">
                {marketBreadth.gainers} mã
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 font-mono">
            {stocks.length > 0 ? ((marketBreadth.gainers / stocks.length) * 100).toFixed(0) : 0}%
          </span>
        </div>

        {/* Mã giảm */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant block">Mã Giảm Giá</span>
              <span className="text-lg font-black text-rose-600 font-currency-row">
                {marketBreadth.losers} mã
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-600 font-mono">
            {stocks.length > 0 ? ((marketBreadth.losers / stocks.length) * 100).toFixed(0) : 0}%
          </span>
        </div>

        {/* Mã tham chiếu / Không đổi */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">trending_flat</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant block">Đứng Giá (Tham chiếu)</span>
              <span className="text-lg font-black text-amber-600 font-currency-row">
                {marketBreadth.unchanged} mã
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 font-mono">
            {stocks.length > 0 ? ((marketBreadth.unchanged / stocks.length) * 100).toFixed(0) : 0}%
          </span>
        </div>

        {/* Thanh khoản thị trường */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-on-surface-variant block">Tổng GT Khớp Lệnh</span>
              <span className="text-lg font-black text-on-surface font-currency-row font-mono">
                {formatTradingValueTyd(marketBreadth.totalVal || selectedIndex.tradingValue)}
              </span>
            </div>
          </div>
          <span className="text-xs text-on-surface-variant/70 font-mono">
            {formatVolume(marketBreadth.totalVol || selectedIndex.tradingVolume)}
          </span>
        </div>
      </div>

      {/* 5. View Mode Switcher: Bảng giá toàn thị trường vs Watchlist cá nhân */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('ALL_STOCKS')}
          data-testid="view-mode-all-stocks"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'ALL_STOCKS'
              ? 'bg-on-surface text-white shadow-xs'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">table_chart</span>
          <span>Bảng giá toàn thị trường ({totalElements})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('WATCHLIST')}
          data-testid="view-mode-watchlist"
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'WATCHLIST'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">star</span>
          <span>Danh mục theo dõi (Watchlist) ({watchlistItems.length})</span>
        </button>
      </div>

      {/* 6. Active Tab Content */}
      {viewMode === 'ALL_STOCKS' ? (
        <section aria-label="Bảng giá cổ phiếu niêm yết">
          <StockQuoteTable
            stocks={stocks}
            isLoading={isLoadingStocks}
            watchlistSymbols={watchlistSymbols}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectStock={handleOpenStockDetail}
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            selectedExchange={selectedExchange}
            onSelectExchange={(ex) => {
              setSelectedExchange(ex);
              setCurrentPage(0);
            }}
            searchKeyword={searchKeyword}
            onSearchChange={(kw) => {
              setSearchKeyword(kw);
              setCurrentPage(0);
            }}
          />
        </section>
      ) : (
        <section aria-label="Danh mục theo dõi cá nhân">
          <WatchlistTable
            watchlist={watchlistItems}
            isLoading={isLoadingWatchlist}
            onRemove={handleRemoveWatchlistItem}
            onAdd={handleAddWatchlist}
            onUpdate={handleUpdateWatchlistItem}
            onSelectStock={handleOpenStockDetail}
          />
        </section>
      )}
    </section>
  );
};
