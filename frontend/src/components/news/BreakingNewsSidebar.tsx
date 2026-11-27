import React, { useState, useEffect, useMemo } from 'react';
import type { NewsArticle, SpotlightStockItem } from '../../types/news';
import {
  DEFAULT_SPOTLIGHT_STOCKS,
  DEFAULT_EXPERT_INSIGHT,
  formatRelativeTimeVi,
  parseBulletPoints,
} from '../../types/news';
import { newsService, FALLBACK_NEWS_ARTICLES } from '../../services/newsService';

interface BreakingNewsSidebarProps {
  articles?: NewsArticle[];
  recentArticles?: NewsArticle[];
  excludeIds?: number[];
  onSelectArticle: (article: NewsArticle) => void;
  onTickerClick?: (ticker: string) => void;
}

// Hàm xác định màu sắc danh mục chuẩn theo thiết kế
const getCategoryColor = (code?: string, name?: string): string => {
  const key = `${code || ''} ${name || ''}`.toUpperCase();
  if (key.includes('STOCK') || key.includes('CHỨNG KHOÁN') || key.includes('CHUNG KHOAN')) {
    return 'text-[#059669]'; // Xanh lá ngọc lục bảo (Emerald)
  }
  if (
    key.includes('COMMODITY') ||
    key.includes('VÀNG') ||
    key.includes('VANG') ||
    key.includes('HÀNG HÓA') ||
    key.includes('INVESTMENT') ||
    key.includes('ĐẦU TƯ')
  ) {
    return 'text-[#d97706]'; // Cam hổ phách (Amber/Orange)
  }
  if (
    key.includes('BANKING') ||
    key.includes('NGÂN HÀNG') ||
    key.includes('FINTECH') ||
    key.includes('SỐ') ||
    key.includes('TIẾT KIỆM') ||
    key.includes('CÔNG NGHỆ')
  ) {
    return 'text-[#2563eb]'; // Xanh dương hoàng gia (Blue)
  }
  if (key.includes('REAL_ESTATE') || key.includes('BẤT ĐỘNG SẢN')) {
    return 'text-teal-700';
  }
  if (key.includes('MACRO') || key.includes('VĨ MÔ')) {
    return 'text-rose-600';
  }
  return 'text-emerald-700';
};

