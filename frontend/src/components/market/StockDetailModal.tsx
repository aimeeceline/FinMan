import React, { useState, useEffect, useMemo } from 'react';
import type { StockQuote, StockPriceHistory } from '../../types/market';
import {
  formatChangePrice,
  formatPercent,
  formatTradingValueTyd,
  formatVndPrice,
  formatVolume,
} from '../../types/market';
import { marketService } from '../../services/marketService';
import { newsService } from '../../services/newsService';
import type { NewsArticle } from '../../types/news';
import { formatRelativeTimeVi } from '../../types/news';
import { SentimentBadge } from '../news/SentimentBadge';

interface StockDetailModalProps {
  stock: StockQuote | null;
  isOpen: boolean;
  onClose: () => void;
  isWatched?: boolean;
  onToggleWatchlist?: (symbol: string, isWatched: boolean) => void;
  onNavigateToNews?: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  isOpen,
  onClose,
  isWatched = false,
  onToggleWatchlist,
  onNavigateToNews,
}) => {
  const [history, setHistory] = useState<StockPriceHistory[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'CHART' | 'NEWS'>('CHART');
  const [hoveredHistory, setHoveredHistory] = useState<StockPriceHistory | null>(null);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load chi tiết cổ phiếu, lịch sử giá và tin tức liên quan
  useEffect(() => {
    if (!isOpen || !stock) return;

    let isMounted = true;
    setIsLoading(true);

    const loadStockData = async () => {
      try {
        const [stockData, articlesData] = await Promise.all([
          marketService.getStockDetail(stock.symbol),
          newsService.getArticles({ keyword: stock.symbol, size: 5 }),
        ]);

        if (!isMounted) return;

        if (stockData) {
          setHistory(stockData.priceHistory || []);
        }

        if (articlesData?.content && articlesData.content.length > 0) {
          setRelatedArticles(articlesData.content);
        } else if (stockData?.relatedNews && stockData.relatedNews.length > 0) {
          setRelatedArticles(stockData.relatedNews);
        } else {
          setRelatedArticles([]);
        }
      } catch (error) {
        console.warn('Lỗi tải dữ liệu chi tiết cổ phiếu:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStockData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, stock]);

  // SVG Chart calculation cho 30 phiên giao dịch EOD
  const chartPoints = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.slice(-25); // Lấy tối đa 25 phiên gần nhất
  }, [history]);

  const chartMeta = useMemo(() => {
    if (chartPoints.length === 0) return { min: 0, max: 100, range: 100, maxVol: 100 };
    const prices = chartPoints.map((p) => p.closePrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.1 || 1000;
    const maxVol = Math.max(...chartPoints.map((p) => p.volume || 1));
    return {
      min: min - pad,
      max: max + pad,
      range: max - min + pad * 2 || 1,
      maxVol: maxVol || 1,
    };
  }, [chartPoints]);

  if (!isOpen || !stock) return null;

  const isPositive = stock.changePrice > 0;
  const isNegative = stock.changePrice < 0;
  const colorClass = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegative
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-amber-600 dark:text-amber-400';

  // SVG dimensions
  const svgW = 680;
  const svgH = 220;
  const padL = 10;
  const padR = 10;
  const padT = 15;
  const padB = 60; // Dành 60px cho volume bar phía dưới
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const pointsSvg = chartPoints.map((item, idx) => {
    const x = padL + (idx / Math.max(1, chartPoints.length - 1)) * plotW;
    const y = padT + plotH - ((item.closePrice - chartMeta.min) / chartMeta.range) * plotH;
    const volH = (item.volume / chartMeta.maxVol) * 45;
    const volY = svgH - volH - 18;
    return { ...item, x, y, volH, volY };
  });

  // Smooth bezier curve for price line
  let linePath = '';
  if (pointsSvg.length > 0) {
    linePath = `M ${pointsSvg[0].x} ${pointsSvg[0].y}`;
    for (let i = 0; i < pointsSvg.length - 1; i++) {
      const p0 = pointsSvg[i];
      const p1 = pointsSvg[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) * 0.55;
      const cy2 = p1.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
  }

  const areaPath = pointsSvg.length > 0
    ? `${linePath} L ${pointsSvg[pointsSvg.length - 1].x} ${padT + plotH} L ${pointsSvg[0].x} ${padT + plotH} Z`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-detail-title"
      data-testid="stock-detail-modal"
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar */}
        <div className="px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black font-currency-row text-lg tracking-wider shrink-0">
              {stock.symbol}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="stock-detail-title" className="font-extrabold text-lg text-slate-900 dark:text-slate-100 truncate">
                  {stock.symbol}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {stock.exchange}
                </span>
                {stock.sector && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {stock.sector}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm" title={stock.companyName}>
                {stock.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Watchlist Toggle Button */}
            <button
              type="button"
              onClick={() => onToggleWatchlist?.(stock.symbol, isWatched)}
              data-testid="modal-stock-watchlist-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isWatched
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span
                className="material-symbols-outlined text-[17px] text-amber-500"
                style={{ fontVariationSettings: isWatched ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
              <span>{isWatched ? 'Đang theo dõi' : 'Thêm Watchlist'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              data-testid="modal-close-btn"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-6 flex-1">
          {/* Top Price Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Giá khớp lệnh hiện tại
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className={`font-currency-row font-black text-3xl sm:text-4xl ${colorClass}`}>
                  {formatVndPrice(stock.currentPrice)}
                </span>
                <span className={`font-mono text-sm sm:text-base font-bold flex items-center gap-0.5 ${colorClass}`}>
                  <span>{formatChangePrice(stock.changePrice)}</span>
                  <span>({formatPercent(stock.percentChange)})</span>
                </span>
              </div>
            </div>

            {/* Key Trading Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-xs font-mono">
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Mở cửa</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatVndPrice(stock.openPrice || stock.referencePrice)}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Cao nhất</span>
                <span className="font-bold text-emerald-600">
                  {formatVndPrice(stock.highPrice || stock.currentPrice)}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Thấp nhất</span>
                <span className="font-bold text-rose-600">
                  {formatVndPrice(stock.lowPrice || stock.currentPrice)}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Tham chiếu</span>
                <span className="font-bold text-amber-600">
                  {formatVndPrice(stock.referencePrice)}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Giá trần</span>
                <span className="font-bold text-purple-600">
                  {formatVndPrice(stock.ceilingPrice || Math.round(stock.referencePrice * 1.07))}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-slate-400 text-[11px] block">Giá sàn</span>
                <span className="font-bold text-cyan-600">
                  {formatVndPrice(stock.floorPrice || Math.round(stock.referencePrice * 0.93))}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Biểu đồ giá / Tin tức liên quan) */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('CHART')}
              data-testid="modal-tab-chart"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CHART'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">show_chart</span>
              <span>Lịch sử giá EOD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NEWS')}
              data-testid="modal-tab-news"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'NEWS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">newspaper</span>
              <span>Tin tức liên quan ({relatedArticles.length})</span>
            </button>
          </div>

          {/* TAB 1: BIỂU ĐỒ LỊCH SỬ GIÁ & KHỐI LƯỢNG */}
          {activeTab === 'CHART' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Biến động đóng cửa & Khối lượng 25 phiên gần nhất</span>
                {hoveredHistory && (
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                    {hoveredHistory.tradeDate}: {formatVndPrice(hoveredHistory.closePrice)} (
                    {formatPercent(hoveredHistory.percentChange)}) • KL: {formatVolume(hoveredHistory.volume)}
                  </span>
                )}
              </div>

              <div className="relative w-full h-[220px] bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="modalStockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area gradient */}
                  {areaPath && <path d={areaPath} fill="url(#modalStockGrad)" />}

                  {/* Line curve */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Volume Bars at Bottom */}
                  {pointsSvg.map((pt, i) => {
                    const isUp = (pt.changePrice || 0) >= 0;
                    const barColor = isUp ? '#10b981' : '#f43f5e';
                    const barW = Math.max(3, (plotW / pointsSvg.length) * 0.6);

                    return (
                      <g key={i}>
                        <rect
                          x={pt.x - barW / 2}
                          y={pt.volY}
                          width={barW}
                          height={pt.volH}
                          fill={barColor}
                          opacity="0.65"
                          rx="1.5"
                        />
                        {/* Interactive Circle on Line */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="10"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredHistory(pt)}
                          onMouseLeave={() => setHoveredHistory(null)}
                        />
                        {hoveredHistory?.tradeDate === pt.tradeDate && (
                          <circle cx={pt.x} cy={pt.y} r="4" fill="#10b981" />
                        )}
                      </g>
                    );
                  })}

                  {/* Date labels at bottom */}
                  {pointsSvg.map((pt, i) => {
                    if (i % 5 !== 0 && i !== pointsSvg.length - 1) return null;
                    return (
                      <text
                        key={`label-${i}`}
                        x={pt.x}
                        y={svgH - 2}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-400 font-mono"
                      >
                        {pt.tradeDate ? pt.tradeDate.slice(5) : ''}
                      </text>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Tổng KLGD hôm nay: <strong className="text-slate-800 dark:text-slate-200">{formatVolume(stock.totalVolume)}</strong></span>
                <span>Tổng GTGD: <strong className="text-slate-800 dark:text-slate-200">{formatTradingValueTyd(stock.totalValue)}</strong></span>
              </div>
            </div>
          )}

          {/* TAB 2: TIN TỨC LIÊN QUAN (CROSS-LINKING) */}
          {activeTab === 'NEWS' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[28px] animate-spin">
                    progress_activity
                  </span>
                  <p className="text-xs mt-1">Đang tìm tin tức tài chính về mã {stock.symbol}...</p>
                </div>
              ) : relatedArticles.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-[36px] text-slate-300">
                    article
                  </span>
                  <p className="text-xs">Chưa có bài báo tài chính gần đây đề cập trực tiếp đến mã {stock.symbol}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToNews?.(stock.symbol);
                    }}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Tìm kiếm tin tức liên quan trên toàn hệ thống ↗
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {relatedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        onClose();
                        onNavigateToNews?.(stock.symbol);
                      }}
                      className="py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors cursor-pointer group"
                    >
                      {art.thumbnailUrl ? (
                        <img
                          src={art.thumbnailUrl}
                          alt={art.title}
                          className="w-18 h-14 rounded-lg object-cover shrink-0 bg-slate-800"
                        />
                      ) : (
                        <div className="w-18 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <span className="material-symbols-outlined text-[20px]">newspaper</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
                          {art.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                          <span>{art.sourceName || 'Báo Tài Chính'}</span>
                          <span>•</span>
                          <span>{formatRelativeTimeVi(art.publishedAt)}</span>
                          {art.sentiment && (
                            <SentimentBadge sentiment={art.sentiment} size="xs" variant="subtle" />
                          )}
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all self-center shrink-0">
                        arrow_forward
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToNews?.(stock.symbol);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <span>Xem toàn bộ tin tức về mã {stock.symbol}</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Dữ liệu giao dịch khớp lệnh sàn {stock.exchange}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