// Hàm cung cấp ảnh thumbnail ngữ cảnh chất lượng cao nếu bài báo thực tế chưa có ảnh
const getCategoryFallbackImage = (code?: string, name?: string): string => {
  const key = `${code || ''} ${name || ''}`.toUpperCase();
  if (key.includes('STOCK') || key.includes('CHỨNG KHOÁN') || key.includes('CHUNG KHOAN')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&auto=format&fit=crop&q=80';
  }
  if (
    key.includes('COMMODITY') ||
    key.includes('VÀNG') ||
    key.includes('VANG') ||
    key.includes('HÀNG HÓA')
  ) {
    return 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=300&auto=format&fit=crop&q=80';
  }
  if (
    key.includes('BANKING') ||
    key.includes('NGÂN HÀNG') ||
    key.includes('FINTECH') ||
    key.includes('SỐ') ||
    key.includes('CÔNG NGHỆ')
  ) {
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80';
  }
  if (key.includes('MACRO') || key.includes('VĨ MÔ') || key.includes('CPI')) {
    return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=300&auto=format&fit=crop&q=80';
  }
  if (key.includes('REAL_ESTATE') || key.includes('BẤT ĐỘNG SẢN') || key.includes('ĐẦU TƯ')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&auto=format&fit=crop&q=80';
};

export const BreakingNewsSidebar: React.FC<BreakingNewsSidebarProps> = ({
  articles = [],
  recentArticles = [],
  excludeIds = [],
  onSelectArticle,
  onTickerClick,
}) => {
  const spotlightStocks: SpotlightStockItem[] = DEFAULT_SPOTLIGHT_STOCKS;
  const expertInsight = DEFAULT_EXPERT_INSIGHT;

  // State cho danh sách bài báo thực tế
  const [liveArticles, setLiveArticles] = useState<NewsArticle[]>(
    articles.length > 0 ? articles : recentArticles
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State cho Tiện ích Tính Lãi Kép Nhanh
  const [principal, setPrincipal] = useState<number>(100000000);
  const [rate, setRate] = useState<number>(7.5);
  const [years, setYears] = useState<number>(5);

  const compoundResult = useMemo(() => {
    const r = rate / 100;
    const finalAmount = Math.round(principal * Math.pow(1 + r, years));
    const profit = finalAmount - principal;
    return { finalAmount, profit };
  }, [principal, rate, years]);

  // State cho Tiện ích Tính Tiền Điện Sinh Hoạt (Biểu giá EVN 5 bậc mới nhất Quyết định 2892/QĐ-BCT)
  const [kwh, setKwh] = useState<number>(880);
  const [billingDays, setBillingDays] = useState<number>(31); // 31 ngày thực tế theo hoá đơn EVN
  const [vatRate, setVatRate] = useState<number>(8); // 8% theo nghị định giảm thuế hoặc 10%
  const [showTierBreakdown, setShowTierBreakdown] = useState<boolean>(true);

  const electricResult = useMemo(() => {
    const consumption = Math.max(0, kwh);
    const days = Math.max(1, billingDays);
    
    // Biểu giá bán lẻ điện sinh hoạt 5 bậc mới nhất theo Quyết định số 2892/QĐ-BCT
    // Định mức bậc chuẩn cho 30 ngày: 100, 100, 200, 300, trên 700 kWh.
    // Phân bổ theo số ngày dùng thực tế: Định mức = Math.round(Định mức chuẩn * days / 30)
    const tier1Quota = Math.round((100 * days) / 30);
    const tier2Quota = Math.round((100 * days) / 30);
    const tier3Quota = Math.round((200 * days) / 30);
    const tier4Quota = Math.round((300 * days) / 30);

    const tiers = [
      { name: 'Bậc thang 1', quota: tier1Quota, price: 1901 },
      { name: 'Bậc thang 2', quota: tier2Quota, price: 2289 },
      { name: 'Bậc thang 3', quota: tier3Quota, price: 2894 },
      { name: 'Bậc thang 4', quota: tier4Quota, price: 3456 },
      { name: 'Bậc thang 5', quota: Infinity, price: 3844 },
    ];

    let remaining = consumption;
    let subtotal = 0;
    const breakdown: { name: string; price: number; kwh: number; amount: number }[] = [];

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const usedInTier = Math.min(remaining, tier.quota);
      const amount = usedInTier * tier.price;
      subtotal += amount;
      remaining -= usedInTier;
      breakdown.push({
        name: tier.name,
        price: tier.price,
        kwh: usedInTier,
        amount,
      });
    }

    subtotal = Math.round(subtotal);
    const vatAmount = Math.round(subtotal * (vatRate / 100));
    const totalWithVat = subtotal + vatAmount;
    const avgPricePerKwh = consumption > 0 ? Math.round(subtotal / consumption) : 0;

    return { subtotal, vatAmount, totalWithVat, avgPricePerKwh, breakdown };
  }, [kwh, billingDays, vatRate]);

  // Cập nhật khi prop articles hoặc recentArticles thay đổi
  useEffect(() => {
    if (articles && articles.length > 0) {
      setLiveArticles(articles);
    } else if (recentArticles && recentArticles.length > 0) {
      setLiveArticles(recentArticles);
    }
  }, [articles, recentArticles]);

  // Luôn chủ động fetch bản tin mới nhất từ hệ thống để đảm bảo dòng tin nóng thời gian thực
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    newsService
      .getArticles({ page: 0, size: 8 })
      .then((res) => {
        if (!isMounted) return;
        if (res.content && res.content.length > 0) {
          setLiveArticles(res.content);
        }
      })
      .catch(() => {
        // Fallback giữ nguyên
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Lấy các bài báo thực tế mới nhất, TUYỆT ĐỐI KHÔNG TRÙNG LẶP với Hero và Grid
  const displayArticles = useMemo(() => {
    const excluded = new Set(excludeIds || []);
    let list: NewsArticle[] = [];

    // 1. Ưu tiên lấy từ prop articles nếu được truyền trực tiếp từ trang cha
    if (articles && articles.length > 0) {
      list = articles.filter((a) => !excluded.has(a.id));
    }

    // 2. Nếu danh sách chưa đủ 3 bài, bổ sung từ liveArticles hoặc FALLBACK_NEWS_ARTICLES
    if (list.length < 3) {
      const candidates = [...liveArticles, ...FALLBACK_NEWS_ARTICLES];
      for (const candidate of candidates) {
        const isExcluded = excluded.has(candidate.id);
        const isDuplicateTitle = list.some(
          (existing) =>
            existing.id === candidate.id ||
            existing.title.trim().toLowerCase() === candidate.title.trim().toLowerCase()
        );
        if (!isExcluded && !isDuplicateTitle) {
          list.push(candidate);
          if (list.length >= 3) break;
        }
      }
    }

    return list.slice(0, 3);
  }, [articles, excludeIds, liveArticles]);

  return (
    <aside
      aria-label="Cột tin nóng và tiện ích thị trường"
      className="space-y-6"
    >
      {/* 1. Tin Nóng Trong Ngày (Design chính xác chuẩn mẫu, nội dung từ dữ liệu thực tế) */}
      <div
        data-testid="breaking-news-box"
        className="space-y-3.5"
      >
        {/* Header với chấm tròn xanh và "Cập nhật liên tục" */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
            <h3 className="font-extrabold text-base sm:text-[17px] text-[#0f172a] tracking-tight">
              Tin Nóng Trong Ngày
            </h3>
          </div>
          <span className="text-xs text-[#94a3b8] font-normal">
            Cập nhật liên tục
          </span>
        </div>

        {/* Danh sách các bài viết thực tế với thiết kế chuẩn mẫu */}
        {isLoading && displayArticles.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center gap-3.5 animate-pulse"
              >
                <div className="w-[84px] h-[84px] rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayArticles.map((article) => {
              const categoryColor = getCategoryColor(article.categoryCode, article.categoryName);
              const categoryTitle = article.categoryName || 'Tài Chính';
              const timeAgoStr = formatRelativeTimeVi(article.publishedAt);
              const snippetText =
                article.description ||
                article.contentSnippet ||
                parseBulletPoints(article.bulletPoints)[0] ||
                'Xem chi tiết diễn biến bài viết và phân tích tác động tài chính...';
              const displayThumb =
                article.thumbnailUrl ||
                getCategoryFallbackImage(article.categoryCode, article.categoryName);

              return (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                >
                  {/* Thumbnail vuông bo góc chuẩn 84px */}
                  <div className="w-[84px] h-[84px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={displayThumb}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback sang ảnh ngữ cảnh nếu URL lỗi
                        const fallbackUrl = getCategoryFallbackImage(
                          article.categoryCode,
                          article.categoryName
                        );
                        (e.target as HTMLImageElement).src = fallbackUrl;
                      }}
                    />
                  </div>

                  {/* Khối nội dung thông tin bên phải */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-[84px] py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs mb-1">
                        <span className={`font-bold text-[12px] ${categoryColor}`}>
                          {categoryTitle}
                        </span>
                        <span className="text-[#94a3b8] text-[10px]">•</span>
                        <span className="text-[#94a3b8] text-[11px]">
                          {timeAgoStr}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-[13px] text-[#0f172a] group-hover:text-primary transition-colors line-clamp-2 leading-[1.35]">
                        {article.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#64748b] truncate mt-1">
                      {snippetText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Cổ Phiếu Tâm Điểm (Spotlight Stocks) */}
      <div
        data-testid="spotlight-stocks-box"
        className="bg-surface-container-lowest rounded-3xl border border-outline-variant/25 p-4 sm:p-5 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-500">
              local_fire_department
            </span>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Cổ Phiếu Tâm Điểm
            </h3>
          </div>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Biến động mạnh
          </span>
        </div>

        <div className="space-y-2">
          {spotlightStocks.map((stock) => {
            const isUp = stock.isPositive;
            return (
              <button
                key={stock.ticker}
                type="button"
                onClick={() => onTickerClick?.(stock.ticker)}
                title={`Nhấn để lọc tin tức về ${stock.ticker}`}
                className="w-full p-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 flex items-center justify-between transition-all cursor-pointer group text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                      {stock.ticker}
                    </span>
                    <span className="text-[10px] text-on-surface-variant px-1.5 py-0.2 rounded-md bg-surface-container">
                      {stock.industry}
                    </span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant/80 truncate max-w-[130px]">
                    {stock.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-currency-row font-bold text-xs text-on-surface tabular-nums">
                    {stock.price}
                  </div>
                  <div
                    className={`font-currency-row text-[11px] font-bold tabular-nums flex items-center justify-end ${
                      isUp ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    <span>{isUp ? '▲' : '▼'}</span>
                    <span>{stock.changePercent}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Góc Nhìn Chuyên Gia (Expert Column) */}
      <div
        data-testid="expert-insight-box"
        className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-3"
      >
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">psychology</span>
          <span>Góc Nhìn Chuyên Gia</span>
        </div>

        <blockquote className="text-xs text-slate-200 italic leading-relaxed pl-3 border-l-2 border-amber-400">
          &ldquo;{expertInsight.quote}&rdquo;
        </blockquote>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div>
            <div className="font-bold text-white">{expertInsight.authorName}</div>
            <div className="text-slate-400 text-[10px]">{expertInsight.title}</div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-300 font-semibold text-[10px]">
            {expertInsight.highlightCategory}
          </span>
        </div>
      </div>

      {/* 4. Công Cụ Tính Lãi Kép Nhanh (Compound Interest Quick Tool - Chuẩn phong cách thiết kế mẫu) */}
      <div
        data-testid="compound-calc-box"
        className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-7 h-7 rounded-lg border border-rose-300 flex items-center justify-center text-rose-600 bg-rose-50/50">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
          </div>
          <h3 className="font-extrabold text-[15px] sm:text-base text-slate-900 tracking-tight">
            Tính Lãi Kép Đầu Tư
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
              Số tiền gốc ban đầu (VNĐ)
            </label>
            <input
              type="number"
              value={principal}
              step={10000000}
              onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
              className="w-full bg-[#f4f5fa] px-4 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
                Lãi suất (%/năm)
              </label>
              <input
                type="number"
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="w-full bg-[#f4f5fa] px-4 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
                Kỳ hạn (Năm)
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="w-full bg-[#f4f5fa] px-4 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Result Box (Hộp kết quả màu xanh Mint/Emerald rõ nét, tươi sáng, nổi bật) */}
          <div className="p-4 rounded-2xl bg-[#d1fae5] dark:bg-emerald-950/60 border-2 border-[#6ee7b7] dark:border-emerald-600 mt-2 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#065f46] dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#059669] dark:bg-emerald-400 shrink-0"></span>
                <span>Tổng giá trị tích lũy dự kiến:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#a7f3d0] dark:bg-emerald-900 text-[#065f46] dark:text-emerald-200 text-[10px] font-extrabold">
                {years} năm
              </span>
            </div>
            <div className="font-black text-[#047857] dark:text-emerald-300 text-2xl sm:text-[26px] tracking-tight tabular-nums">
              {compoundResult.finalAmount.toLocaleString('vi-VN')} đ
            </div>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#bbf7d0] dark:bg-emerald-900/80 text-[#065f46] dark:text-emerald-200 text-xs font-bold">
                <span>▲ Tiền lãi sinh ra: +{compoundResult.profit.toLocaleString('vi-VN')} đ</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tiện Ích Tính Tiền Điện Sinh Hoạt (EVN Tariff Quick Calculator - Đồng bộ phong cách mẫu) */}
      <div
        data-testid="electricity-calc-box"
        className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg border border-amber-300 flex items-center justify-center text-amber-600 bg-amber-50">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </div>
            <h3 className="font-extrabold text-[15px] sm:text-base text-slate-900 tracking-tight">
              Tính Tiền Điện Sinh Hoạt
            </h3>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            EVN 5 bậc mới
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
              Sản lượng điện tiêu thụ (kWh)
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={kwh}
              onChange={(e) => setKwh(Math.max(0, Number(e.target.value) || 0))}
              placeholder="VD: 880"
              className="w-full bg-[#f4f5fa] px-4 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Số ngày trong kỳ
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBillingDays(30)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${billingDays === 30 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200/70 text-slate-600'}`}
                  >
                    30N
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingDays(31)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${billingDays === 31 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200/70 text-slate-600'}`}
                  >
                    31N
                  </button>
                </div>
              </div>
              <input
                type="number"
                min={1}
                max={45}
                value={billingDays}
                onChange={(e) => setBillingDays(Math.max(1, Number(e.target.value) || 30))}
                className="w-full bg-[#f4f5fa] px-4 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
                Thuế suất VAT (%)
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full bg-[#f4f5fa] px-3 py-2.5 rounded-2xl border border-transparent font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all text-xs cursor-pointer h-[42px]"
              >
                <option value={8}>8% (Hiện hành)</option>
                <option value={10}>10% (Chuẩn)</option>
              </select>
            </div>
          </div>

          {/* Result Box (Đồng bộ chuẩn thiết kế Tính Lãi Kép rõ màu, sắc nét) */}
          <div className="p-4 rounded-2xl bg-[#d1fae5] dark:bg-emerald-950/60 border-2 border-[#6ee7b7] dark:border-emerald-600 mt-2 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#065f46] dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#059669] dark:bg-emerald-400 shrink-0"></span>
                <span>Tổng tiền điện thanh toán (gồm VAT):</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#a7f3d0] dark:bg-emerald-900 text-[#065f46] dark:text-emerald-200 text-[10px] font-extrabold">
                {billingDays} ngày
              </span>
            </div>
            <div className="font-black text-[#047857] dark:text-emerald-300 text-2xl sm:text-[26px] tracking-tight tabular-nums">
              {electricResult.totalWithVat.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-[#065f46] dark:text-emerald-300 font-bold flex items-center justify-between pt-0.5">
              <span>Chưa VAT: {electricResult.subtotal.toLocaleString('vi-VN')} đ</span>
              <span>VAT ({vatRate}%): +{electricResult.vatAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300/80 font-medium pt-1 border-t border-[#a7f3d0] dark:border-emerald-800">
              Đơn giá bình quân: <strong className="text-emerald-900 dark:text-emerald-100 font-bold">{electricResult.avgPricePerKwh.toLocaleString('vi-VN')} đ/kWh</strong>
            </div>
          </div>

          {/* Tier Breakdown (Biểu giá 5 bậc chi tiết chuẩn đối chiếu hóa đơn) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTierBreakdown(!showTierBreakdown)}
              className="w-full flex items-center justify-between py-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              <span>{showTierBreakdown ? 'Thu gọn bảng chi tiết bậc thang' : 'Xem chi tiết sản lượng & đơn giá 5 bậc'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {showTierBreakdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>

            {showTierBreakdown && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 animate-fadeIn">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-200 pb-1.5 font-bold">
                      <th className="pb-1.5">Bậc thang</th>
                      <th className="pb-1.5 text-center">ĐƠN GIÁ<br/><span className="text-[9px] font-normal text-slate-400">(đồng/kWh)</span></th>
                      <th className="pb-1.5 text-center">SẢN LƯỢNG<br/><span className="text-[9px] font-normal text-slate-400">(kWh)</span></th>
                      <th className="pb-1.5 text-right">Thành tiền<br/><span className="text-[9px] font-normal text-slate-400">(đồng)</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-mono text-[11px]">
                    {electricResult.breakdown.map((item, idx) => (
                      <tr key={idx} className="py-1.5">
                        <td className="py-1.5 text-slate-800 font-sans font-semibold">{item.name}</td>
                        <td className="py-1.5 text-center text-slate-700 font-semibold">{item.price.toLocaleString('vi-VN')}</td>
                        <td className="py-1.5 text-center font-bold text-emerald-700">{item.kwh}</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">{item.amount.toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                  * Công thức EVN: Sản lượng định mức = (Định mức chuẩn / 30) × {billingDays} ngày sử dụng thực tế.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
